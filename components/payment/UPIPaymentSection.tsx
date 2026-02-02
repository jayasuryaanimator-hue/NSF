import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Copy, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  QrCode,
  Smartphone,
  Camera,
  Send,
  Check,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { motion } from 'framer-motion';

const WHATSAPP_NUMBER = '918675255084';
const UPI_ID = 'krameshjet-2@oksbi';

interface UPIPaymentSectionProps {
  amount: number;
  userEmail?: string;
  onTransactionIdChange: (id: string) => void;
  transactionId: string;
  qrCodeUrl?: string;
  onScreenshotUpload?: (file: File) => void;
}

export function UPIPaymentSection({
  amount,
  userEmail,
  onTransactionIdChange,
  transactionId,
  qrCodeUrl,
  onScreenshotUpload
}: UPIPaymentSectionProps) {
  const [copied, setCopied] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onScreenshotUpload?.(file);
      toast.success('Screenshot uploaded successfully');
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleWhatsAppScreenshot = () => {
    const message = encodeURIComponent(
      `Hello! I have completed my payment for New Sathiya Furniture order.\n\nEmail: ${userEmail || 'Not provided'}\nAmount: ${formatCurrency(amount)}\nUPI ID: ${UPI_ID}\nUPI Transaction ID: ${transactionId || 'To be shared'}\n\nPlease verify my payment.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const paymentSteps = [
    {
      number: 1,
      title: 'Scan the QR Code',
      description: 'Open any UPI-enabled payment app and scan the QR code shown'
    },
    {
      number: 2,
      title: 'Enter Amount & Pay',
      description: `Enter the exact amount of ${formatCurrency(amount)} and complete the payment`
    },
    {
      number: 3,
      title: 'Take a Screenshot',
      description: 'Capture the payment confirmation screen showing the UTR number and time'
    },
    {
      number: 4,
      title: 'Upload Screenshot Below',
      description: 'Use the upload button below to attach your payment screenshot'
    },
    {
      number: 5,
      title: 'Share via WhatsApp',
      description: 'Click the WhatsApp button to send payment details and screenshot to our support'
    },
    {
      number: 6,
      title: 'Verification & Processing',
      description: 'Our team will verify and process your order within 15-20 minutes'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Secure Payment Gateway
        </h2>
        <p className="text-muted-foreground mt-2">
          Complete your transaction with our trusted payment system
        </p>
      </div>

      {/* Main Payment Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Scan & Pay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border-t-4 border-t-primary p-6 shadow-lg"
        >
          <h3 className="text-xl font-semibold text-center mb-4">Scan & Pay</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Use any UPI app to scan the QR code below
          </p>

          {/* QR Code */}
          <div className="relative mx-auto w-fit">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
              QR #1
            </div>
            <div className="w-48 h-48 mx-auto bg-white rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center p-4 relative overflow-hidden">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <QrCode className="h-24 w-24 text-primary/70 mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">UPI QR Code</p>
                </div>
              )}
              {/* Center decoration */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg opacity-90">
                  <span className="text-white font-bold text-sm">NSF</span>
                </div>
              </div>
            </div>
          </div>

          {/* UPI ID */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground text-center mb-2">UPI ID for manual payment</p>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-4 py-3 border">
              <code className="flex-1 text-sm font-mono text-center break-all">{UPI_ID}</code>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCopyUPI}
                className="hover:bg-primary/10 flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Registered Mobile: <span className="font-medium text-foreground">8675255084</span>
            </p>
          </div>

          {/* Amount */}
          <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">Amount to Pay</p>
            <p className="text-3xl font-bold text-primary mt-1 text-center">
              {formatCurrency(amount)}
            </p>
            <p className="text-xs text-center text-muted-foreground mt-1">
              Pay exact amount to UPI ID: <span className="font-mono text-xs">{UPI_ID}</span>
            </p>
          </div>

          {/* Alternative payments note */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              For any payment issues, please contact our support team on WhatsApp for assistance.
            </p>
          </div>
        </motion.div>

        {/* Right: Payment Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border-t-4 border-t-green-500 p-6 shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-6">Payment Instructions</h3>

          <div className="space-y-4">
            {paymentSteps.map((step, index) => (
              <motion.div 
                key={step.number}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white flex items-center justify-center font-semibold text-sm shadow-md">
                  {step.number}
                </div>
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Important notice */}
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              Please ensure your payment screenshot includes the <strong>transaction ID (UTR)</strong> for faster verification
            </p>
          </div>
        </motion.div>
      </div>

      {/* Screenshot Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-2xl p-6 shadow-lg border"
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Upload Payment Screenshot
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          After completing the payment, upload a screenshot of your payment confirmation
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          ref={fileInputRef}
          className="hidden"
          id="screenshot-upload"
        />

        {screenshotPreview ? (
          <div className="relative">
            <div className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden border-2 border-green-500">
              <img 
                src={screenshotPreview} 
                alt="Payment Screenshot" 
                className="w-full h-auto max-h-64 object-contain bg-muted"
              />
              <div className="absolute top-2 right-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRemoveScreenshot}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Screenshot Uploaded
              </div>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 text-center mt-3 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {screenshotFile?.name}
            </p>
          </div>
        ) : (
          <label
            htmlFor="screenshot-upload"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="h-10 w-10 text-primary/70 mb-3" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG or JPEG (MAX. 5MB)
              </p>
            </div>
          </label>
        )}
      </motion.div>

      {/* Confirm Payment Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl p-6 shadow-lg border text-center"
      >
        <h3 className="text-xl font-semibold mb-2">Confirm Your Payment</h3>
        <p className="text-sm text-muted-foreground mb-6">
          After completing the payment and uploading screenshot, send the details<br />
          to our support team via WhatsApp for verification
        </p>

        {/* Transaction ID Input */}
        <div className="max-w-md mx-auto mb-4">
          <Label htmlFor="upiTransactionId" className="text-left block mb-2">UPI Transaction ID *</Label>
          <Input
            id="upiTransactionId"
            value={transactionId}
            onChange={(e) => onTransactionIdChange(e.target.value)}
            placeholder="Enter your 12-digit UTR number"
            className="text-center"
          />
          <p className="text-xs text-muted-foreground mt-1">
            You can find this in your UPI app payment history
          </p>
        </div>

        <Button
          size="lg"
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white gap-2 px-8"
          onClick={handleWhatsAppScreenshot}
        >
          <MessageCircle className="h-5 w-5" />
          Send Payment Proof on WhatsApp
        </Button>

        <p className="text-xs text-muted-foreground mt-3">
          Click the button above to open WhatsApp and share your payment details
        </p>
      </motion.div>

      {/* Support Availability */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
      >
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
          <Clock className="h-5 w-5" />
          <span className="font-semibold">Support Availability</span>
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Our payment verification team is available from <strong>7:00 AM to 11:45 PM IST</strong>. 
          Payments made during these hours will be processed within 15-20 minutes. 
          For payments outside these hours, please wait until our team returns online.
        </p>
      </motion.div>

      {/* Time Warning */}
      <div className="text-center">
        <p className="text-sm text-red-500 font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Please send payment proof within 3-4 hours to ensure proper processing
        </p>
      </div>

      {/* Security Badge */}
      <div className="text-center pt-4 border-t">
        <p className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          100% Secure Payment Process
        </p>
      </div>
    </div>
  );
}