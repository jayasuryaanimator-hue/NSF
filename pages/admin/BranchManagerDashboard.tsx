import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  IndianRupee, 
  Package, 
  Receipt, 
  ShoppingCart,
  AlertCircle,
  XCircle,
  Plus,
  Eye,
  ArrowRight,
  Boxes,
  FileText,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DateFilter, useDateFilter } from '@/components/admin/DateFilter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BranchManagerDashboard() {
  const { userBranchId } = useAuth();
  
  const {
    dateFilter,
    monthFilter,
    yearFilter,
    setDateFilter,
    setMonthFilter,
    setYearFilter,
    resetFilters,
    filterByDate,
  } = useDateFilter();

  // Fetch branch details
  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ['branch-manager-branch', userBranchId],
    queryFn: async () => {
      if (!userBranchId) return null;
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', userBranchId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userBranchId,
  });

  // Fetch branch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['branch-manager-products', userBranchId],
    queryFn: async () => {
      if (!userBranchId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('branch_id', userBranchId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userBranchId,
  });

  // Fetch branch billing records
  const { data: billingRecords, isLoading: billingLoading } = useQuery({
    queryKey: ['branch-manager-billing', userBranchId],
    queryFn: async () => {
      if (!userBranchId) return [];
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .eq('branch_id', userBranchId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userBranchId,
  });

  // Fetch branch quotations
  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ['branch-manager-quotations', userBranchId],
    queryFn: async () => {
      if (!userBranchId) return [];
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('branch_id', userBranchId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userBranchId,
  });

  // Fetch branch orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['branch-manager-orders', userBranchId],
    queryFn: async () => {
      if (!userBranchId) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('branch_id', userBranchId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userBranchId,
  });

  const isLoading = branchLoading || productsLoading || billingLoading || quotationsLoading || ordersLoading;

  // Filter by date
  const filteredBillingRecords = filterByDate(billingRecords);
  const filteredQuotations = filterByDate(quotations);
  const filteredOrders = filterByDate(orders);

  // Calculate stats
  const activeProducts = products?.filter(p => p.is_active) || [];
  const lowStockProducts = activeProducts.filter(p => (p.stock_quantity || 0) <= 5 && (p.stock_quantity || 0) > 0);
  const outOfStockProducts = activeProducts.filter(p => (p.stock_quantity || 0) === 0);
  
  const totalStockValue = activeProducts.reduce((sum, p) => {
    return sum + ((p.cost_price || p.price) * (p.stock_quantity || 0));
  }, 0);

  const totalStockUnits = activeProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);

  const totalBillingAmount = filteredBillingRecords.reduce((sum, b) => sum + Number(b.total_amount), 0);
  const totalBillCount = filteredBillingRecords.length;

  const totalQuotationAmount = filteredQuotations.reduce((sum, q) => sum + Number(q.total_amount), 0);
  const totalQuotationCount = filteredQuotations.length;

  const totalOrderAmount = filteredOrders
    .filter(o => o.status === 'delivered' && o.payment_status === 'verified')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const pendingOrders = filteredOrders.filter(o => !['delivered', 'cancelled'].includes(o.status || '')).length;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'order_placed': 'bg-slate-500',
      'payment_verification_pending': 'bg-yellow-500',
      'payment_confirmed': 'bg-emerald-500',
      'product_packed': 'bg-blue-500',
      'shipped': 'bg-indigo-500',
      'out_for_delivery': 'bg-violet-500',
      'delivered': 'bg-green-500',
      'cancelled': 'bg-red-500',
      'draft': 'bg-slate-500',
      'sent': 'bg-blue-500',
      'accepted': 'bg-green-500',
      'rejected': 'bg-red-500',
      'expired': 'bg-gray-500',
    };
    return colors[status] || 'bg-slate-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Branch Assigned</h2>
        <p className="text-muted-foreground">You haven't been assigned to any branch yet.</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Stock Value',
      value: formatCurrency(totalStockValue),
      subtitle: `${totalStockUnits} units • ${activeProducts.length} products`,
      icon: Boxes,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-600/30',
    },
    {
      title: 'Billing Amount',
      value: formatCurrency(totalBillingAmount),
      subtitle: `${totalBillCount} bills created`,
      icon: Receipt,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-600/30',
    },
    {
      title: 'Quotations',
      value: formatCurrency(totalQuotationAmount),
      subtitle: `${totalQuotationCount} quotes sent`,
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-600/30',
    },
    {
      title: 'Orders',
      value: formatCurrency(totalOrderAmount),
      subtitle: `${pendingOrders} pending`,
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-600/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{branch.name}</h1>
            <Badge variant="outline" className="font-mono">{branch.code}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {branch.city && `${branch.city}, ${branch.state || ''}`}
          </p>
        </div>
        <DateFilter
          dateFilter={dateFilter}
          monthFilter={monthFilter}
          yearFilter={yearFilter}
          onDateChange={setDateFilter}
          onMonthChange={setMonthFilter}
          onYearChange={setYearFilter}
          onReset={resetFilters}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
        <Link to="/admin/billing/new">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Bill
          </Button>
        </Link>
        <Link to="/admin/quotations/new">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} text-white border-0`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/5" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {outOfStockProducts.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-semibold text-destructive">{outOfStockProducts.length}</p>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                </div>
              )}
              {lowStockProducts.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-warning/10">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-semibold text-warning">{lowStockProducts.length}</p>
                    <p className="text-sm text-muted-foreground">Low Stock (≤5)</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products ({activeProducts.length})</TabsTrigger>
          <TabsTrigger value="billing">Billing ({totalBillCount})</TabsTrigger>
          <TabsTrigger value="quotations">Quotations ({totalQuotationCount})</TabsTrigger>
          <TabsTrigger value="orders">Orders ({filteredOrders.length})</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Products
              </CardTitle>
              <Link to="/admin/products">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {products && products.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.slice(0, 10).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images?.[0] ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(product.categories as any)?.name || '-'}
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                (product.stock_quantity || 0) === 0 
                                  ? 'destructive' 
                                  : (product.stock_quantity || 0) <= 5 
                                    ? 'secondary' 
                                    : 'default'
                              }
                            >
                              {product.stock_quantity || 0}
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No products yet</p>
                  <Link to="/admin/products/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Billing Records
              </CardTitle>
              <Link to="/admin/billing">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {filteredBillingRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill No.</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBillingRecords.slice(0, 10).map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">{bill.bill_number}</TableCell>
                          <TableCell>{bill.customer_name}</TableCell>
                          <TableCell>{(bill.items as any[])?.length || 0} items</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(bill.total_amount)}</TableCell>
                          <TableCell>
                            {new Date(bill.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/admin/billing/${bill.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No billing records for selected period</p>
                  <Link to="/admin/billing/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Bill
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quotations
              </CardTitle>
              <Link to="/admin/quotations">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {filteredQuotations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote No.</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotations.slice(0, 10).map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">{quote.quotation_number}</TableCell>
                          <TableCell>{quote.customer_name}</TableCell>
                          <TableCell>{(quote.items as any[])?.length || 0} items</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(quote.total_amount)}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(quote.status)} text-white`}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(quote.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/admin/quotations/${quote.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No quotations for selected period</p>
                  <Link to="/admin/quotations/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Quote
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Orders
              </CardTitle>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order No.</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.slice(0, 10).map((order) => {
                        const shippingAddress = order.shipping_address as { name?: string } | null;
                        return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{shippingAddress?.name || 'N/A'}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(order.status || '')} text-white`}>
                              {order.status?.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.payment_status === 'verified' ? 'default' : 'secondary'}>
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders for selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
