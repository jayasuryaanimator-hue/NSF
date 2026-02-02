import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calculateTotal } from '@/lib/format';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UPIPaymentSection } from '@/components/payment/UPIPaymentSection';

const WHATSAPP_NUMBER = '918883358059';
const UPI_ID = 'nsanthoshnatesan-1@okicici';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(6, 'Valid postal code is required'),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  
  const [step, setStep] = useState<'address' | 'payment' | 'upi'>('address');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('upi');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  
  const [addressData, setAddressData] = useState<AddressFormData>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  const shippingCost = subtotal >= 499 ? 0 : 50;
  const { tax, total } = calculateTotal(subtotal, shippingCost);

  // Generate UPI QR code URL with amount
  const upiQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `upi://pay?pa=${UPI_ID}&pn=Gounder%20And%20Co&am=${total.toFixed(2)}&cu=INR&tn=Order%20Payment`
  )}`;

  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=/checkout');
    } else if (items.length === 0) {
      navigate('/cart');
    }
  }, [user, items, navigate]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
    if (addressErrors[name as keyof AddressFormData]) {
      setAddressErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateAddress = () => {
    try {
      addressSchema.parse(addressData);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Partial<Record<keyof AddressFormData, string>> = {};
        err.errors.forEach(error => {
          if (error.path[0]) {
            errors[error.path[0] as keyof AddressFormData] = error.message;
          }
        });
        setAddressErrors(errors);
      }
      return false;
    }
  };

  const handleContinueToPayment = () => {
    if (validateAddress()) {
      setStep('payment');
    }
  };

  const handlePaymentMethodSelect = () => {
    if (paymentMethod === 'upi') {
      setStep('upi');
    } else {
      handlePlaceOrder();
    }
  };

  const handleScreenshotUpload = (file: File) => {
    setScreenshotFile(file);
  };

  const uploadScreenshotToStorage = async (orderId: string): Promise<string | null> => {
    if (!screenshotFile || !user) return null;

    setIsUploadingScreenshot(true);
    try {
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `${user.id}/${orderId}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshotFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Screenshot upload error:', error);
      toast.error('Failed to upload screenshot, but order will be placed');
      return null;
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) return;

    if (paymentMethod === 'upi' && !upiTransactionId.trim()) {
      toast.error('Please enter the UPI Transaction ID');
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingAddress = {
        full_name: addressData.fullName,
        email: addressData.email,
        phone: addressData.phone,
        address_line1: addressData.addressLine1,
        address_line2: addressData.addressLine2 || null,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postalCode,
        country: 'India',
      };

      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          payment_method: paymentMethod as 'cod' | 'upi',
          payment_status: (paymentMethod === 'cod' ? 'pending' : 'verification_pending') as 'pending' | 'verification_pending',
          subtotal: subtotal,
          tax_amount: tax,
          shipping_amount: shippingCost,
          total_amount: total,
          shipping_address: shippingAddress as any,
          upi_transaction_id: paymentMethod === 'upi' ? upiTransactionId : null,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Upload screenshot if available
      if (screenshotFile && paymentMethod === 'upi') {
        const screenshotUrl = await uploadScreenshotToStorage(order.id);
        if (screenshotUrl) {
          await supabase
            .from('orders')
            .update({ payment_screenshot_url: screenshotUrl } as any)
            .eq('id', order.id);
        }
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        product_image: item.image || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderNumber(order.order_number);
      setShowSuccessDialog(true);
      clearCart();

    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || items.length === 0) {
    return (
      <Layout>
        <div className="container-deiva section-padding text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-12">
              {['Address', 'Payment', paymentMethod === 'upi' ? 'UPI Payment' : 'Confirm'].map((label, index) => {
                const stepIndex = index;
                const currentIndex = step === 'address' ? 0 : step === 'payment' ? 1 : 2;
                const isActive = stepIndex === currentIndex;
                const isCompleted = stepIndex < currentIndex;

                return (
                  <div key={label} className="flex items-center">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                          ? 'bg-success text-success-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : stepIndex + 1}
                    </div>
                    <span className={`ml-2 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                    {index < 2 && (
                      <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-success' : 'bg-secondary'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form Area */}
              <div className="lg:col-span-2">
                {/* Step 1: Address */}
                {step === 'address' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card rounded-xl border p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Truck className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold">Shipping Address</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={addressData.fullName}
                          onChange={handleAddressChange}
                          placeholder="John Doe"
                          className={addressErrors.fullName ? 'border-destructive' : ''}
                        />
                        {addressErrors.fullName && (
                          <p className="text-sm text-destructive mt-1">{addressErrors.fullName}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={addressData.email}
                          onChange={handleAddressChange}
                          placeholder="you@example.com"
                          className={addressErrors.email ? 'border-destructive' : ''}
                        />
                        {addressErrors.email && (
                          <p className="text-sm text-destructive mt-1">{addressErrors.email}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Invoice will be sent to this email</p>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={addressData.phone}
                          onChange={handleAddressChange}
                          placeholder="+91 98765 43210"
                          className={addressErrors.phone ? 'border-destructive' : ''}
                        />
                        {addressErrors.phone && (
                          <p className="text-sm text-destructive mt-1">{addressErrors.phone}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="addressLine1">Address Line 1 *</Label>
                        <Input
                          id="addressLine1"
                          name="addressLine1"
                          value={addressData.addressLine1}
                          onChange={handleAddressChange}
                          placeholder="House/Flat No., Building Name, Street"
                          className={addressErrors.addressLine1 ? 'border-destructive' : ''}
                        />
                        {addressErrors.addressLine1 && (
                          <p className="text-sm text-destructive mt-1">{addressErrors.addressLine1}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                        <Input
                          id="addressLine2"
                          name="addressLine2"
                          value={addressData.addressLine2}
                          onChange={handleAddressChange}
                          placeholder="Landmark, Area"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={addressData.city}
                          onChange={handleAddressChange}
                          placeholder="Mumbai"
                          className={addressErrors.city ? 'border-destructive' : ''}
                        />
                        {addressErrors.city && (
                          <p className="text-sm text-destructive mt-1">{addressErrors.city}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          name="state"
                          value={addressData.state}
                          onChange={handleAddressChange}
                          placeholder="Maharashtra"
                          className={addressErrors.state ? 'border-destructive' : ''}
                        />
                        {addressErrors.state && (
                          <p className="text-sm text-destructive mt-1">{addressErrors.state}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal Code *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={addressData.postalCode}
                          onChange={handleAddressChange}
                          placeholder="400001"
                          className={addressErrors.postalCode ? 'border-destructive' : ''}
                        />
                        {addressErrors.postalCode && (
                          <p className="text-sm text-destructive mt-1">{addressErrors.postalCode}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" asChild>
                        <Link to="/cart">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Cart
                        </Link>
                      </Button>
                      <Button onClick={handleContinueToPayment} className="flex-1">
                        Continue to Payment
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Payment Method */}
                {step === 'payment' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card rounded-xl border p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold">Payment Method</h2>
                    </div>

                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v as 'cod' | 'upi')}
                      className="space-y-4"
                    >
                      <div
                        className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          paymentMethod === 'upi' ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setPaymentMethod('upi')}
                      >
                        <RadioGroupItem value="upi" id="upi" />
                        <Label htmlFor="upi" className="flex-1 cursor-pointer">
                          <span className="font-semibold">Pay Online (UPI)</span>
                          <p className="text-sm text-muted-foreground">
                            Pay using UPI apps like GPay, PhonePe, Paytm
                          </p>
                        </Label>
                      </div>
                      <div
                        className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          paymentMethod === 'cod' ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setPaymentMethod('cod')}
                      >
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                          <span className="font-semibold">Cash on Delivery (COD)</span>
                          <p className="text-sm text-muted-foreground">
                            Pay when your order arrives
                          </p>
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" onClick={() => setStep('address')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button onClick={handlePaymentMethodSelect} className="flex-1">
                        {paymentMethod === 'upi' ? 'Continue to UPI Payment' : 'Place Order'}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: UPI Payment */}
                {step === 'upi' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <UPIPaymentSection
                      amount={total}
                      userEmail={user?.email}
                      transactionId={upiTransactionId}
                      onTransactionIdChange={setUpiTransactionId}
                      qrCodeUrl={upiQrCodeUrl}
                      onScreenshotUpload={handleScreenshotUpload}
                    />

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep('payment')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting || isUploadingScreenshot || !upiTransactionId.trim()}
                        className="flex-1"
                      >
                        {isSubmitting || isUploadingScreenshot ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isUploadingScreenshot ? 'Uploading Screenshot...' : 'Placing Order...'}
                          </>
                        ) : (
                          'Place Order'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border p-6 sticky top-24">
                  <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                  {/* Items */}
                  <div className="space-y-3 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={shippingCost === 0 ? 'text-success' : ''}>
                        {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              Order Placed Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Your order has been placed. Order number:
            </p>
            <p className="text-2xl font-bold text-primary mb-6">{orderNumber}</p>
            {paymentMethod === 'upi' && (
              <p className="text-sm text-muted-foreground mb-4">
                Your payment is being verified. You'll receive a confirmation once verified.
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/orders">View Orders</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
