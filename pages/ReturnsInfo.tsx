import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  RefreshCcw,
  ArrowLeft,
  Loader2,
  Package,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const getReturnStatusBadge = (status: string) => {
  switch (status) {
    case 'requested':
      return <Badge variant="outline" className="border-warning text-warning"><Clock className="h-3 w-3 mr-1" />Requested</Badge>;
    case 'approved':
      return <Badge variant="outline" className="border-success text-success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="border-destructive text-destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    case 'processing':
      return <Badge variant="outline" className="border-primary text-primary"><RefreshCcw className="h-3 w-3 mr-1" />Processing</Badge>;
    case 'completed':
      return <Badge variant="outline" className="border-success text-success"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ReturnsInfo() {
  const { user } = useAuth();

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['user-returns', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          orders (
            order_number,
            total_amount
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Layout>
        <div className="container-deiva section-padding text-center">
          <RefreshCcw className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Button asChild>
            <Link to="/auth?redirect=/returns-info">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding">
        <div className="container-deiva max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/account">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Returns & Refunds</h1>
                <p className="text-muted-foreground text-sm">
                  Track your return and refund requests
                </p>
              </div>
            </div>

            {/* Return Policy Info */}
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 mb-8">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <RefreshCcw className="h-5 w-5 text-primary" />
                Return Policy
              </h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Returns accepted within 7 days of delivery
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Products must be unused and in original packaging
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Refunds processed within 5-7 business days
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  Free return pickup for damaged or wrong products
                </li>
              </ul>
            </div>

            <h2 className="text-xl font-semibold mb-4">Your Return Requests</h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : returns.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No returns yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't requested any returns or refunds
                </p>
                <Button asChild variant="outline">
                  <Link to="/orders">View Orders</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map((returnItem: any) => (
                  <motion.div
                    key={returnItem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl border p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold">{returnItem.orders?.order_number}</p>
                          {getReturnStatusBadge(returnItem.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Requested on {formatDate(returnItem.requested_at)}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Reason:</span> {returnItem.reason}
                        </p>
                        {returnItem.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {returnItem.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {returnItem.refund_amount && (
                          <p className="font-semibold text-lg">
                            {formatCurrency(returnItem.refund_amount)}
                          </p>
                        )}
                        <Link
                          to={`/orders/${returnItem.order_id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View Order →
                        </Link>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={returnItem.status !== 'rejected' ? 'text-success' : ''}>
                          Requested
                        </span>
                        <span>→</span>
                        <span className={['approved', 'processing', 'completed'].includes(returnItem.status) ? 'text-success' : ''}>
                          Reviewed
                        </span>
                        <span>→</span>
                        <span className={['processing', 'completed'].includes(returnItem.status) ? 'text-success' : ''}>
                          Processing
                        </span>
                        <span>→</span>
                        <span className={returnItem.status === 'completed' ? 'text-success' : ''}>
                          Refunded
                        </span>
                      </div>
                    </div>

                    {returnItem.admin_notes && returnItem.status === 'rejected' && (
                      <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                        <p className="text-sm text-destructive">
                          <span className="font-medium">Note:</span> {returnItem.admin_notes}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
