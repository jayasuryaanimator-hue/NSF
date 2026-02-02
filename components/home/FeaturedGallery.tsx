import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Sparkles, Camera } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
  wood_type: string | null;
  dimensions: string | null;
}

export function FeaturedGallery() {
  const { data: featuredItems = [], isLoading } = useQuery({
    queryKey: ['featured-gallery-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (error) throw error;
      return data as GalleryItem[];
    },
  });

  if (isLoading) {
    return (
      <section className="section-padding bg-gradient-to-b from-secondary/30 to-background">
        <div className="container-deiva">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featuredItems.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-gradient-to-b from-secondary/30 to-background overflow-hidden">
      <div className="container-deiva">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Our Craftsmanship
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-gradient">Custom</span> Projects Gallery
            </h2>
            <p className="text-muted-foreground max-w-lg">
              See the beautiful custom pieces we've crafted for our customers
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button variant="outline" asChild className="border-2 hover:bg-primary hover:text-primary-foreground group">
              <Link to="/gallery" className="flex items-center gap-2">
                View Full Gallery
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Gallery Grid - Masonry-like layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {featuredItems.map((item, index) => {
            // Create visual interest with varying sizes
            const isLarge = index === 0 || index === 3;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`group relative ${isLarge ? 'md:row-span-2' : ''}`}
              >
                <Link to="/gallery" className="block">
                  <div className={`relative overflow-hidden rounded-xl bg-muted ${isLarge ? 'aspect-[3/4]' : 'aspect-square'}`}>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {item.category}
                        </Badge>
                        <h3 className="text-white font-semibold text-sm md:text-lg line-clamp-2">
                          {item.title}
                        </h3>
                        {item.wood_type && (
                          <p className="text-white/70 text-xs md:text-sm mt-1">
                            {item.wood_type}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Corner Accent */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Want something unique? Let us create a custom piece just for you.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Link to="/custom-orders" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Request Custom Order
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
