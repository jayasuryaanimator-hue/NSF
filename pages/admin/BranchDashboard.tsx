import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Store, 
  Package,
  Receipt,
  FileText,
  ShoppingCart,
  IndianRupee,
  MapPin,
  Phone,
  Mail,
  Plus,
  Eye,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';

export default function BranchDashboard() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch branch details
  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });

  // Fetch branch stock summary
  const { data: stockSummary } = useQuery({
    queryKey: ['branch-stock-summary', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_stock_summary')
        .select('*')
        .eq('branch_id', branchId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!branchId,
  });

  // Fetch branch billing summary
  const { data: billingSummary } = useQuery({
    queryKey: ['branch-billing-summary', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_billing_summary')
        .select('*')
        .eq('branch_id', branchId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!branchId,
  });

  // Fetch branch orders summary
  const { data: ordersSummary } = useQuery({
    queryKey: ['branch-orders-summary', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_orders_summary')
        .select('*')
        .eq('branch_id', branchId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!branchId,
  });

  // Fetch recent products for this branch
  const { data: recentProducts } = useQuery({
    queryKey: ['branch-products', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, is_active, images, created_at')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });

  // Fetch recent bills for this branch
  const { data: recentBills } = useQuery({
    queryKey: ['branch-bills', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_records')
        .select('id, bill_number, customer_name, total_amount, created_at')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });

  // Fetch recent quotations for this branch
  const { data: recentQuotations } = useQuery({
    queryKey: ['branch-quotations', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('id, quotation_number, customer_name, total_amount, status, created_at')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });

  // Fetch recent orders for this branch
  const { data: recentOrders } = useQuery({
    queryKey: ['branch-orders', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });

  if (branchLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Branch not found</h2>
        <Button onClick={() => navigate('/admin/branches')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Branches
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': case 'out_for_delivery': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'sent': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/branches')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {branch.name}
                <Badge variant="outline" className="font-mono text-sm">
                  {branch.code}
                </Badge>
                {!branch.is_active && <Badge variant="secondary">Inactive</Badge>}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {branch.address_line1}, {branch.city}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {branch.phone}
                </span>
                {branch.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {branch.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Package className="h-5 w-5" />
              <span className="text-sm font-medium">Products</span>
            </div>
            <p className="text-2xl font-bold">{stockSummary?.total_products || 0}</p>
            <p className="text-xs text-muted-foreground">{stockSummary?.total_units || 0} total units</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <IndianRupee className="h-5 w-5" />
              <span className="text-sm font-medium">Stock Value</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(Number(stockSummary?.total_cost_value) || 0)}</p>
            <p className="text-xs text-muted-foreground">Retail: {formatCurrency(Number(stockSummary?.total_retail_value) || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-violet-500/10 border-violet-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-violet-600 mb-2">
              <Receipt className="h-5 w-5" />
              <span className="text-sm font-medium">Total Bills</span>
            </div>
            <p className="text-2xl font-bold">{billingSummary?.total_bills || 0}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(Number(billingSummary?.total_amount) || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-medium">Orders</span>
            </div>
            <p className="text-2xl font-bold">{ordersSummary?.total_orders || 0}</p>
            <p className="text-xs text-muted-foreground">{ordersSummary?.pending_count || 0} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Total Sales</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(Number(ordersSummary?.total_sales) || 0)}</p>
            <p className="text-xs text-muted-foreground">{ordersSummary?.delivered_count || 0} delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">Stock Alerts</span>
            </div>
            <p className="text-2xl font-bold">{stockSummary?.out_of_stock_count || 0}</p>
            <p className="text-xs text-muted-foreground">{stockSummary?.low_stock_count || 0} low stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Bills */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Bills</CardTitle>
                  <CardDescription>Latest billing records</CardDescription>
                </div>
                <Link to={`/admin/billing?branch=${branchId}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Bill
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentBills && recentBills.length > 0 ? (
                  <div className="space-y-3">
                    {recentBills.slice(0, 5).map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{bill.bill_number}</p>
                          <p className="text-sm text-muted-foreground">{bill.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(Number(bill.total_amount))}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(bill.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No bills yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Quotations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Quotations</CardTitle>
                  <CardDescription>Latest quotations</CardDescription>
                </div>
                <Link to={`/admin/quotations?branch=${branchId}`}>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Quote
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentQuotations && recentQuotations.length > 0 ? (
                  <div className="space-y-3">
                    {recentQuotations.slice(0, 5).map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{quote.quotation_number}</p>
                          <p className="text-sm text-muted-foreground">{quote.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(quote.status || 'draft')}>
                            {quote.status}
                          </Badge>
                          <p className="text-sm font-semibold mt-1">{formatCurrency(Number(quote.total_amount))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No quotations yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Branch Products</h3>
            <Link to={`/admin/products/new?branch=${branchId}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProducts && recentProducts.length > 0 ? (
                  recentProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(Number(product.price))}</TableCell>
                      <TableCell>
                        <Badge variant={product.stock_quantity === 0 ? 'destructive' : product.stock_quantity! < 5 ? 'secondary' : 'default'}>
                          {product.stock_quantity} units
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No products for this branch yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Branch Bills</h3>
            <Link to={`/admin/billing/new?branch=${branchId}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Bill
              </Button>
            </Link>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBills && recentBills.length > 0 ? (
                  recentBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono">{bill.bill_number}</TableCell>
                      <TableCell>{bill.customer_name}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(Number(bill.total_amount))}</TableCell>
                      <TableCell>{format(new Date(bill.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/billing/${bill.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No bills for this branch yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Branch Orders</h3>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.order_number}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status || 'order_placed')}>
                          {order.status?.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(Number(order.total_amount))}</TableCell>
                      <TableCell>{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No orders for this branch yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
