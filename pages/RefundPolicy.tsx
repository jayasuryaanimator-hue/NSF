import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

export default function RefundPolicy() {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Hello! I have a question regarding returns/refunds for my order.');
    window.open(`https://wa.me/918675255084?text=${message}`, '_blank');
  };

  return (
    <Layout>
      <section className="py-16 bg-gradient-to-br from-secondary via-background to-secondary/50">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              Our Policy
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund & Return Policy</h1>
            <p className="text-muted-foreground">
              Last updated: January 2026
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-deiva max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-lg max-w-none"
          >
            <div className="bg-card rounded-2xl border p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">1. Our Commitment</h2>
                <p className="text-muted-foreground">
                  At New Sathiya Furniture, we are committed to ensuring customer satisfaction. We understand that sometimes products may not meet your expectations or may arrive damaged. This policy outlines our return and refund procedures for furniture products including beds, wardrobes, sofas, dining sets, and other home furniture.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">2. Return Eligibility</h2>
                <p className="text-muted-foreground">
                  <strong>2.1 Eligible for Return:</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Products damaged during shipping</li>
                  <li>Wrong product delivered</li>
                  <li>Defective products (manufacturing defects)</li>
                  <li>Products significantly different from description</li>
                  <li>Missing parts or accessories</li>
                </ul>
                
                <p className="text-muted-foreground mt-4">
                  <strong>2.2 Not Eligible for Return:</strong>
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Products used or assembled after delivery</li>
                  <li>Products with removed or damaged seals/tags</li>
                  <li>Products damaged due to misuse or improper handling</li>
                  <li>Custom-made or specially ordered furniture</li>
                  <li>Products returned after the return window</li>
                  <li>Minor variations in color or texture (natural for wood products)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">3. Return Window</h2>
                <p className="text-muted-foreground">
                  <strong>Standard Furniture:</strong> 7 days from delivery date<br />
                  <strong>Large Furniture (Beds, Wardrobes, Sofas):</strong> 3 days from delivery date (must be inspected upon delivery)<br />
                  <strong>Defective Products:</strong> Within warranty period as per product terms
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Important:</strong> For large furniture items, please inspect the product at the time of delivery. Report any visible damage immediately to the delivery team and contact us within 24 hours.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">4. Return Process</h2>
                <p className="text-muted-foreground">
                  <strong>Step 1:</strong> Contact us within the return window via:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>WhatsApp: +91 86752 55084</li>
                  <li>Email: krameshjet@gmail.com</li>
                  <li>Phone: +91 86752 55084</li>
                  <li>Website: Submit a return request from your order history</li>
                </ul>
                
                <p className="text-muted-foreground mt-4">
                  <strong>Step 2:</strong> Provide the following information:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Order number</li>
                  <li>Product name and description of issue</li>
                  <li>Photos/videos showing the defect or damage</li>
                </ul>
                
                <p className="text-muted-foreground mt-4">
                  <strong>Step 3:</strong> Our team will review your request within 24-48 hours and provide return instructions if approved.
                </p>
                
                <p className="text-muted-foreground mt-4">
                  <strong>Step 4:</strong> Keep the product in its original packaging (if available) and do not assemble or use it.
                </p>
                
                <p className="text-muted-foreground mt-4">
                  <strong>Step 5:</strong> Our team will arrange pickup for eligible returns.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">5. Refund Options</h2>
                <p className="text-muted-foreground">
                  Once your return is received and inspected, we will process one of the following:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li><strong>Full Refund:</strong> For damaged/defective products or wrong items delivered</li>
                  <li><strong>Replacement:</strong> Exchange with a new unit of the same product</li>
                  <li><strong>Store Credit:</strong> Credit to your account for future purchases</li>
                  <li><strong>Partial Refund:</strong> For products with minor issues (as mutually agreed)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. Refund Timeline</h2>
                <p className="text-muted-foreground">
                  <strong>Inspection:</strong> 2-3 business days after receiving the returned product<br />
                  <strong>Refund Processing:</strong> 5-7 business days after approval<br />
                  <strong>Bank Credit:</strong> 5-10 business days (depending on your bank)
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Refund Method:</strong> Refunds will be processed to the original payment method:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>UPI Payments: Refund to original UPI ID</li>
                  <li>Bank Transfer: Refund to original bank account</li>
                  <li>COD Orders: Refund via UPI or bank transfer (account details required)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. Shipping Costs</h2>
                <p className="text-muted-foreground">
                  <strong>Damaged/Defective/Wrong Products:</strong> We will bear the return shipping costs and arrange pickup.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>Change of Mind:</strong> If returning due to change of mind (where accepted), the customer bears return shipping costs. Original shipping charges are non-refundable.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. Cancellation Policy</h2>
                <p className="text-muted-foreground">
                  <strong>Before Dispatch:</strong> Orders can be cancelled with full refund before dispatch. Contact us immediately after placing the order.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>After Dispatch:</strong> Once shipped, orders cannot be cancelled. You may refuse delivery or follow the return process after delivery.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>Custom Orders:</strong> Custom furniture orders cannot be cancelled once production has started.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">9. Warranty Claims</h2>
                <p className="text-muted-foreground">
                  For products under warranty:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Contact us with your order details and proof of purchase</li>
                  <li>Describe the issue with photos/videos</li>
                  <li>Our team will assess and provide repair or replacement as applicable</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>Note:</strong> Warranty does not cover damage from misuse, neglect, unauthorized modifications, or normal wear and tear.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">10. Special Conditions for Large Furniture</h2>
                <p className="text-muted-foreground">
                  For beds, wardrobes, sofas, and dining sets:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Inspect thoroughly at the time of delivery</li>
                  <li>Note any damage on the delivery receipt</li>
                  <li>Do not assemble the furniture if damaged</li>
                  <li>Contact us within 24 hours of delivery for any issues</li>
                  <li>Returns accepted only if unused and in original packaging</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">11. Contact for Returns</h2>
                <p className="text-muted-foreground">
                  For return and refund inquiries, contact:
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>NEW SATHIYA FURNITURE</strong><br />
                  39c, Aavanipudur Jalakandapuram, Main Road<br />
                  Edappadi, Tamil Nadu 637101<br />
                  Email: krameshjet@gmail.com<br />
                  Phone: +91 86752 55084<br />
                  WhatsApp: +91 86752 55084
                </p>
                
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleWhatsAppClick} className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat on WhatsApp
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/contact">Contact Us</Link>
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This refund policy is subject to change. Any modifications will be updated on this page. For the most current policy, please check this page before making a purchase. We reserve the right to refuse returns that do not meet the criteria outlined above.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}