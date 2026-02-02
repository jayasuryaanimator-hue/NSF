import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BranchManagerDashboard from './BranchManagerDashboard';
import { 
  DollarSign, 
  ShoppingCart,
  Package, 
  Users, 
  AlertCircle, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RotateCcw,
  Receipt,
  Boxes,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DateFilter, useDateFilter } from '@/components/admin/DateFilter';
import { ExportButton } from '@/components/admin/ExportButton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  exportDashboardSummary, 
  exportToExcel, 
  formatOrdersForExport, 
  formatProductsForExport,
  formatBillingForExport,
  formatStockReportForExport,
} from '@/lib/export';
import ReminderSection from '@/components/admin/ReminderSection';

export default function Dashboard() {
  const { isAdmin, isBranchManager } = useAuth();
  
  // Show branch manager dashboard for branch managers
  if (isBranchManager && !isAdmin) {
    return <BranchManagerDashboard />;
  }

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

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      // Get orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      
      if (ordersError) throw ordersError;

      // Get products data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) throw productsError;

      // Get customers (profiles)
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('*');
      
      if (customersError) throw customersError;

      // Get returns
      const { data: returns, error: returnsError } = await supabase
        .from('returns')
        .select('*');
      
      if (returnsError) throw returnsError;

      // Get billing records
      const { data: billingRecords, error: billingError } = await supabase
        .from('billing_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (billingError) throw billingError;

      return {
        orders: orders || [],
        products: products || [],
        customers: customers || [],
        returns: returns || [],
        billingRecords: billingRecords || [],
      };
    },
  });

  // Filter data by date
  const filteredOrders = filterByDate(stats?.orders);
  const filteredBillingRecords = filterByDate(stats?.billingRecords);
  const filteredReturns = filterByDate(stats?.returns);

  // Calculate stats from filtered data
  const totalSales = filteredOrders
    .filter(o => o.status === 'delivered' && o.payment_status === 'verified')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const pendingPayments = filteredOrders
    .filter(o => o.payment_status === 'verification_pending')
    .length;

  const activeShipments = filteredOrders
    .filter(o => ['shipped', 'out_for_delivery'].includes(o.status || ''))
    .length;

  const pendingReturns = filteredReturns
    .filter(r => r.status === 'requested')
    .length;

  const totalRefunds = filteredReturns
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);

  // Products stats (not filtered by date)
  const activeProducts = stats?.products?.filter(p => p.is_active) || [];
  const lowStockProducts = activeProducts.filter(p => (p.stock_quantity || 0) <= 5 && (p.stock_quantity || 0) > 0);
  const outOfStockProducts = activeProducts.filter(p => (p.stock_quantity || 0) === 0);

  // Total stock value calculation
  const totalStockValue = activeProducts.reduce((sum, p) => {
    return sum + ((p.cost_price || p.price) * (p.stock_quantity || 0));
  }, 0);

  const totalRetailValue = activeProducts.reduce((sum, p) => {
    return sum + (p.price * (p.stock_quantity || 0));
  }, 0);

  const totalStockUnits = activeProducts.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);

  // Billing stats
  const totalBillingAmount = filteredBillingRecords.reduce((sum, b) => sum + Number(b.total_amount), 0);
  const totalBillCount = filteredBillingRecords.length;

  // Order status distribution
  const ordersByStatus = {
    order_placed: filteredOrders.filter(o => o.status === 'order_placed').length,
    payment_verification_pending: filteredOrders.filter(o => o.status === 'payment_verification_pending').length,
    payment_confirmed: filteredOrders.filter(o => o.status === 'payment_confirmed').length,
    product_packed: filteredOrders.filter(o => o.status === 'product_packed').length,
    shipped: filteredOrders.filter(o => o.status === 'shipped').length,
    out_for_delivery: filteredOrders.filter(o => o.status === 'out_for_delivery').length,
    delivered: filteredOrders.filter(o => o.status === 'delivered').length,
    cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Skeleton className="h-10 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  const colorfulCards = [
    {
      title: 'Total Sales',
      value: formatCurrency(totalSales),
      subtitle: `${filteredOrders.filter(o => o.status === 'delivered').length} orders delivered`,
      icon: IndianRupee,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-600/30',
    },
    {
      title: 'Total Orders',
      value: filteredOrders.length,
      subtitle: `${ordersByStatus.order_placed} new`,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-600/30',
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
      title: 'Stock Value',
      value: formatCurrency(totalStockValue),
      subtitle: `${totalStockUnits} units in stock`,
      icon: Boxes,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-600/30',
    },
    {
      title: 'Pending Payments',
      value: pendingPayments,
      subtitle: 'Awaiting verification',
      icon: Clock,
      gradient: 'from-yellow-500 to-amber-600',
      iconBg: 'bg-yellow-600/30',
    },
    {
      title: 'Active Shipments',
      value: activeShipments,
      subtitle: 'In transit',
      icon: Truck,
      gradient: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-cyan-600/30',
    },
    {
      title: 'Pending Returns',
      value: pendingReturns,
      subtitle: `${formatCurrency(totalRefunds)} refunded`,
      icon: RotateCcw,
      gradient: 'from-rose-500 to-red-600',
      iconBg: 'bg-rose-600/30',
    },
    {
      title: 'Total Customers',
      value: stats?.customers?.length || 0,
      subtitle: 'Registered users',
      icon: Users,
      gradient: 'from-pink-500 to-rose-600',
      iconBg: 'bg-pink-600/30',
    },
  ];

  const orderStatusCards = [
    { status: 'Order Placed', count: ordersByStatus.order_placed, color: 'bg-slate-500' },
    { status: 'Payment Pending', count: ordersByStatus.payment_verification_pending, color: 'bg-yellow-500' },
    { status: 'Confirmed', count: ordersByStatus.payment_confirmed, color: 'bg-emerald-500' },
    { status: 'Packed', count: ordersByStatus.product_packed, color: 'bg-blue-500' },
    { status: 'Shipped', count: ordersByStatus.shipped, color: 'bg-indigo-500' },
    { status: 'Out for Delivery', count: ordersByStatus.out_for_delivery, color: 'bg-violet-500' },
    { status: 'Delivered', count: ordersByStatus.delivered, color: 'bg-green-500' },
    { status: 'Cancelled', count: ordersByStatus.cancelled, color: 'bg-red-500' },
  ];

  // Sort products by stock value for display
  const topProductsByValue = [...activeProducts]
    .map(p => ({
      ...p,
      stockValue: (p.cost_price || p.price) * (p.stock_quantity || 0),
    }))
    .sort((a, b) => b.stockValue - a.stockValue)
    .slice(0, 10);

  // Export handlers
  const handleExportExcel = () => {
    const dashboardData = [
      { Metric: 'Total Sales', Value: formatCurrency(totalSales) },
      { Metric: 'Total Orders', Value: filteredOrders.length },
      { Metric: 'Total Customers', Value: stats?.customers?.length || 0 },
      { Metric: 'Stock Value', Value: formatCurrency(totalStockValue) },
      { Metric: 'Billing Amount', Value: formatCurrency(totalBillingAmount) },
      { Metric: 'Total Bills', Value: totalBillCount },
      { Metric: 'Pending Payments', Value: pendingPayments },
      { Metric: 'Active Shipments', Value: activeShipments },
      { Metric: 'Pending Returns', Value: pendingReturns },
    ];
    exportToExcel(dashboardData, 'dashboard-summary', 'Summary');
  };

  const handleExportPDF = () => {
    exportDashboardSummary({
      totalSales,
      totalOrders: filteredOrders.length,
      totalCustomers: stats?.customers?.length || 0,
      pendingPayments,
      activeShipments,
      pendingReturns,
      totalStockValue,
      totalBillingAmount,
      totalBillCount,
      ordersByStatus,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Filter and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter
            dateFilter={dateFilter}
            monthFilter={monthFilter}
            yearFilter={yearFilter}
            onDateChange={setDateFilter}
            onMonthChange={setMonthFilter}
            onYearChange={setYearFilter}
            onReset={resetFilters}
          />
          <ExportButton
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Reminder Section - Action Required */}
      <ReminderSection />

      {/* Colorful Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {colorfulCards.map((stat) => (
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
              {/* Decorative circles */}
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

      {/* Order Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Order Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {orderStatusCards.map((item) => (
              <div key={item.status} className="relative p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${item.color}`} />
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-amber-500" />
              Stock Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
                  <p className="text-sm text-muted-foreground">Cost Value</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{formatCurrency(totalStockValue)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                  <p className="text-sm text-muted-foreground">Retail Value</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalRetailValue)}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Total Units</span>
                  <span className="font-semibold">{totalStockUnits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Active Products</span>
                  <span className="font-semibold">{activeProducts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Potential Profit</span>
                  <span className="font-semibold text-success">{formatCurrency(totalRetailValue - totalStockValue)}</span>
                </div>
              </div>

              {/* Top Products by Value */}
              {topProductsByValue.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Top Products by Stock Value</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {topProductsByValue.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground w-5">#{index + 1}</span>
                          <span className="text-sm truncate max-w-[150px]">{product.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(product.stockValue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-violet-500" />
              Billing Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200/50 dark:border-violet-800/50">
                  <p className="text-sm text-muted-foreground">Total Bills</p>
                  <p className="text-xl font-bold text-violet-700 dark:text-violet-400">{totalBillCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(totalBillingAmount)}</p>
                </div>
              </div>

              {/* Recent Bills */}
              {filteredBillingRecords.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Recent Bills</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredBillingRecords.slice(0, 5).map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{bill.bill_number}</p>
                          <p className="text-xs text-muted-foreground">{bill.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(bill.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No bills found for selected period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
