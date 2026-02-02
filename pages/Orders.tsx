import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, formatOrderStatus, getStatusBadgeClass } from '@/lib/format';
import { motion } from 'framer-motion';
import { Package, ChevronRight, ShoppingBag, Loader2 } from 'lucide-react';

export default function Orders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            product_image,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="container-deiva section-padding flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container-deiva section-padding text-center">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-6">
            You need to sign in to view your orders.
          </p>
          <Button asChild>
            <Link to="/auth?redirect=/orders">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-deiva">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl border p-6 animate-pulse">
                    <div className="h-6 bg-secondary rounded w-1/4 mb-4" />
                    <div className="h-4 bg-secondary rounded w-1/2 mb-2" />
                    <div className="h-4 bg-secondary rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/orders/${order.id}`}
                      className="block bg-card rounded-xl border p-6 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="font-semibold">{order.order_number}</h2>
                            <span className={getStatusBadgeClass(order.status)}>
                              {formatOrderStatus(order.status)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Placed on {formatDate(order.created_at)}
                          </p>
                          <div className="flex items-center gap-4">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Items:</span>{' '}
                              {order.order_items?.length || 0}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Total:</span>{' '}
                              <span className="font-semibold text-primary">
                                {formatCurrency(order.total_amount)}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="flex items-center gap-2">
                          {order.order_items?.slice(0, 3).map((item: any) => (
                            <div
                              key={item.id}
                              className="h-12 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0"
                            >
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                          ))}
                          {(order.order_items?.length || 0) > 3 && (
                            <span className="text-sm text-muted-foreground">
                              +{order.order_items.length - 3} more
                            </span>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                <p className="text-muted-foreground mb-6">
                  You haven't placed any orders. Start shopping to see your orders here.
                </p>
                <Button asChild>
                  <Link to="/shop">Start Shopping</Link>
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
