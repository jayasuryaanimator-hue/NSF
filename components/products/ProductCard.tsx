import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Ruler, TreeDeciduous } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ProductDimensions {
  size?: string | null;
  wood_type?: string | null;
  color?: string | null;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DimensionsType = ProductDimensions | any;

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  images?: string[] | null;
  short_description?: string | null;
  is_featured?: boolean;
  stock_quantity?: number;
  sku?: string | null;
  dimensions?: DimensionsType;
  categories?: {
    name: string;
    slug: string;
  } | null;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();

  // Parse dimensions safely
  const dimensions: ProductDimensions | null = 
    typeof product.dimensions === 'object' && product.dimensions !== null
      ? product.dimensions as ProductDimensions
      : null;

  const isWishlisted = isInWishlist(product.id);

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/auth?redirect=/shop');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
    });
  };

  const isOutOfStock = product.stock_quantity !== undefined && product.stock_quantity <= 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      className={cn('block group', className)}
    >
      <div className="product-card">
        {/* Image Container */}
        <div className="relative aspect-product bg-secondary/30 overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <span className="badge-sale">-{discount}%</span>
            )}
            {product.is_featured && (
              <span className="badge-new">Featured</span>
            )}
          </div>

          {/* Quick Actions - Wishlist */}
          <div className="absolute top-3 right-3">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full shadow-lg transition-all",
                isWishlisted ? "bg-destructive hover:bg-destructive/90" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isWishlisted) {
                  removeFromWishlist(product.id);
                } else {
                  addToWishlist({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0],
                    slug: product.slug,
                  });
                }
              }}
            >
              <Heart className={cn("h-4 w-4", isWishlisted && "fill-white text-white")} />
            </Button>
          </div>

          {/* Add to Cart Button */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <Button
              className="w-full gap-2"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingBag className="h-4 w-4" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="bg-foreground text-background px-4 py-2 rounded-full font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {product.categories && (
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {product.categories.name}
            </p>
          )}
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
          
          {/* Dimensions & Wood Type */}
          {(dimensions?.size || dimensions?.wood_type || product.sku) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
              {(dimensions?.size || product.sku) && (
                <span className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  {dimensions?.size || product.sku}
                </span>
              )}
              {dimensions?.wood_type && (
                <span className="flex items-center gap-1">
                  <TreeDeciduous className="h-3 w-3" />
                  {dimensions.wood_type}
                </span>
              )}
            </div>
          )}

          {product.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.short_description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
