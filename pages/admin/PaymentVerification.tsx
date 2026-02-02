import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/format';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  MessageCircle,
  Copy,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
} from 'lucide-react';

const WHATSAPP_NUMBER = '918883358059';

export default function PaymentVerification() {
  const [search, setSearch] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: pendingOrders, isLoading, refetch } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('payment_method', 'upi')
        .eq('payment_status', 'verification_pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ orderId, status, orderStatus }: { orderId: string; status: string; orderStatus?: string }) => {
      const updates: Record<string, any> = { payment_status: status };
      
      if (status === 'verified') {
        updates.payment_verified_at = new Date().toISOString();
        updates.status = orderStatus || 'payment_confirmed';
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Payment status updated');
    },
    onError: () => {
      toast.error('Failed to update payment');
    },
  });

  const deleteScreenshotMutation = useMutation({
    mutationFn: async ({ orderId, screenshotUrl }: { orderId: string; screenshotUrl: string }) => {
      // Extract file path from URL
      const urlParts = screenshotUrl.split('/payment-screenshots/');
      if (urlParts.length < 2) throw new Error('Invalid screenshot URL');
      
      const filePath = urlParts[1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('payment-screenshots')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Update order to remove screenshot URL
      const { error: updateError } = await supabase
        .from('orders')
        .update({ payment_screenshot_url: null } as any)
        .eq('id', orderId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      toast.success('Screenshot deleted successfully');
    },
    onError: (error) => {
      console.error('Delete screenshot error:', error);
      toast.error('Failed to delete screenshot');
    },
  });

  const handleVerify = async (orderId: string, order: any) => {
    updatePaymentMutation.mutate({ orderId, status: 'verified', orderStatus: 'payment_confirmed' });
    
    const shippingAddress = order.shipping_address as any;
    
    // Create billing record automatically
    try {
      const billItems = order.order_items?.map((item: any) => ({
        id: crypto.randomUUID(),
        product_id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total_price,
      })) || [];

      const billData = {
        customer_name: shippingAddress?.full_name || 'Customer',
        customer_email: shippingAddress?.email || null,
        customer_phone: shippingAddress?.phone || null,
        order_id: orderId,
        items: billItems as any,
        subtotal: order.subtotal || 0,
        tax_amount: order.tax_amount || 0,
        discount_amount: 0,
        total_amount: order.total_amount || 0,
        notes: `Auto-generated from order ${order.order_number}`,
      };

      const { error: billError } = await supabase
        .from('billing_records')
        .insert(billData as any);

      if (!billError) {
        toast.success('Billing record created automatically');
        queryClient.invalidateQueries({ queryKey: ['admin-billing'] });
      }
    } catch (billErr) {
      console.error('Failed to create billing record:', billErr);
    }
    
    // Send invoice email after verification
    try {
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          orderId,
          orderNumber: order.order_number,
          customerName: shippingAddress?.full_name,
          customerEmail: shippingAddress?.email || order.customer_email,
          customerPhone: shippingAddress?.phone,
          items: order.order_items,
          subtotal: order.subtotal,
          tax: order.tax_amount,
          shipping: order.shipping_amount,
          total: order.total_amount,
          paymentMethod: 'UPI',
          transactionId: order.upi_transaction_id,
        },
      });
      
      if (!error) {
        toast.success('Invoice email sent to customer');
      }
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
    }
  };

  const handleReject = (orderId: string) => {
    updatePaymentMutation.mutate({ orderId, status: 'failed' });
  };

  const handleCopyTransactionId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Transaction ID copied');
  };

  const handleWhatsAppCustomer = (phone: string, orderNumber: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const message = encodeURIComponent(
      `Hello! Regarding your order ${orderNumber}, we need to verify your payment. Please share the payment screenshot or transaction details.`
    );
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const handleDeleteScreenshot = (orderId: string, screenshotUrl: string) => {
    deleteScreenshotMutation.mutate({ orderId, screenshotUrl });
  };

  const filteredOrders = pendingOrders?.filter(order => {
    const searchLower = search.toLowerCase();
    const shippingAddress = order.shipping_address as any;
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.upi_transaction_id?.toLowerCase().includes(searchLower) ||
      shippingAddress?.full_name?.toLowerCase().includes(searchLower) ||
      shippingAddress?.phone?.includes(search)
    );
  }) || [];

  const stats = {
    total: pendingOrders?.length || 0,
    totalAmount: pendingOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Payment Verification
          </h1>
          <p className="text-muted-foreground">Manage pending UPI payment verifications</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Verifications
            </CardDescription>
            <CardTitle className="text-4xl text-warning">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Orders waiting for payment verification
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pending Amount
            </CardDescription>
            <CardTitle className="text-4xl text-primary">{formatCurrency(stats.totalAmount)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total value of pending payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending payments */}
      {stats.total > 0 && (
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning">Action Required</p>
            <p className="text-sm text-muted-foreground">
              You have {stats.total} order{stats.total > 1 ? 's' : ''} pending payment verification. 
              Please verify or reject payments promptly to process orders.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order, transaction ID, name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="py-16 text-center">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground">No pending payment verifications at the moment.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Screenshot</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const shippingAddress = order.shipping_address as any;
                const screenshotUrl = (order as any).payment_screenshot_url;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link 
                        to={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {order.order_items?.length || 0} items
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{shippingAddress?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{shippingAddress?.phone}</p>
                    </TableCell>
                    <TableCell>
                      {order.upi_transaction_id ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                            {order.upi_transaction_id}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyTransactionId(order.upi_transaction_id!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {screenshotUrl ? (
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1"
                              >
                                <ImageIcon className="h-3 w-3" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Payment Screenshot - {order.order_number}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="relative rounded-lg overflow-hidden border bg-muted">
                                  <img
                                    src={screenshotUrl}
                                    alt="Payment Screenshot"
                                    className="w-full h-auto max-h-[60vh] object-contain"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(screenshotUrl, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Full Size
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Screenshot
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Screenshot?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete the payment screenshot for order {order.order_number}. 
                                          This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteScreenshot(order.id, screenshotUrl)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          No screenshot
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleWhatsAppCustomer(shippingAddress?.phone || '', order.order_number)}
                          title="Contact on WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <Link to={`/admin/orders/${order.id}`} title="View Order">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                          onClick={() => handleVerify(order.id, order)}
                          title="Verify Payment"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Reject Payment"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Payment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the payment as failed for order {order.order_number}. 
                                The customer will need to retry the payment.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleReject(order.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Reject Payment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
