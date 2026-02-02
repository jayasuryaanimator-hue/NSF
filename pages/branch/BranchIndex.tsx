import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/integrations/supabase/client';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';

export default function BranchIndex() {
  const { currentBranch } = useBranch();

  const { data: featuredProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['branch-featured-products', currentBranch?.id],
    queryFn: async () => {
      if (!currentBranch) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(8);

      if (error) throw error;
      return data;
    },
    enabled: !!currentBranch,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data;
    },
  });

  if (!currentBranch) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Branch not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative">
        <BannerCarousel />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/40 flex items-center">
          <div className="container-deiva">
            <div className="max-w-xl space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                {currentBranch.name}
              </h1>
              <p className="text-lg text-muted-foreground">
                Quality furniture and agricultural equipment at your doorstep
              </p>
              <div className="flex gap-4">
                <Link to={`/${currentBranch.slug}/shop`}>
                  <Button size="lg">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branch Info Card */}
      <section className="py-12 bg-muted/30">
        <div className="container-deiva">
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {currentBranch.address_line1}
                      {currentBranch.address_line2 && <>, {currentBranch.address_line2}</>}
                      <br />
                      {currentBranch.city}, {currentBranch.state} - {currentBranch.postal_code}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{currentBranch.phone}</p>
                  </div>
                </div>
                {currentBranch.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{currentBranch.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12">
        <div className="container-deiva">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link to={`/${currentBranch.slug}/shop`}>
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No featured products available at this branch.
            </p>
          )}
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container-deiva">
            <h2 className="text-2xl font-bold mb-8">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  to={`/${currentBranch.slug}/shop?category=${category.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="aspect-square relative">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">{category.name}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-medium text-foreground">{category.name}</h3>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
