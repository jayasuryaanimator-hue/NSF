import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Sofa, Heart, Award, Users, Target, Eye, CheckCircle, Ban, Recycle, BadgeCheck, Quote, Star, Shield, Sparkles, Clock, ThumbsUp, Package, Bed, MapPin, Phone, TreeDeciduous } from 'lucide-react';
import { usePageContent } from '@/hooks/usePageContent';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import newSathiyaLogo from '@/assets/new-sathiya-logo.png';

// Icon mapping for dynamic icons from CMS
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sofa, Heart, Award, Users, Target, Eye, CheckCircle, Ban, Recycle, BadgeCheck, Quote, Star, Shield, Sparkles, Bed, TreeDeciduous
};

const defaultValues = [
  { icon: 'TreeDeciduous', title: 'Premium Woods', description: 'Teak, Rosewood, Sheesham & Mango wood sourced from trusted suppliers.' },
  { icon: 'Sofa', title: 'Complete Solutions', description: 'Beds, wardrobes, sofas, dining sets, and custom furniture.' },
  { icon: 'Award', title: '25+ Years Legacy', description: 'Three generations of furniture craftsmanship excellence.' },
  { icon: 'Users', title: 'Customer First', description: 'Personalized service and lifetime after-sales support.' },
];

const defaultDifferences = [
  { us: 'Solid wood furniture only', others: 'Plywood & particle board' },
  { us: '25+ years of experience', others: 'New or inexperienced' },
  { us: 'In-house master craftsmen', others: 'Outsourced labor' },
  { us: 'Custom sizes & designs', others: 'Fixed standard sizes' },
  { us: 'Free home delivery & setup', others: 'Extra delivery charges' },
  { us: 'Lifetime maintenance support', others: 'No after-sales service' },
];

const defaultCertifications = [
  { icon: 'TreeDeciduous', title: 'Solid Wood Only', description: 'No plywood, MDF, or particle board in our furniture' },
  { icon: 'Shield', title: 'Quality Guaranteed', description: 'Every piece inspected before delivery' },
  { icon: 'Sparkles', title: 'Expert Craftsmanship', description: 'Master artisans with decades of experience' },
  { icon: 'BadgeCheck', title: 'Fair Pricing', description: 'Transparent pricing with no hidden costs' },
];

const defaultSteps = [
  { step: '01', title: 'Visit Showroom', description: 'Explore our collection at any of our 3 showrooms across Tamil Nadu.' },
  { step: '02', title: 'Design Consultation', description: 'Our experts help you choose or customize the perfect furniture.' },
  { step: '03', title: 'Master Crafting', description: 'Skilled artisans handcraft your furniture with premium wood.' },
  { step: '04', title: 'Home Delivery', description: 'Free delivery and professional setup at your home.' },
];

const trustStats = [
  { value: '10,000+', label: 'Happy Homes', icon: Users },
  { value: '25+', label: 'Years Experience', icon: Clock },
  { value: '4.9/5', label: 'Customer Rating', icon: Star },
  { value: '3', label: 'Showrooms', icon: MapPin },
];

const testimonials = [
  { name: 'Muthu Krishnan', location: 'Namakkal', text: 'Furnished our entire home from New Sathiya. The teak dining table is absolutely stunning. Quality craftsmanship!', rating: 5 },
  { name: 'Senthil Kumar', location: 'Edappadi', text: 'The rosewood bedroom set we ordered exceeded our expectations. Solid construction and beautiful carvings.', rating: 5 },
  { name: 'Lakshmi R.', location: 'Karur', text: 'Great variety of designs, reasonable prices, and the staff really helped us choose the right pieces. Highly recommended!', rating: 5 },
];

const teamMembers = [
  { name: 'Ramesh Kumar', role: 'Founder & Director', experience: '30+ years', specialty: 'Business Strategy' },
  { name: 'Senthil Raj', role: 'Master Craftsman', experience: '25+ years', specialty: 'Wood Carving' },
  { name: 'Muthu Velayutham', role: 'Design Head', experience: '20+ years', specialty: 'Furniture Design' },
  { name: 'Gopal Krishna', role: 'Operations Manager', experience: '15+ years', specialty: 'Customer Relations' },
];

const showroomLocations = [
  { 
    city: 'Edappadi', 
    address: 'Main Road, Near Bus Stand, Edappadi - 637102', 
    phone: '+91 86752 55084',
    timing: 'Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM'
  },
  { 
    city: 'Namakkal', 
    address: 'Trichy Road, Opposite Railway Station, Namakkal - 637001', 
    phone: '+91 86752 55084',
    timing: 'Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM'
  },
  { 
    city: 'Karur', 
    address: 'Kovai Road, Near College Junction, Karur - 639001', 
    phone: '+91 86752 55084',
    timing: 'Mon-Sat: 9AM - 8PM, Sun: 10AM - 6PM'
  },
];

