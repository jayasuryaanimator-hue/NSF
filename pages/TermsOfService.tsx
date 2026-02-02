import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';

export default function TermsOfService() {
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
              Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
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
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground">
                  Welcome to New Sathiya Furniture ("we," "our," or "us"). These Terms of Service govern your use of our website and the purchase of furniture products including beds, wardrobes, sofas, dining sets, and related home furniture from our online store and showrooms.
                </p>
                <p className="text-muted-foreground mt-4">
                  By accessing our website or placing an order, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">2. About New Sathiya Furniture</h2>
                <p className="text-muted-foreground">
                  <strong>Business Name:</strong> NEW SATHIYA FURNITURE<br />
                  <strong>Branches:</strong> Edappadi, Namakkal, and Karur<br />
                  <strong>Head Office:</strong> 39c, Aavanipudur Jalakandapuram, Main Road, Edappadi, Tamil Nadu 637101, India<br />
                  <strong>Email:</strong> krameshjet@gmail.com<br />
                  <strong>Phone:</strong> +91 86752 55084
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">3. Products and Services</h2>
                <p className="text-muted-foreground">
                  We specialize in selling:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Living Room Furniture (Sofas, Coffee Tables, TV Units, Recliners)</li>
                  <li>Bedroom Furniture (Beds, Wardrobes, Dressers, Nightstands)</li>
                  <li>Dining Room Furniture (Dining Tables, Chairs, Buffets)</li>
                  <li>Office Furniture (Desks, Chairs, Bookshelves)</li>
                  <li>Kids Furniture (Bunk Beds, Study Tables, Wardrobes)</li>
                  <li>Custom Furniture (Made-to-order pieces)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  All products sold are of high quality and crafted with care. Product images are for representation purposes; actual products may vary slightly in color and finish.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">4. Ordering Process</h2>
                <p className="text-muted-foreground">
                  <strong>4.1 Placing Orders:</strong> Orders can be placed through our website, via WhatsApp (+91 86752 55084), or by visiting any of our showrooms in Edappadi, Namakkal, or Karur.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>4.2 Order Confirmation:</strong> Once your order is placed, you will receive an order confirmation via email/SMS. This confirmation does not guarantee product availability.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>4.3 Order Acceptance:</strong> We reserve the right to accept or reject any order based on product availability, pricing errors, or suspected fraudulent activity.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>4.4 Custom Orders:</strong> For custom furniture orders, please contact us directly for quotations and delivery timelines.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">5. Pricing and Payment</h2>
                <p className="text-muted-foreground">
                  <strong>5.1 Pricing:</strong> All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>5.2 Payment Methods:</strong> We accept:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>UPI Payments (Google Pay, PhonePe, Paytm, etc.)</li>
                  <li>Cash on Delivery (COD) - Available for select locations</li>
                  <li>Bank Transfer / NEFT / RTGS</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  <strong>5.3 Payment Verification:</strong> For UPI payments, you may be asked to upload a payment screenshot for verification before order dispatch.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. Shipping and Delivery</h2>
                <p className="text-muted-foreground">
                  <strong>6.1 Delivery Areas:</strong> We primarily serve Tamil Nadu with delivery and installation services. Delivery timelines vary based on location and product type.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>6.2 Shipping Charges:</strong> Free delivery within city limits for orders above ₹10,000. Standard delivery charges apply for other orders and locations.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>6.3 Delivery Time:</strong> Standard delivery takes 7-14 business days. Custom furniture may require additional time for manufacturing.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>6.4 Installation:</strong> Free installation is provided for all furniture purchases within our service areas.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. Warranty and Support</h2>
                <p className="text-muted-foreground">
                  <strong>7.1 Warranty:</strong> All furniture products come with a warranty against manufacturing defects. Warranty terms vary by product category.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>7.2 After-Sales Support:</strong> We provide repair and maintenance support for all products sold. Contact us for any product-related queries.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>7.3 Warranty Claims:</strong> For warranty claims, please contact us with your order details and proof of purchase.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. User Accounts</h2>
                <p className="text-muted-foreground">
                  <strong>8.1 Account Creation:</strong> You may create an account to track orders, save addresses, and manage your purchases.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>8.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and all activities under your account.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>8.3 Account Termination:</strong> We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">9. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content on this website, including text, images, logos, and product descriptions, is the property of New Sathiya Furniture or its content suppliers and is protected by copyright laws. Unauthorized use is prohibited.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, New Sathiya Furniture shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our products or services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms of Service are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Salem, Tamil Nadu.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the new terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">13. Contact Us</h2>
                <p className="text-muted-foreground">
                  For any questions regarding these Terms of Service, please contact us at:
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>NEW SATHIYA FURNITURE</strong><br />
                  39c, Aavanipudur Jalakandapuram, Main Road<br />
                  Edappadi, Tamil Nadu 637101<br />
                  Email: krameshjet@gmail.com<br />
                  Phone: +91 86752 55084<br />
                  WhatsApp: +91 86752 55084
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}