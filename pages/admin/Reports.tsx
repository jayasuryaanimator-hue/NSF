import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  RotateCcw, 
  AlertTriangle,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DateFilter, useDateFilter } from '@/components/admin/DateFilter';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToExcel, exportToPDF, formatStockReportForExport, formatReturnsForExport, exportMultipleSheetsToExcel } from '@/lib/export';
import { toast } from 'sonner';
import { format, parseISO, subMonths } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['hsl(85, 35%, 45%)', 'hsl(18, 65%, 55%)', 'hsl(40, 30%, 70%)', 'hsl(142, 50%, 45%)', 'hsl(200, 60%, 50%)'];

export default function Reports() {
  const [period, setPeriod] = useState('6months');

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

  // Fetch all data for reports
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['admin-reports', period],
    queryFn: async () => {
      const [ordersRes, productsRes, returnsRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('returns').select('*'),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (returnsRes.error) throw returnsRes.error;

      const allOrders = ordersRes.data || [];
      const products = productsRes.data || [];
      const allReturns = returnsRes.data || [];

      // These will be filtered by the component
      const orders = allOrders;
      const returns = allReturns;

      // Calculate sales by month
      const monthlyData: Record<string, { month: string; sales: number; orders: number }> = {};
      const monthCount = period === '12months' ? 12 : period === '6months' ? 6 : 3;
      
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const key = format(date, 'yyyy-MM');
        monthlyData[key] = { 
          month: format(date, 'MMM yyyy'), 
          sales: 0, 
          orders: 0 
        };
      }

      orders.forEach(order => {
        if (order.status === 'delivered' && order.payment_status === 'verified') {
          const key = format(parseISO(order.created_at), 'yyyy-MM');
          if (monthlyData[key]) {
            monthlyData[key].sales += Number(order.total_amount);
            monthlyData[key].orders += 1;
          }
        }
      });

      const salesChartData = Object.values(monthlyData);

      // Stock overview
      const stockData = products
        .filter(p => p.is_active)
        .map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock_quantity || 0,
          cost_price: p.cost_price || p.price,
          price: p.price,
          stockValue: (p.cost_price || p.price) * (p.stock_quantity || 0),
        }))
        .sort((a, b) => a.stock - b.stock);

      const outOfStock = stockData.filter(p => p.stock === 0);
      const lowStock = stockData.filter(p => p.stock > 0 && p.stock <= 5);
      const totalStockValue = stockData.reduce((sum, p) => sum + p.stockValue, 0);

      // Returns data
      const returnsByStatus = {
        requested: returns.filter(r => r.status === 'requested').length,
        approved: returns.filter(r => r.status === 'approved').length,
        rejected: returns.filter(r => r.status === 'rejected').length,
        processing: returns.filter(r => r.status === 'processing').length,
        completed: returns.filter(r => r.status === 'completed').length,
      };

      const totalRefunds = returns
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);

      // Order status distribution
      const ordersByStatus = orders.reduce((acc, order) => {
        const status = order.status || 'order_placed';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const orderStatusPieData = Object.entries(ordersByStatus).map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value,
      }));

      // Top products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      
      // Calculate total sales
      const totalSales = orders
        .filter(o => o.status === 'delivered' && o.payment_status === 'verified')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      return {
        salesChartData,
        stockData,
        outOfStock,
        lowStock,
        totalStockValue,
        returnsByStatus,
        totalRefunds,
        orderStatusPieData,
        totalOrders: orders.length,
        totalSales,
        totalReturns: returns.length,
        allOrders,
        allReturns,
      };
    },
  });

  // Apply date filter to orders and returns
  const filteredOrders = filterByDate(reportData?.allOrders);
  const filteredReturns = filterByDate(reportData?.allReturns);

  // Recalculate stats based on filtered data
  const filteredTotalSales = filteredOrders
    .filter(o => o.status === 'delivered' && o.payment_status === 'verified')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const filteredTotalOrders = filteredOrders.length;
  const filteredTotalReturns = filteredReturns.length;

  const filteredTotalRefunds = filteredReturns
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);

  const filteredReturnsByStatus = {
    requested: filteredReturns.filter(r => r.status === 'requested').length,
    approved: filteredReturns.filter(r => r.status === 'approved').length,
    rejected: filteredReturns.filter(r => r.status === 'rejected').length,
    processing: filteredReturns.filter(r => r.status === 'processing').length,
    completed: filteredReturns.filter(r => r.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Export handlers
  const handleExportExcel = () => {
    const sheets = [
      { data: reportData?.salesChartData || [], name: 'Sales Trend' },
      { data: formatStockReportForExport(reportData?.stockData || []), name: 'Stock Overview' },
      { data: formatReturnsForExport(filteredReturns), name: 'Returns' },
    ];
    exportMultipleSheetsToExcel(sheets, 'full-report');
    toast.success('Full report exported to Excel');
  };

  const handleExportPDF = () => {
    const headers = ['Product', 'SKU', 'Stock', 'Cost Price', 'Stock Value'];
    const data = (reportData?.stockData || []).map(p => [
      p.name,
      p.sku || '-',
      p.stock.toString(),
      formatCurrency(p.cost_price),
      formatCurrency(p.stockValue),
    ]);
    
    exportToPDF('Stock & Analytics Report', headers, data, 'analytics-report', {
      summary: [
        { label: 'Total Sales', value: formatCurrency(filteredTotalSales) },
        { label: 'Total Orders', value: filteredTotalOrders.toString() },
        { label: 'Stock Value', value: formatCurrency(reportData?.totalStockValue || 0) },
        { label: 'Total Refunds', value: formatCurrency(filteredTotalRefunds) },
      ],
    });
    toast.success('Report exported to PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
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
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <ExportButton
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(filteredTotalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{filteredTotalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/10">
                <Package className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(reportData?.totalStockValue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <RotateCcw className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Refunds</p>
                <p className="text-2xl font-bold">{formatCurrency(filteredTotalRefunds)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="stock">Stock Overview</TabsTrigger>
          <TabsTrigger value="returns">Returns Report</TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData?.salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(85, 35%, 45%)" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData?.salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="hsl(18, 65%, 55%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData?.orderStatusPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {reportData?.orderStatusPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stock Overview */}
        <TabsContent value="stock" className="space-y-6">
          {/* Alerts */}
          {((reportData?.outOfStock?.length || 0) > 0 || (reportData?.lowStock?.length || 0) > 0) && (
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportData?.outOfStock && reportData.outOfStock.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-destructive mb-2">
                      Out of Stock ({reportData.outOfStock.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {reportData.outOfStock.map(p => (
                        <Badge key={p.id} variant="destructive">{p.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {reportData?.lowStock && reportData.lowStock.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-warning mb-2">
                      Low Stock ({reportData.lowStock.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {reportData.lowStock.map(p => (
                        <Badge key={p.id} variant="secondary">
                          {p.name} ({p.stock})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Individual Product Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.stockData?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              product.stock === 0 
                                ? 'destructive' 
                                : product.stock <= 5 
                                  ? 'secondary' 
                                  : 'default'
                            }
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.cost_price)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.stockValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returns Report */}
        <TabsContent value="returns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(filteredReturnsByStatus).map(([status, count]) => (
              <Card key={status}>
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Returns Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Return Requests</span>
                <span className="font-bold">{filteredTotalReturns}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Refunded Amount</span>
                <span className="font-bold text-destructive">{formatCurrency(filteredTotalRefunds)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completion Rate</span>
                  <span>
                    {filteredTotalReturns 
                      ? Math.round((filteredReturnsByStatus.completed / filteredTotalReturns) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={
                    filteredTotalReturns 
                      ? (filteredReturnsByStatus.completed / filteredTotalReturns) * 100
                      : 0
                  } 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
