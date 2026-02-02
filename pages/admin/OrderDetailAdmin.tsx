import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime, formatOrderStatus, formatPaymentStatus, getStatusBadgeClass } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/integrations/supabase/types';
import { useState } from 'react';
import { PaymentVerificationCard } from '@/components/admin/PaymentVerificationCard';

type OrderStatus = Database['public']['Enums']['order_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

const ORDER_STATUSES: OrderStatus[] = [
  'order_placed',
  'payment_verification_pending',
  'payment_confirmed',
  'product_packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'pending',
  'verification_pending',
  'verified',
  'failed',
  'refunded'
];

export default function OrderDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated');
    },
    onError: (error) => {
      toast.error('Failed to update order');
      console.error(error);
    },
  });

  const handleStatusChange = (newStatus: OrderStatus) => {
    const updates: Record<string, any> = { status: newStatus };
    
    if (newStatus === 'product_packed') updates.packed_at = new Date().toISOString();
    if (newStatus === 'shipped') updates.shipped_at = new Date().toISOString();
    if (newStatus === 'out_for_delivery') updates.out_for_delivery_at = new Date().toISOString();
    if (newStatus === 'delivered') updates.delivered_at = new Date().toISOString();
    if (newStatus === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = cancellationReason;
    }
    
    updateOrderMutation.mutate(updates);
  };

  const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
    const updates: Record<string, any> = { payment_status: newStatus };
    
    if (newStatus === 'verified') {
      updates.payment_verified_at = new Date().toISOString();
      if (order?.status === 'payment_verification_pending') {
        updates.status = 'payment_confirmed';
      }
      
      // Send invoice email
      try {
        const shippingAddr = order?.shipping_address as any;
        const { error } = await supabase.functions.invoke('send-invoice-email', {
          body: {
            orderId: order?.id,
            orderNumber: order?.order_number,
            customerName: shippingAddr?.full_name || 'Customer',
            customerEmail: shippingAddr?.email,
            customerPhone: shippingAddr?.phone,
            items: order?.order_items?.map((item: any) => ({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
            })) || [],
            subtotal: order?.subtotal || 0,
            tax: order?.tax_amount || 0,
            shipping: order?.shipping_amount || 0,
            total: order?.total_amount || 0,
            paymentMethod: order?.payment_method?.toUpperCase() || 'UPI',
            transactionId: order?.upi_transaction_id,
          },
        });
        
        if (error) {
          console.error('Invoice email error:', error);
          toast.error('Payment verified but invoice email failed');
        } else {
          toast.success('Payment verified & invoice sent');
        }
      } catch (err) {
        console.error('Invoice email error:', err);
      }
    }
    
    updateOrderMutation.mutate(updates);
  };

  const handleNotesUpdate = () => {
    updateOrderMutation.mutate({ notes });
  };

  const handleDeleteScreenshot = async () => {
    if (!order?.payment_screenshot_url) return;
    
    try {
      // Extract the file path from the URL
      const url = new URL(order.payment_screenshot_url);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(p => p === 'payment-screenshots');
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('payment-screenshots')
          .remove([filePath]);
        
        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }
      
      // Update order to remove screenshot URL
      updateOrderMutation.mutate({ payment_screenshot_url: null });
      toast.success('Screenshot deleted');
    } catch (error) {
      console.error('Delete screenshot error:', error);
      toast.error('Failed to delete screenshot');
    }
  };

  const handleResendInvoice = async () => {
    if (!order) return;
    
    try {
      const shippingAddr = order.shipping_address as any;
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: shippingAddr?.full_name || 'Customer',
          customerEmail: shippingAddr?.email,
          customerPhone: shippingAddr?.phone,
          items: order.order_items?.map((item: any) => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })) || [],
          subtotal: order.subtotal || 0,
          tax: order.tax_amount || 0,
          shipping: order.shipping_amount || 0,
          total: order.total_amount || 0,
          paymentMethod: order.payment_method?.toUpperCase() || 'UPI',
          transactionId: order.upi_transaction_id,
        },
      });
      
      if (error) {
        console.error('Invoice email error:', error);
        toast.error('Failed to send invoice email');
      } else {
        toast.success('Invoice email sent');
      }
    } catch (err) {
      console.error('Invoice email error:', err);
      toast.error('Failed to send invoice email');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button onClick={() => navigate('/admin/orders')} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  const shippingAddress = order.shipping_address as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {item.product_image ? (
                      <img 
                        src={item.product_image} 
                        alt={item.product_name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.total_price)}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{formatCurrency(order.shipping_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { status: 'Order Placed', date: order.created_at, completed: true },
                  { status: 'Payment Verified', date: order.payment_verified_at, completed: !!order.payment_verified_at },
                  { status: 'Product Packed', date: order.packed_at, completed: !!order.packed_at },
                  { status: 'Shipped', date: order.shipped_at, completed: !!order.shipped_at },
                  { status: 'Out for Delivery', date: order.out_for_delivery_at, completed: !!order.out_for_delivery_at },
                  { status: 'Delivered', date: order.delivered_at, completed: !!order.delivered_at },
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.completed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={step.completed ? 'font-medium' : 'text-muted-foreground'}>
                        {step.status}
                      </p>
                      {step.date && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(step.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {order.status === 'cancelled' && (
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-destructive">Cancelled</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.cancelled_at)}
                      </p>
                      {order.cancellation_reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Reason: {order.cancellation_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes || order.notes || ''}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this order..."
                rows={3}
              />
              <Button onClick={handleNotesUpdate} disabled={updateOrderMutation.isPending}>
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Update Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Order Status</Label>
                <Select value={order.status || ''} onValueChange={(v) => handleStatusChange(v as OrderStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatOrderStatus(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={order.payment_status || ''} onValueChange={(v) => handlePaymentStatusChange(v as PaymentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatPaymentStatus(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {order.status !== 'cancelled' && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Cancel Order</Label>
                  <Input
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Reason for cancellation"
                  />
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={!cancellationReason || updateOrderMutation.isPending}
                  >
                    Cancel Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Verification Card */}
          <PaymentVerificationCard
            order={{
              payment_method: order.payment_method,
              payment_status: order.payment_status,
              upi_transaction_id: order.upi_transaction_id,
              total_amount: order.total_amount,
              payment_verified_at: order.payment_verified_at,
              created_at: order.created_at,
              order_number: order.order_number,
              payment_screenshot_url: order.payment_screenshot_url,
            }}
            shippingAddress={shippingAddress}
            onVerifyPayment={() => handlePaymentStatusChange('verified')}
            onRejectPayment={() => handlePaymentStatusChange('failed')}
            onDeleteScreenshot={handleDeleteScreenshot}
            onResendInvoice={order.payment_verified_at ? handleResendInvoice : undefined}
          />

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{shippingAddress?.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {shippingAddress?.address_line1}
                {shippingAddress?.address_line2 && <>, {shippingAddress.address_line2}</>}
              </p>
              <p className="text-sm text-muted-foreground">
                {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postal_code}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{shippingAddress?.phone}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
