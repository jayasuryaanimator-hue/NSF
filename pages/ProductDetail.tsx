import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { RelatedProductsCarousel } from '@/components/products/RelatedProductsCarousel';
import { ProductReviews } from '@/components/products/ProductReviews';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  Truck,
  Shield,
  RefreshCcw,
  Ruler,
  TreeDeciduous,
  Palette,
  Package,
  Phone,
  MessageCircle,
  Sofa,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProductDimensions {
  size?: string | null;
  wood_type?: string | null;
  color?: string | null;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(8);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  const handleAddToCart = () => {
    if (!user) {
      navigate(`/auth?redirect=/product/${slug}`);
      return;
    }

    if (product) {
      addItem(
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || '',
        },
        quantity
      );
    }
  };


  if (isLoading) {
    return (
      <Layout>
        <div className="container-deiva section-padding">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-secondary/30 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-secondary/30 rounded animate-pulse w-3/4" />
              <div className="h-6 bg-secondary/30 rounded animate-pulse w-1/4" />
              <div className="h-24 bg-secondary/30 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-deiva section-padding text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  // Parse dimensions safely
  const dimensions: ProductDimensions | null = 
    typeof product.dimensions === 'object' && product.dimensions !== null
      ? product.dimensions as ProductDimensions
      : null;

  const isOutOfStock = product.stock_quantity !== undefined && product.stock_quantity <= 0;

  // Specification items
  const specs = [
    { 
      icon: Ruler, 
      label: 'Dimensions', 
      value: dimensions?.size || product.sku,
      show: !!(dimensions?.size || product.sku)
    },
    { 
      icon: TreeDeciduous, 
      label: 'Material', 
      value: dimensions?.wood_type,
      show: !!dimensions?.wood_type
    },
    { 
      icon: Palette, 
      label: 'Color/Finish', 
      value: dimensions?.color,
      show: !!dimensions?.color
    },
    { 
      icon: Package, 
      label: 'Stock', 
      value: product.stock_quantity !== undefined 
        ? product.stock_quantity > 0 
          ? `${product.stock_quantity} available` 
          : 'Out of stock'
        : 'In stock',
      show: true
    },
  ].filter(spec => spec.show);

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-4">
        <div className="container-deiva">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link to="/shop" className="text-muted-foreground hover:text-foreground">
              Shop
            </Link>
            {product.categories && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Link
                  to={`/shop?category=${product.categories.slug}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {product.categories.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <section className="section-padding">
        <div className="container-deiva">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Main Image */}
              <div className="aspect-square rounded-2xl overflow-hidden bg-secondary/30 mb-4 relative">
                {product.images?.[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Sofa className="h-24 w-24 text-muted-foreground/30" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="badge-sale text-base px-3 py-1">-{discount}% OFF</span>
                  )}
                  {product.is_featured && (
                    <span className="badge-new text-base px-3 py-1">Featured</span>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-primary'
                          : 'border-transparent hover:border-muted-foreground/50'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {product.categories && (
                <Link
                  to={`/shop?category=${product.categories.slug}`}
                  className="text-sm text-primary font-medium uppercase tracking-wider hover:underline"
                >
                  {product.categories.name}
                </Link>
              )}

              <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-4">{product.name}</h1>

              {/* Price Section */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatCurrency(product.compare_at_price)}
                    </span>
                    <span className="badge-sale">Save {formatCurrency(product.compare_at_price - product.price)}</span>
                  </>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-muted-foreground mb-6 text-lg">{product.short_description}</p>
              )}

              {/* Specifications Card */}
              {specs.length > 0 && (
                <div className="bg-secondary/50 rounded-xl p-5 mb-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Product Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {specs.map((spec, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                          <spec.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{spec.label}</p>
                          <p className="font-medium">{spec.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border rounded-lg bg-background">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>


              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-card rounded-xl border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Free Delivery</p>
                    <p className="text-xs text-muted-foreground">On orders above ₹10,000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Quality Assured</p>
                    <p className="text-xs text-muted-foreground">Premium materials</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <RefreshCcw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Easy Returns</p>
                    <p className="text-xs text-muted-foreground">7-day return policy</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Support</p>
                    <p className="text-xs text-muted-foreground">Call: 86752 55084</p>
                  </div>
                </div>
              </div>

              {/* Description Tabs */}
              {product.description && (
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
                    <TabsTrigger value="shipping" className="flex-1">Shipping & Returns</TabsTrigger>
                  </TabsList>
                  <TabsContent value="description" className="mt-4">
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p>{product.description}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="shipping" className="mt-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Delivery</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Free delivery on orders above ₹10,000</li>
                          <li>Delivery within 5-10 business days</li>
                          <li>Installation available at select locations</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Returns & Refunds</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>7-day return policy for unused items</li>
                          <li>Items must be in original packaging</li>
                          <li>Contact us for return pickup</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </motion.div>
          </div>

          {/* Reviews Section */}
          <section className="mt-16">
            <ProductReviews productId={product.id} />
          </section>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
              <RelatedProductsCarousel products={relatedProducts} />
            </section>
          )}
        </div>
      </section>
    </Layout>
  );
}
