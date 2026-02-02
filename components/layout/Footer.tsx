import { Link } from 'react-router-dom';
import { 
  Instagram,
  Mail,
  Phone,
  MapPin,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'Living Room Furniture', href: '/shop?category=living-room' },
    { name: 'Bedroom Furniture', href: '/shop?category=bedroom' },
    { name: 'Dining Room Sets', href: '/shop?category=dining-room' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Our Products', href: '/shop' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  support: [
    { name: 'FAQs', href: '/faq' },
    { name: 'Shipping Info', href: '/shipping' },
    { name: 'Returns & Refunds', href: '/returns' },
    { name: 'Track Order', href: '/orders' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Refund Policy', href: '/refund-policy' },
  ],
};

const instagramLinks = [
  { name: 'Edappadi', href: 'https://www.instagram.com/newsathiyafurnitureedappadi/' },
  { name: 'Main', href: 'https://www.instagram.com/newsathiyafurniture/' },
  { name: 'Namakkal', href: 'https://www.instagram.com/newsathiyafurniturenamakkal/' },
];

const WHATSAPP_NUMBER = '918675255084';

export function Footer() {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Hello! I would like to know more about New Sathiya Furniture products and services.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <footer className="bg-foreground text-background">

      <div className="container-deiva section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <img 
                src="/images/new-sathiya-logo.png" 
                alt="New Sathiya Furniture" 
                className="h-12 w-12 rounded-full object-cover"
              />
              <span className="text-2xl font-bold tracking-tight">New Sathiya Furniture</span>
            </Link>
            <p className="text-background/70 mb-6 max-w-sm">
              Leading furniture showroom in Tamil Nadu with branches in Edappadi, Namakkal, and Karur. 
              Quality beds, wardrobes, sofas, dining sets, and more at affordable prices.
            </p>
            

            {/* Instagram Links */}
            <div className="flex gap-4">
              {instagramLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                  aria-label={`Instagram - ${link.name}`}
                  title={`Instagram - ${link.name}`}
                >
                  <Instagram className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-background/50 flex-shrink-0" />
                <div className="text-background/70 text-sm">
                  <p className="font-medium text-background mb-1">Edappadi Branch</p>
                  39c, Aavanipudur Jalakandapuram,<br />
                  Main Road, Edappadi,<br />
                  Tamil Nadu 637101
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-background/50 flex-shrink-0" />
                <a 
                  href="tel:+918675255084" 
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  +91 86752 55084
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-background/50 flex-shrink-0" />
                <a 
                  href="mailto:krameshjet@gmail.com" 
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  krameshjet@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/50 text-sm">
              © {new Date().getFullYear()} New Sathiya Furniture. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-background/50 hover:text-background text-sm transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}