import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Search, Eye, ChevronDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime, formatOrderStatus, formatPaymentStatus, getStatusBadgeClass } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DateFilter, useDateFilter } from '@/components/admin/DateFilter';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToExcel, exportToPDF, formatOrdersForExport } from '@/lib/export';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar, createExportAction, BulkAction } from '@/components/admin/BulkActionsBar';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

const ORDER_STATUSES: OrderStatus[] = [
  'order_placed',
  'payment_verification_pending',
  'payment_confirmed',
  'product_packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'pending',
  'verification_pending',
  'verified',
  'failed',
  'refunded'
];

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus | null;
  payment_status: PaymentStatus | null;
  payment_method: string;
  upi_transaction_id: string | null;
  subtotal: number;
  tax_amount: number | null;
  shipping_amount: number | null;
  total_amount: number;
  shipping_address: any;
  created_at: string;
  order_items: any[];
}

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  
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

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            product_image
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });

  // First filter by date, then by other filters
  const dateFilteredOrders = filterByDate(orders);
  
  const filteredOrders = dateFilteredOrders?.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (order.shipping_address as any)?.full_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  }) || [];

  const bulkSelection = useBulkSelection(filteredOrders);

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated');
    },
    onError: (error) => {
      toast.error('Failed to update order');
      console.error(error);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: OrderStatus }) => {
      const updates: Record<string, any> = { status };
      if (status === 'product_packed') updates.packed_at = new Date().toISOString();
      if (status === 'shipped') updates.shipped_at = new Date().toISOString();
      if (status === 'out_for_delivery') updates.out_for_delivery_at = new Date().toISOString();
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();
      if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Orders updated');
      bulkSelection.clearSelection();
    },
    onError: () => {
      toast.error('Failed to update orders');
    },
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updates: Record<string, any> = { status: newStatus };
    
    if (newStatus === 'product_packed') updates.packed_at = new Date().toISOString();
    if (newStatus === 'shipped') updates.shipped_at = new Date().toISOString();
    if (newStatus === 'out_for_delivery') updates.out_for_delivery_at = new Date().toISOString();
    if (newStatus === 'delivered') updates.delivered_at = new Date().toISOString();
    if (newStatus === 'cancelled') updates.cancelled_at = new Date().toISOString();
    
    updateOrderMutation.mutate({ id: orderId, updates });
  };

  const handlePaymentStatusChange = (orderId: string, newStatus: PaymentStatus) => {
    const updates: Record<string, any> = { payment_status: newStatus };
    
    if (newStatus === 'verified') {
      updates.payment_verified_at = new Date().toISOString();
      updates.status = 'payment_confirmed';
    }
    
    updateOrderMutation.mutate({ id: orderId, updates });
  };

  // Export handlers
  const handleExportExcel = () => {
    if (!filteredOrders?.length) {
      toast.error('No orders to export');
      return;
    }
    exportToExcel(formatOrdersForExport(filteredOrders), 'orders-report', 'Orders');
    toast.success('Orders exported to Excel');
  };

  const handleExportPDF = () => {
    if (!filteredOrders?.length) {
      toast.error('No orders to export');
      return;
    }
    const headers = ['Order #', 'Customer', 'Status', 'Payment', 'Total', 'Date'];
    const data = filteredOrders.map(order => [
      order.order_number,
      (order.shipping_address as any)?.full_name || '-',
      formatOrderStatus(order.status || 'order_placed'),
      formatPaymentStatus(order.payment_status || 'pending'),
      formatCurrency(order.total_amount),
      formatDateTime(order.created_at),
    ]);
    
    const totalAmount = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    
    exportToPDF('Orders Report', headers, data, 'orders-report', {
      orientation: 'landscape',
      summary: [
        { label: 'Total Orders', value: filteredOrders.length.toString() },
        { label: 'Total Amount', value: formatCurrency(totalAmount) },
      ],
    });
    toast.success('Orders exported to PDF');
  };

  const handleBulkExport = () => {
    const selectedOrders = bulkSelection.selectedItems;
    if (!selectedOrders.length) return;
    
    exportToExcel(formatOrdersForExport(selectedOrders), 'selected-orders', 'Orders');
    toast.success(`${selectedOrders.length} orders exported`);
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'mark-shipped',
      label: 'Mark Shipped',
      icon: <Download className="h-4 w-4" />,
      variant: 'default',
      onClick: () => bulkStatusMutation.mutate({
        ids: Array.from(bulkSelection.selectedIds),
        status: 'shipped',
      }),
    },
    {
      id: 'mark-delivered',
      label: 'Mark Delivered',
      icon: <Eye className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => bulkStatusMutation.mutate({
        ids: Array.from(bulkSelection.selectedIds),
        status: 'delivered',
      }),
    },
    createExportAction(handleBulkExport),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle>All Orders ({filteredOrders?.length || 0})</CardTitle>
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
          <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-48 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatOrderStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full sm:w-40 h-9">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatPaymentStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <BulkActionsBar
            selectedCount={bulkSelection.selectedCount}
            onClearSelection={bulkSelection.clearSelection}
            actions={bulkActions}
            isLoading={bulkStatusMutation.isPending}
          />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={bulkSelection.isAllSelected}
                      onCheckedChange={bulkSelection.toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order) => (
                  <TableRow
                    key={order.id}
                    className={bulkSelection.isSelected(order.id) ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={bulkSelection.isSelected(order.id)}
                        onCheckedChange={() => bulkSelection.toggleItem(order.id)}
                        aria-label={`Select order ${order.order_number}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{order.order_number}</span>
                        {order.payment_method === 'upi' && order.upi_transaction_id && (
                          <p className="text-xs text-muted-foreground">
                            UPI: {order.upi_transaction_id}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{(order.shipping_address as any)?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(order.shipping_address as any)?.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {order.order_items?.slice(0, 2).map((item: any) => (
                          <div 
                            key={item.id}
                            className="h-8 w-8 rounded bg-muted overflow-hidden"
                            title={`${item.product_name} x${item.quantity}`}
                          >
                            {item.product_image ? (
                              <img 
                                src={item.product_image} 
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs">
                                {item.quantity}
                              </div>
                            )}
                          </div>
                        ))}
                        {(order.order_items?.length || 0) > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{(order.order_items?.length || 0) - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Badge 
                              variant={order.payment_status === 'verified' ? 'default' : 'secondary'}
                              className="cursor-pointer"
                            >
                              {formatPaymentStatus(order.payment_status || 'pending')}
                            </Badge>
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {PAYMENT_STATUSES.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handlePaymentStatusChange(order.id, status)}
                            >
                              {formatPaymentStatus(status)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Badge 
                              className={`cursor-pointer ${getStatusBadgeClass(order.status || 'order_placed')}`}
                            >
                              {formatOrderStatus(order.status || 'order_placed')}
                            </Badge>
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {ORDER_STATUSES.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleStatusChange(order.id, status)}
                            >
                              {formatOrderStatus(status)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/admin/orders/${order.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredOrders?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
