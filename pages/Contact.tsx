import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { usePageContent } from '@/hooks/usePageContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Store,
  Instagram,
} from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Branch locations
const branches = [
  {
    id: 'edappadi',
    name: 'Edappadi Showroom',
    subtitle: 'Flagship Store',
    address: '39c, Aavanipudur Jalakandapuram',
    address2: 'Main Road, Edappadi',
    address3: 'Tamil Nadu 637101',
    phone: '+91 86752 55084',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3912.1234567890123!2d77.123456!3d11.123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDA3JzI0LjQiTiA3N8KwMDcnMjQuNCJF!5e0!3m2!1sen!2sin!4v1234567890',
    instagram: 'https://www.instagram.com/newsathiyafurnitureedappadi/',
  },
  {
    id: 'namakkal',
    name: 'Namakkal Showroom',
    subtitle: 'Premium Collection',
    address: '208G, Tiruchengode - Namakkal - Trichy Rd',
    address2: 'Veeba Nagar, Kamaraj Nagar',
    address3: 'Namakkal, Tamil Nadu 637001',
    phone: '+91 86752 55084',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3912.1234567890123!2d78.123456!3d11.223456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDEzJzI0LjQiTiA3OMKwMDcnMjQuNCJF!5e0!3m2!1sen!2sin!4v1234567890',
    instagram: 'https://www.instagram.com/newsathiyafurniturenamakkal/',
  },
  {
    id: 'karur',
    name: 'Karur Showroom',
    subtitle: 'New Location',
    address: 'Main Road, Near Bus Stand',
    address2: 'Karur Town',
    address3: 'Karur, Tamil Nadu 639001',
    phone: '+91 86752 55084',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3912.1234567890123!2d78.123456!3d10.923456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDU1JzI0LjQiTiA3OMKwMDcnMjQuNCJF!5e0!3m2!1sen!2sin!4v1234567890',
    instagram: 'https://www.instagram.com/newsathiyafurniture/',
  },
];

// Default content fallbacks
const defaultInfo = {
  email: 'krameshjet@gmail.com',
  hours_weekday: 'Monday - Saturday: 9:00 AM - 8:00 PM',
  hours_weekend: 'Sunday: 10:00 AM - 6:00 PM',
};

const defaultHero = {
  badge: 'Visit Our Showrooms',
  title: 'Contact Us',
  description: "Visit any of our 3 showrooms across Tamil Nadu or get in touch with us. We're here to help you find the perfect furniture for your home.",
};

const defaultForm = {
  heading: 'Send us a Message',
  intro: "Have questions about our furniture collection? Need help choosing the right pieces for your home? We'd love to hear from you!",
  success_title: 'Message Sent!',
  success_message: "Thank you for reaching out. We'll get back to you within 24 hours.",
};

export default function Contact() {
  const { data: content, isLoading } = usePageContent('contact');
  const [selectedBranch, setSelectedBranch] = useState('edappadi');
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get content with fallbacks
  const info = content?.info || defaultInfo;
  const hero = content?.hero || defaultHero;
  const formSettings = content?.form_settings || defaultForm;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = contactSchema.parse(formData);
      setIsSubmitting(true);

      const { error } = await supabase.from('contact_messages').insert({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        subject: validatedData.subject || null,
        message: validatedData.message,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as keyof ContactFormData] = error.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBranch = branches.find(b => b.id === selectedBranch) || branches[0];

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-secondary via-background to-secondary/50">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              {hero.badge}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{hero.title}</h1>
            <p className="text-muted-foreground">
              {hero.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Branch Locations Section */}
      <section className="section-padding bg-background">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Showrooms</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Visit any of our 3 showrooms to explore our extensive collection of quality furniture
            </p>
          </motion.div>

          <Tabs value={selectedBranch} onValueChange={setSelectedBranch} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              {branches.map((branch) => (
                <TabsTrigger 
                  key={branch.id} 
                  value={branch.id}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">{branch.name.replace(' Branch', '')}</span>
                  <span className="sm:hidden">{branch.id.charAt(0).toUpperCase() + branch.id.slice(1, 4)}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {branches.map((branch) => (
              <TabsContent key={branch.id} value={branch.id}>
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Branch Info Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card rounded-2xl border p-8"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold">{branch.name}</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Address</h4>
                          <p className="text-muted-foreground">
                            {branch.address}<br />
                            {branch.address2}<br />
                            {branch.address3}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Phone</h4>
                          <a 
                            href={`tel:${branch.phone.replace(/\s/g, '')}`} 
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {branch.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Business Hours</h4>
                          <p className="text-muted-foreground">
                            {info.hours_weekday || defaultInfo.hours_weekday}<br />
                            {info.hours_weekend || defaultInfo.hours_weekend}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <svg className="h-5 w-5 text-accent-foreground" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Instagram</h4>
                          <a 
                            href={branch.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Follow us on Instagram
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => window.open(branch.instagram, '_blank')}
                        className="flex-1"
                      >
                        <Instagram className="h-5 w-5" />
                        Follow on Instagram
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address + ', ' + branch.address3)}`, '_blank')}
                        className="flex-1"
                      >
                        <MapPin className="h-5 w-5" />
                        Get Directions
                      </Button>
                    </div>
                  </motion.div>

                  {/* Map */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card rounded-2xl border overflow-hidden h-[400px] lg:h-auto"
                  >
                    <iframe
                      src={branch.mapEmbed}
                      width="100%"
                      height="100%"
                      style={{ border: 0, minHeight: '400px' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${branch.name} Map`}
                    />
                  </motion.div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="section-padding bg-secondary/30">
        <div className="container-deiva">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* General Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                {formSettings.intro}
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a 
                      href={`mailto:${info.email || defaultInfo.email}`} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {info.email || defaultInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone (All Branches)</h3>
                    <a 
                      href="tel:+918675255084" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      +91 86752 55084
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Our Showrooms</h3>
                    <p className="text-muted-foreground">
                      3 Branches across Tamil Nadu<br />
                      Edappadi • Namakkal • Karur
                    </p>
                  </div>
                </div>
              </div>

              {/* Call Button */}
              <div className="mt-8">
                <Button
                  onClick={() => window.open('tel:+918675255084', '_self')}
                  className="w-full sm:w-auto"
                >
                  <Phone className="h-5 w-5" />
                  Call Us Now
                </Button>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {isSubmitted ? (
                <div className="bg-card rounded-2xl border p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">{formSettings.success_title}</h2>
                  <p className="text-muted-foreground mb-6">
                    {formSettings.success_message}
                  </p>
                  <Button onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                  }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border p-8">
                  <h2 className="text-2xl font-bold mb-6">{formSettings.heading}</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive mt-1">{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive mt-1">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject (Optional)</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="What's this about?"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        rows={5}
                        className={errors.message ? 'border-destructive' : ''}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive mt-1">{errors.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="spinner h-4 w-4" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
