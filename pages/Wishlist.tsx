import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function Wishlist() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image || '',
    }, 1);
    removeItem(item.productId);
    toast.success('Added to cart');
  };

  const handleAddAllToCart = () => {
    items.forEach((item) => {
      addToCart({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image || '',
      }, 1);
    });
    clearWishlist();
    toast.success('All items added to cart');
  };

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">My Wishlist</h1>
            </div>
            <p className="text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </motion.div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-card rounded-2xl border"
            >
              <Heart className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Save items you love by clicking the heart icon on products. They'll appear here for easy access.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link to="/shop">
                  Browse Products <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl border">
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{formatCurrency(items.reduce((sum, item) => sum + item.price, 0))}</span>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearWishlist}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button size="sm" onClick={handleAddAllToCart}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add All to Cart
                  </Button>
                </div>
              </div>

              {/* Wishlist Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item, index) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl border overflow-hidden group hover:shadow-lg transition-shadow"
                  >
                    <Link to={`/product/${item.slug}`} className="block relative aspect-square">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeItem(item.productId);
                          toast.success('Removed from wishlist');
                        }}
                        className="absolute top-3 right-3 h-9 w-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                      >
                        <Heart className="h-5 w-5 text-primary fill-primary" />
                      </button>
                    </Link>
                    <div className="p-4">
                      <Link to={`/product/${item.slug}`}>
                        <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold text-primary mt-1">
                        {formatCurrency(item.price)}
                      </p>
                      <Button
                        className="w-full mt-3 gap-2"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
