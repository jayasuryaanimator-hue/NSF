import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
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
                  New Sathiya Furniture ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from our store.
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Data Controller:</strong> New Sathiya Furniture<br />
                  <strong>Address:</strong> 39c, Aavanipudur Jalakandapuram, Main Road, Edappadi, Tamil Nadu 637101, India<br />
                  <strong>Email:</strong> krameshjet@gmail.com
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground">
                  <strong>2.1 Personal Information:</strong> When you create an account or place an order, we collect:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Shipping and billing address</li>
                  <li>Payment information (for verification purposes only)</li>
                </ul>
                
                <p className="text-muted-foreground mt-4">
                  <strong>2.2 Order Information:</strong> Details of products purchased, order history, delivery preferences, and custom order specifications.
                </p>
                
                <p className="text-muted-foreground mt-4">
                  <strong>2.3 Communication Data:</strong> Messages sent through our contact form, WhatsApp inquiries, and customer support communications.
                </p>
                
                <p className="text-muted-foreground mt-4">
                  <strong>2.4 Automatically Collected Information:</strong> Browser type, IP address, device information, pages visited, and cookies for website functionality.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li><strong>Order Processing:</strong> To process and fulfill your orders, send order confirmations, invoices, and shipping updates</li>
                  <li><strong>Customer Support:</strong> To respond to your inquiries, provide technical support, and handle warranty claims</li>
                  <li><strong>Payment Verification:</strong> To verify UPI payments and prevent fraudulent transactions</li>
                  <li><strong>Account Management:</strong> To create and manage your user account, save preferences, and maintain order history</li>
                  <li><strong>Communication:</strong> To send important updates about your orders, products, and our services</li>
                  <li><strong>Improvement:</strong> To analyze usage patterns and improve our website and services</li>
                  <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li><strong>Shipping Partners:</strong> To deliver your orders (courier companies, logistics providers)</li>
                  <li><strong>Payment Processors:</strong> To process secure payments</li>
                  <li><strong>Service Providers:</strong> Email service providers for sending transactional emails (order confirmations, invoices)</li>
                  <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  All third-party service providers are bound by confidentiality agreements and are only permitted to use your information for the specific purpose of providing their services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Secure HTTPS encryption for all website communications</li>
                  <li>Secure storage of user credentials with password hashing</li>
                  <li>Limited access to personal data on a need-to-know basis</li>
                  <li>Regular security assessments and updates</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">6. Cookies</h2>
                <p className="text-muted-foreground">
                  Our website uses cookies to enhance your browsing experience. Cookies are small files stored on your device that help us:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Remember your login status and preferences</li>
                  <li>Maintain items in your shopping cart</li>
                  <li>Analyze website traffic and usage patterns</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  You can control cookie settings through your browser. Disabling cookies may affect website functionality.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
                <p className="text-muted-foreground">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and personal data (subject to legal retention requirements)</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, please contact us at krameshjet@gmail.com with your request.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Fulfill the purposes outlined in this Privacy Policy</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Resolve disputes and enforce our agreements</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Order records are typically retained for 7 years for tax and legal compliance purposes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our website and services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">10. Third-Party Links</h2>
                <p className="text-muted-foreground">
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
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