export default function About() {
  const { data: content, isLoading } = usePageContent('about');

  // Extract content with fallbacks
  const hero = content?.hero || {};
  const story = content?.story || {};
  const visionMission = content?.vision_mission || {};
  const values = content?.values || {};
  const comparison = content?.comparison || {};
  const process = content?.process || {};
  const certifications = content?.certifications || {};

  const valueItems = values.items || defaultValues;
  const comparisonItems = comparison.items || defaultDifferences;
  const certificationItems = certifications.items || defaultCertifications;
  const processSteps = process.steps || defaultSteps;

  return (
    <Layout>
      {/* Hero Section - Enhanced with gradient and animation */}
      <section className="relative py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl animate-pulse animation-delay-300" />
        </div>

        <div className="container-deiva relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-block px-5 py-2 bg-gradient-to-r from-primary/20 to-accent/20 text-primary rounded-full text-sm font-medium mb-6 border border-primary/20"
            >
              {hero.badge || '🛋️ Trusted by Families Across Tamil Nadu'}
            </motion.span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {hero.title ? hero.title : (
                <>
                  Your Partner for <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Quality Home Furniture</span>
                </>
              )}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {hero.subtitle || "New Sathiya Furniture is a leading furniture showroom with multiple branches in Edappadi, Namakkal, and Karur. We offer stylish and durable home furniture with a focus on craftsmanship, affordable pricing, and customer satisfaction."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80 shadow-lg">
                <Link to="/shop">Explore Furniture</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Visit Our Showrooms</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="py-8 bg-gradient-to-r from-primary via-accent/80 to-primary text-white">
        <div className="container-deiva">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="h-6 w-6 mx-auto mb-2 opacity-80" />
                <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Section - Enhanced */}
      <section className="section-padding">
        <div className="container-deiva">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-xl" />
              {story.image ? (
                <img 
                  src={story.image} 
                  alt="Our Journey" 
                  className="relative w-full aspect-square object-cover rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <img 
                      src={newSathiyaLogo} 
                      alt="New Sathiya Furniture" 
                      className="h-24 w-24 mx-auto mb-4 rounded-full object-cover"
                    />
                    <p className="text-xl font-semibold text-primary">Since 2010</p>
                  </div>
                </div>
              )}
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                viewport={{ once: true }}
                className="absolute -bottom-4 -right-4 bg-white rounded-xl p-4 shadow-xl border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <ThumbsUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">99%</p>
                    <p className="text-xs text-muted-foreground">Customer Satisfaction</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {story.title || 'Three Generations of '}
                <span className="text-gradient">Craftsmanship</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
              {(story.paragraphs || [
                  "New Sathiya Furniture began over 25 years ago with a simple belief: every family deserves beautiful, solid wood furniture that lasts for generations. What started as a small workshop in Edappadi has grown into one of Tamil Nadu's most trusted furniture destinations.",
                  "Our master craftsmen, many of whom have been with us for over two decades, bring traditional woodworking techniques together with modern design sensibilities. We work exclusively with premium woods — Teak, Rosewood, Sheesham, and Mango Wood — never compromising with plywood or particle board.",
                  "Today, with three showrooms across Tamil Nadu, we continue our family's legacy of creating furniture that becomes a cherished part of your home. From custom dining tables to complete bedroom sets, every piece is crafted with the same dedication that built our reputation."
                ]).map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>100% Solid Wood</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Master Craftsmen</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Custom Designs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Lifetime Support</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section - Enhanced */}
      <section className="section-padding bg-gradient-to-b from-card to-background">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-gradient">Purpose</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20"
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{visionMission.vision_title || 'Our Vision'}</h3>
              <p className="text-muted-foreground">
                {visionMission.vision_text || "To be the leading furniture showroom in Tamil Nadu, known for quality craftsmanship, stylish designs, and customer satisfaction. We envision helping every family create beautiful and comfortable living spaces."}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-8 border border-accent/20"
            >
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-6 shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{visionMission.mission_title || 'Our Mission'}</h3>
              <p className="text-muted-foreground">
                {visionMission.mission_text || "To provide quality home furniture with expert craftsmanship at affordable prices. We are committed to serving families across Tamil Nadu through our 3 showrooms with dedicated service and complete home furniture solutions."}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Certifications Section - Enhanced with colors */}
      <section className="section-padding">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium mb-4">
              Why Trust Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {certifications.title || 'Our Certifications & '}
              <span className="text-gradient">Commitments</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {certificationItems.map((cert: any, index: number) => {
              const Icon = iconMap[cert.icon] || BadgeCheck;
              const gradients = [
                'from-primary to-primary/70',
                'from-success to-success/70',
                'from-accent to-accent/70',
                'from-warning to-warning/70',
              ];
              const bgColors = [
                'from-primary/5 to-primary/10 border-primary/20',
                'from-success/5 to-success/10 border-success/20',
                'from-accent/5 to-accent/10 border-accent/20',
                'from-warning/5 to-warning/10 border-warning/20',
              ];
              return (
                <motion.div
                  key={cert.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`bg-gradient-to-br ${bgColors[index % bgColors.length]} rounded-xl p-6 text-center border card-hover`}
                >
                  <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{cert.title}</h3>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gradient-to-r from-secondary/50 via-accent/5 to-secondary/50">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Customer Love
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our <span className="text-gradient">Customers</span> Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-lg border"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-primary/20 mb-2" />
                <p className="text-muted-foreground mb-4">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding bg-gradient-to-b from-background to-card">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Our Team
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet the <span className="text-gradient">Experts</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our team of skilled craftsmen and dedicated professionals bring decades of experience to every piece of furniture.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl p-6 text-center border shadow-sm hover:shadow-lg transition-all"
              >
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-primary text-sm font-medium">{member.role}</p>
                <div className="mt-3 pt-3 border-t space-y-1">
                  <p className="text-xs text-muted-foreground">{member.experience} experience</p>
                  <p className="text-xs text-muted-foreground">{member.specialty}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom Locations */}
      <section className="section-padding">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium mb-4">
              Visit Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our <span className="text-gradient">Showrooms</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience our furniture collection in person at any of our 3 showrooms across Tamil Nadu.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {showroomLocations.map((location, index) => (
              <motion.div
                key={location.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{location.city}</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{location.address}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={`tel:${location.phone}`} className="hover:text-primary transition-colors">
                      {location.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{location.timing}</span>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline" asChild>
                  <a 
                    href={`https://www.google.com/maps/search/${encodeURIComponent(location.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get Directions
                  </a>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
              Our Values
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {values.title || 'What Sets Us '}
              <span className="text-gradient">Apart</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {values.subtitle || 'Our commitment to quality and nature defines everything we do.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueItems.map((value: any, index: number) => {
              const Icon = iconMap[value.icon] || Sofa;
              const gradients = [
                'from-primary to-primary/70',
                'from-accent to-accent/70',
                'from-success to-success/70',
                'from-warning to-warning/70',
              ];
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 bg-background rounded-xl border card-hover group"
                >
                  <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section - Enhanced */}
      <section className="section-padding">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium mb-4">
              The Difference
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {comparison.title || 'Why '}
              <span className="text-gradient">New Sathiya Furniture</span>
              {' is Different'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {comparison.subtitle || 'See how we compare to other furniture showrooms in the market.'}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-2xl overflow-hidden border shadow-lg">
              {/* Header */}
              <div className="grid grid-cols-2">
                <div className="p-5 font-bold text-center bg-gradient-to-r from-primary to-primary/80 text-white">
                  ✓ New Sathiya Furniture
                </div>
                <div className="p-5 font-bold text-center bg-muted text-muted-foreground">
                  ✗ Others
                </div>
              </div>

              {/* Rows */}
              {comparisonItems.map((diff: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-2 border-t"
                >
                  <div className="p-4 flex items-center gap-3 bg-success/5">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-sm font-medium">{diff.us}</span>
                  </div>
                  <div className="p-4 flex items-center gap-3 text-muted-foreground bg-muted/30">
                    <Ban className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                    <span className="text-sm">{diff.others}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing Section - Enhanced */}
      <section className="section-padding bg-gradient-to-b from-card to-background">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Our Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {process.title || 'Your Journey to a '}
              <span className="text-gradient">Beautiful Home</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {process.subtitle || 'From showroom visit to home delivery, we make furniture shopping easy.'}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {processSteps.map((item: any, index: number) => {
              const stepColors = ['text-primary', 'text-accent', 'text-success', 'text-warning'];
              const stepIcons = [Sparkles, Package, Shield, Recycle];
              const StepIcon = stepIcons[index % stepIcons.length];
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                  <div className={`relative z-10 h-16 w-16 rounded-full bg-background border-2 ${stepColors[index]} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <StepIcon className={`h-8 w-8 ${stepColors[index]}`} />
                  </div>
                  <div className={`text-sm font-bold ${stepColors[index]} mb-2`}>Step {item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="section-padding bg-gradient-to-r from-primary via-accent/80 to-primary text-white">
        <div className="container-deiva text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Experience the New Sathiya Furniture Difference
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Visit our showrooms in Edappadi, Namakkal, or Karur to explore our wide range of quality furniture. Join thousands of happy families across Tamil Nadu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="shadow-lg">
                <Link to="/shop">Explore Furniture</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10">
                <Link to="/contact">Visit Our Showrooms</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
