import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sofa, Shield, Heart, Sparkles, Star, Quote, Truck, RotateCcw, ShieldCheck, Headphones, CheckCircle, Award, Users, Bed, Package, UtensilsCrossed, BookOpen, Baby, TreeDeciduous, Armchair, Lamp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FeaturedCarousel } from '@/components/products/FeaturedCarousel';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { FeaturedGallery } from '@/components/home/FeaturedGallery';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePageContent } from '@/hooks/usePageContent';
import newSathiyaLogo from '@/assets/new-sathiya-logo.png';
import furnitureHero from '@/assets/banners/furniture-hero.jpg';
import livingRoomImg from '@/assets/categories/living-room.jpg';
import bedroomImg from '@/assets/categories/bedroom.jpg';
import diningRoomImg from '@/assets/categories/dining-room.jpg';
import officeImg from '@/assets/categories/office.jpg';
import kidsRoomImg from '@/assets/categories/kids-room.jpg';

// Icon mapping for dynamic icons from CMS
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sofa, Shield, Heart, Sparkles, Star, Quote, Truck, RotateCcw, ShieldCheck, Headphones, CheckCircle, Award, Users, Bed, Package, UtensilsCrossed, BookOpen, Baby, TreeDeciduous, Armchair, Lamp
};

// Category icon mapping based on slug
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'living-room': Sofa,
  'bedroom': Bed,
  'dining-room': UtensilsCrossed,
  'office-furniture': BookOpen,
  'study-office': BookOpen,
  'kids-furniture': Baby,
  'outdoor': TreeDeciduous,
};

// Category image mapping based on slug
const categoryImages: Record<string, string> = {
  'living-room': livingRoomImg,
  'bedroom': bedroomImg,
  'dining-room': diningRoomImg,
  'office-furniture': officeImg,
  'study-office': officeImg,
  'kids-furniture': kidsRoomImg,
};

const defaultFeatures = [
  { icon: 'TreeDeciduous', title: 'Premium Wood', description: 'Teak, Rosewood, Sheesham & Mango wood sourced from trusted suppliers.' },
  { icon: 'Sofa', title: 'Complete Home Solutions', description: 'Beds, wardrobes, sofas, dining sets, and office furniture.' },
  { icon: 'Package', title: 'Customization Available', description: 'Get furniture tailored to your space and style preferences.' },
  { icon: 'Sparkles', title: 'Expert Craftsmanship', description: 'Skilled artisans with decades of furniture-making experience.' },
];

const defaultTestimonials = [
  { name: 'Muthu Krishnan', location: 'Namakkal', rating: 5, text: 'Bought a teak wood dining table and 6 chairs. Excellent quality and beautiful finish. Very happy with the purchase!' },
  { name: 'Senthil Kumar', location: 'Edappadi', rating: 5, text: 'The rosewood bed we ordered is stunning. Solid construction and the delivery team was very professional.' },
  { name: 'Lakshmi R.', location: 'Karur', rating: 5, text: 'Furnished our entire home from New Sathiya. Great variety, reasonable prices, and wonderful customer service!' },
];

const defaultTrustBadges = [
  { icon: 'Truck', title: 'Free Delivery', description: 'On orders above ₹25,000' },
  { icon: 'RotateCcw', title: '7-Day Exchange', description: 'Easy exchange policy' },
  { icon: 'ShieldCheck', title: 'Solid Wood', description: 'No plywood or MDF' },
  { icon: 'Headphones', title: 'Expert Support', description: 'Design consultation' },
];

const defaultStats = [
  { value: '10,000+', label: 'Happy Homes' },
  { value: '3', label: 'Showrooms' },
  { value: '500+', label: 'Furniture Designs' },
  { value: '25+', label: 'Years Experience' },
];

