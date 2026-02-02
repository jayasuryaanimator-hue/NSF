import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatOrderStatus,
  formatPaymentStatus,
  getStatusBadgeClass,
} from '@/lib/format';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Package,
  ChevronRight,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  MessageCircle,
  RefreshCcw,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReturnMessages, useReturnUnreadCount } from '@/components/returns/ReturnMessages';

const WHATSAPP_NUMBER = '919876543210';

const orderStatusSteps = [
  { status: 'order_placed', label: 'Order Placed', icon: ShoppingBag },
  { status: 'payment_confirmed', label: 'Payment Confirmed', icon: CheckCircle },
  { status: 'product_packed', label: 'Packed', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const returnReasons = [
  'Product damaged',
  'Wrong product received',
  'Product not as described',
  'Quality not satisfactory',
  'Changed my mind',
  'Other',
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            product_image,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const { data: existingReturn } = useQuery({
    queryKey: ['order-return', id],
    queryFn: async () => {
      if (!user || !id) return null;

      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('order_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const getStatusStepIndex = (status: string) => {
    if (status === 'payment_verification_pending') return 0;
    if (status === 'cancelled') return -1;
    return orderStatusSteps.findIndex((s) => s.status === status);
  };

  const currentStepIndex = order ? getStatusStepIndex(order.status) : 0;
  const isDelivered = order?.status === 'delivered';
  const isCancelled = order?.status === 'cancelled';
  const canCancel = order && !['delivered', 'cancelled'].includes(order.status);
  const canReturn = isDelivered && !existingReturn;

  // Get unread message count for return
  const returnUnreadCount = useReturnUnreadCount(existingReturn?.id, 'customer');

  // Check if cancellation needs WhatsApp (after packed)
  const needsWhatsAppCancel = order && ['product_packed', 'shipped', 'out_for_delivery'].includes(order.status);

  const handleWhatsAppCancel = () => {
    const message = encodeURIComponent(
      `Hello! I would like to cancel my order.\n\nOrder Number: ${order?.order_number}\nEmail: ${user?.email}\n\nPlease help me with the cancellation.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const handleSubmitReturn = async () => {
    if (!order || !user || !returnReason) return;

    setIsSubmittingReturn(true);

    try {
      const { error } = await supabase.from('returns').insert({
        order_id: order.id,
        user_id: user.id,
        reason: returnReason,
        description: returnDescription || null,
        refund_amount: order.total_amount,
      });

      if (error) throw error;

      toast.success('Return request submitted successfully');
      setShowReturnDialog(false);
      refetch();
    } catch (error) {
      console.error('Return submission error:', error);
      toast.error('Failed to submit return request');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container-deiva section-padding text-center">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Button asChild>
            <Link to="/auth?redirect=/orders">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container-deiva section-padding flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container-deiva section-padding text-center">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Button asChild>
            <Link to="/orders">View All Orders</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const shippingAddress = order.shipping_address as any;

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <Button variant="ghost" asChild className="mb-2">
                  <Link to="/orders">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold">{order.order_number}</h1>
                <p className="text-muted-foreground">
                  Placed on {formatDateTime(order.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={getStatusBadgeClass(order.status)}>
                  {formatOrderStatus(order.status)}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Status Timeline */}
                {!isCancelled && (
                  <div className="bg-card rounded-xl border p-6">
                    <h2 className="font-semibold mb-6">Order Status</h2>
                    <div className="relative">
                      {orderStatusSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const StatusIcon = step.icon;

                        return (
                          <div key={step.status} className="flex items-start gap-4 pb-8 last:pb-0">
                            <div className="relative">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  isCompleted
                                    ? 'bg-success text-success-foreground'
                                    : 'bg-secondary text-muted-foreground'
                                }`}
                              >
                                <StatusIcon className="h-5 w-5" />
                              </div>
                              {index < orderStatusSteps.length - 1 && (
                                <div
                                  className={`absolute left-1/2 top-10 w-0.5 h-8 -translate-x-1/2 ${
                                    isCompleted && index < currentStepIndex
                                      ? 'bg-success'
                                      : 'bg-secondary'
                                  }`}
                                />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                                {step.label}
                              </p>
                              {isCurrent && order.status === 'payment_verification_pending' && (
                                <p className="text-sm text-warning">Payment verification pending</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cancelled Notice */}
                {isCancelled && (
                  <div className="bg-destructive/10 border border-destructive rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-6 w-6 text-destructive" />
                      <div>
                        <h3 className="font-semibold text-destructive">Order Cancelled</h3>
                        {order.cancellation_reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {order.cancellation_reason}
                          </p>
                        )}
                        {order.cancelled_at && (
                          <p className="text-sm text-muted-foreground">
                            Cancelled on {formatDateTime(order.cancelled_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Return Status */}
                {existingReturn && (
                  <div className="bg-primary/5 border border-primary rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <RefreshCcw className="h-6 w-6 text-primary" />
                        {returnUnreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                            {returnUnreadCount > 9 ? '9+' : returnUnreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Return Request</h3>
                          {returnUnreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {returnUnreadCount} new message{returnUnreadCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="font-medium capitalize">{existingReturn.status}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reason: {existingReturn.reason}
                        </p>
                      </div>
                    </div>
                    
                    {/* Return Messages */}
                    <div className="border-t border-primary/20 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm">Conversation with Admin</h4>
                      </div>
                      <ReturnMessages 
                        returnId={existingReturn.id} 
                        senderType="customer" 
                      />
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="bg-card rounded-xl border p-6">
                  <h2 className="font-semibold mb-4">Order Items</h2>
                  <div className="space-y-4">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.unit_price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {canCancel && !needsWhatsAppCancel && (
                    <Button variant="outline" className="text-destructive">
                      Cancel Order
                    </Button>
                  )}
                  {needsWhatsAppCancel && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleWhatsAppCancel}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Contact for Cancellation
                    </Button>
                  )}
                  {canReturn && (
                    <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <RefreshCcw className="h-4 w-4" />
                          Request Return/Refund
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Return/Refund</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Reason for Return *</Label>
                            <Select value={returnReason} onValueChange={setReturnReason}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {returnReasons.map((reason) => (
                                  <SelectItem key={reason} value={reason}>
                                    {reason}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Additional Details (Optional)</Label>
                            <Textarea
                              value={returnDescription}
                              onChange={(e) => setReturnDescription(e.target.value)}
                              placeholder="Please provide more details..."
                              className="mt-1"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Return/refund window: 7 days from delivery
                          </p>
                          <Button
                            onClick={handleSubmitReturn}
                            disabled={!returnReason || isSubmittingReturn}
                            className="w-full"
                          >
                            {isSubmittingReturn ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Request'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="bg-card rounded-xl border p-6">
                  <h2 className="font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatCurrency(order.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {order.shipping_amount === 0
                          ? 'Free'
                          : formatCurrency(order.shipping_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-card rounded-xl border p-6">
                  <h2 className="font-semibold mb-4">Payment</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method</span>
                      <span className="capitalize">{order.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span>{formatPaymentStatus(order.payment_status)}</span>
                    </div>
                    {order.upi_transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID</span>
                        <span className="font-mono text-xs">{order.upi_transaction_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-card rounded-xl border p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h2>
                  {shippingAddress && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{shippingAddress.full_name}</p>
                      <p>{shippingAddress.phone}</p>
                      <p>{shippingAddress.address_line1}</p>
                      {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
                      <p>
                        {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postal_code}
                      </p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
