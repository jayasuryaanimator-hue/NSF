import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy, 
  MessageCircle,
  Shield,
  AlertTriangle,
  ExternalLink,
  Image as ImageIcon,
  Trash2,
  Mail
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatPaymentStatus, getStatusBadgeClass } from '@/lib/format';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const WHATSAPP_NUMBER = '918124584569';

interface PaymentVerificationCardProps {
  order: {
    payment_method: string;
    payment_status: string | null;
    upi_transaction_id: string | null;
    total_amount: number;
    payment_verified_at: string | null;
    created_at: string;
    order_number: string;
    payment_screenshot_url?: string | null;
  };
  shippingAddress: {
    full_name?: string;
    phone?: string;
  } | null;
  onVerifyPayment?: () => void;
  onRejectPayment?: () => void;
  onDeleteScreenshot?: () => void;
  onResendInvoice?: () => void;
}

export function PaymentVerificationCard({ 
  order, 
  shippingAddress,
  onVerifyPayment,
  onRejectPayment,
  onDeleteScreenshot,
  onResendInvoice
}: PaymentVerificationCardProps) {
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isUPI = order.payment_method === 'upi';
  const isPendingVerification = order.payment_status === 'verification_pending';

  const handleDeleteScreenshot = () => {
    setShowDeleteConfirm(false);
    onDeleteScreenshot?.();
  };

  const handleCopyTransactionId = () => {
    if (order.upi_transaction_id) {
      navigator.clipboard.writeText(order.upi_transaction_id);
      toast.success('Transaction ID copied');
    }
  };

  const handleWhatsAppCustomer = () => {
    if (shippingAddress?.phone) {
      const phone = shippingAddress.phone.replace(/\D/g, '');
      const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
      const message = encodeURIComponent(
        `Hello ${shippingAddress?.full_name || 'Customer'},\n\nRegarding your order ${order.order_number}:\n\n`
      );
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    }
  };

  return (
    <>
      <Card className={`${isPendingVerification ? 'border-warning/50 bg-warning/5' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </span>
            {isPendingVerification && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                Verification Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Method */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Payment Method</span>
            <Badge variant="secondary" className="uppercase font-medium">
              {order.payment_method}
            </Badge>
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Amount</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(order.total_amount)}</span>
          </div>

          {/* Payment Status */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge className={getStatusBadgeClass(order.payment_status || 'pending')}>
              {formatPaymentStatus(order.payment_status || 'pending')}
            </Badge>
          </div>

          {/* UPI Transaction ID */}
          {isUPI && order.upi_transaction_id && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">UPI Transaction ID (UTR)</span>
                <Button variant="ghost" size="sm" onClick={handleCopyTransactionId} className="h-6 px-2">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <code className="text-sm font-mono font-semibold block">{order.upi_transaction_id}</code>
            </div>
          )}

          {/* Payment Screenshot */}
          {isUPI && order.payment_screenshot_url && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Payment Screenshot
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setShowScreenshot(true)} className="h-6 px-2">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <img 
                src={order.payment_screenshot_url} 
                alt="Payment screenshot" 
                className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowScreenshot(true)}
              />
            </div>
          )}

          {/* No Screenshot Uploaded */}
          {isUPI && !order.payment_screenshot_url && isPendingVerification && (
            <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <ImageIcon className="h-3 w-3" />
                No payment screenshot uploaded
              </p>
            </div>
          )}

          {/* Verification Time & Resend Invoice */}
          {order.payment_verified_at && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Verified At
                </span>
                <span>{formatDateTime(order.payment_verified_at)}</span>
              </div>
              {onResendInvoice && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={onResendInvoice}
                >
                  <Mail className="h-4 w-4" />
                  Resend Invoice Email
                </Button>
              )}
            </div>
          )}

          {/* Order Date */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Order Placed</span>
            <span>{formatDateTime(order.created_at)}</span>
          </div>

          {/* Verification Actions for Pending UPI Payments */}
          {isUPI && isPendingVerification && (
            <>
              <div className="border-t pt-4 space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    Verify the UTR number in your bank/UPI statement before confirming payment
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-success border-success hover:bg-success/10"
                    onClick={onVerifyPayment}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verify
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={onRejectPayment}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>

                {shippingAddress?.phone && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={handleWhatsAppCustomer}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact Customer on WhatsApp
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Security Note */}
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Secure Payment Verification
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Modal */}
      <Dialog open={showScreenshot} onOpenChange={setShowScreenshot}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {order.payment_screenshot_url && (
            <img 
              src={order.payment_screenshot_url} 
              alt="Payment screenshot" 
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Screenshot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the payment screenshot. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteScreenshot} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