export default function Index() {
  const { data: content, isLoading: contentLoading } = usePageContent('home');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Extract content with fallbacks
  const hero = content?.hero || {};
  const features = content?.features || {};
  const testimonials = content?.testimonials || {};
  const cta = content?.cta || {};
  const trustBadges = content?.trust_badges || {};
  const stats = content?.stats || {};

  const featureItems = features.items || defaultFeatures;
  const testimonialItems = testimonials.items || defaultTestimonials;
  const trustBadgeItems = trustBadges.items || defaultTrustBadges;
  const statItems = stats.items || defaultStats;

  return (
    <Layout>
      {/* Trust Badges Bar */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b">
        <div className="container-deiva">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 py-3 sm:py-4">
            {trustBadgeItems.map((badge: any, index: number) => {
              const Icon = iconMap[badge.icon] || ShieldCheck;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 justify-center"
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-[10px] sm:text-sm leading-tight">{badge.title}</p>
                    <p className="text-[8px] sm:text-xs text-muted-foreground hidden sm:block">{badge.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[85vh] flex items-center overflow-hidden py-8 sm:py-0">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent/10" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-primary/30 to-accent/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-tr from-accent/25 to-primary/15 rounded-full blur-3xl animate-pulse animation-delay-200" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-success/10 to-warning/10 rounded-full blur-3xl animate-pulse animation-delay-400" />
        </div>

        <div className="container-deiva relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="inline-block px-5 py-2 bg-gradient-to-r from-primary/20 to-accent/20 text-primary rounded-full text-sm font-medium mb-6 border border-primary/20 shadow-sm"
              >
                {hero.badge || '🛋️ Premium Home Furniture'}
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {hero.title ? (
                  <>
                    {hero.title.split('Beautiful Homes')[0]}
                    <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Beautiful Homes</span>
                    {hero.title.split('Beautiful Homes')[1] || ' Start with Quality Furniture'}
                  </>
                ) : (
                  <>
                    Creating 
                    <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"> Beautiful Homes</span> 
                    {' '}with Quality Furniture
                  </>
                )}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                {hero.subtitle || 'Discover our wide range of stylish and durable home furniture including beds, wardrobes, sofas, dining sets, and more. Quality craftsmanship at affordable prices.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all">
                  <Link to="/shop">
                    {hero.primary_button_text || 'Explore Furniture'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-2 hover:bg-accent/10">
                  <Link to="/about">{hero.secondary_button_text || 'Visit Our Showrooms'}</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-xl" />
                <img 
                  src={hero.hero_image || furnitureHero} 
                  alt="Premium wooden furniture showroom" 
                  className="relative w-full aspect-[4/3] object-cover rounded-2xl shadow-2xl"
                />
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-lg">
                  <p className="text-sm font-semibold">25+ Years</p>
                  <p className="text-xs opacity-90">of Excellence</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground">
        <div className="container-deiva">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statItems.map((stat: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-primary-foreground/80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-gradient-to-b from-card to-secondary/30">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {features.title ? (
                <>{features.title}</>
              ) : (
                <>Why Choose <span className="text-gradient">New Sathiya Furniture?</span></>
              )}
            </motion.h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {features.subtitle || 'We provide quality furniture with expert craftsmanship and affordable pricing across our 3 showrooms in Tamil Nadu.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureItems.map((feature: any, index: number) => {
              const Icon = iconMap[feature.icon] || Sofa;
              const gradients = [
                'from-primary to-primary/70',
                'from-accent to-accent/70',
                'from-success to-success/70',
                'from-warning to-warning/70',
              ];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background rounded-xl p-6 text-center card-hover border shadow-sm hover:shadow-lg group"
                >
                  <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="section-padding bg-gradient-to-b from-background to-secondary/20">
        <div className="container-deiva">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-gradient">Featured</span> Furniture
              </h2>
              <p className="text-muted-foreground">Our popular furniture collections for your home</p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex border-2 hover:bg-primary hover:text-primary-foreground">
              <Link to="/shop">View All Furniture</Link>
            </Button>
          </div>

          <FeaturedCarousel />

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/shop">View All Furniture</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="section-padding bg-gradient-to-r from-secondary/50 via-accent/5 to-secondary/50">
          <div className="container-deiva">
            <div className="text-center mb-12">
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4"
              >
                Shop by Room
              </motion.span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Furniture for <span className="text-gradient">Every Room</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Browse our curated collections designed for each space in your home
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {categories.map((category, index) => {
                const CategoryIcon = categoryIcons[category.slug] || Sofa;
                const categoryImage = category.image_url || categoryImages[category.slug];
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      to={`/shop?category=${category.slug}`}
                      className="block group"
                    >
                      <div className="bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        {/* Category Image */}
                        <div className="relative h-32 md:h-40 overflow-hidden">
                          {categoryImage ? (
                            <img 
                              src={categoryImage} 
                              alt={category.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <CategoryIcon className="h-12 w-12 text-primary/50" />
                            </div>
                          )}
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          {/* Icon badge */}
                          <div className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <CategoryIcon className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        {/* Category Info */}
                        <div className="p-4 text-center">
                          <h3 className="font-semibold text-sm md:text-base">{category.name}</h3>
                          <p className="text-xs text-muted-foreground hidden md:block mt-1 line-clamp-1">
                            {category.description || 'Explore collection'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" size="lg" asChild className="border-2">
                <Link to="/shop">
                  View All Categories <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Gallery Section */}
      <FeaturedGallery />

      {/* Testimonials Section */}
      <section className="section-padding bg-gradient-to-b from-background to-card">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {testimonials.title || 'What Our '}
              <span className="text-gradient">Customers</span>
              {' Say'}
            </h2>
            <p className="text-muted-foreground">
              {testimonials.subtitle || 'Real reviews from real craftsmen and home cooks'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonialItems.map((testimonial: any, index: number) => {
              const borderColors = ['border-l-primary', 'border-l-accent', 'border-l-success'];
              return (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`bg-card rounded-xl p-6 border border-l-4 ${borderColors[index % borderColors.length]} shadow-sm hover:shadow-lg transition-all`}
                >
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-4">{testimonial.text}</p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Trust Us Section */}
      <section className="section-padding bg-gradient-to-b from-card to-background">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Trust <span className="text-gradient">New Sathiya Furniture?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are committed to providing quality furniture and excellent customer service across our 3 showrooms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: CheckCircle, title: 'Quality Craftsmanship', description: 'Every piece is crafted with premium materials and expert finishing.', color: 'text-success' },
              { icon: Sofa, title: 'Wide Furniture Range', description: 'Beds, wardrobes, sofas, dining sets, and complete home solutions.', color: 'text-primary' },
              { icon: Users, title: 'Local Expertise', description: '3 showrooms in Edappadi, Namakkal, and Karur serving Tamil Nadu.', color: 'text-accent' },
              { icon: Award, title: 'Affordable Prices', description: 'Quality furniture at competitive prices for every budget.', color: 'text-warning' },
              { icon: Heart, title: 'Customer First', description: 'Friendly support and guidance to help you choose the perfect furniture.', color: 'text-destructive' },
              { icon: Shield, title: 'After-Sales Support', description: 'Reliable delivery and after-sales service for your peace of mind.', color: 'text-primary' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-card transition-colors"
              >
                <div className={`h-12 w-12 rounded-full bg-current/10 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary via-accent/80 to-primary text-primary-foreground">
        <div className="container-deiva text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {cta.title || 'Ready to Transform Your Home?'}
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              {cta.subtitle || 'Explore our range of quality furniture. Visit our showrooms in Edappadi, Namakkal, or Karur. Join thousands of happy families across Tamil Nadu.'}
            </p>
            <div className="flex justify-center">
              <Button size="lg" variant="secondary" asChild className="gap-2 shadow-lg hover:shadow-xl">
                <Link to="/shop">
                  {cta.button_text || 'Explore Our Furniture'} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
