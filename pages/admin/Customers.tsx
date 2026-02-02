import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, ShoppingCart, Mail, Phone, Trash2, Pencil, Shield, TrendingUp, Package, IndianRupee, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToExcel, exportToPDF, formatCustomersForExport } from '@/lib/export';
import { Separator } from '@/components/ui/separator';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Get orders for selected customer (detail view)
  const { data: customerOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-customer-orders', selectedCustomer?.user_id],
    queryFn: async () => {
      if (!selectedCustomer?.user_id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', selectedCustomer.user_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer?.user_id,
  });

  const { data: customerAddresses } = useQuery({
    queryKey: ['admin-customer-addresses', selectedCustomer?.user_id],
    queryFn: async () => {
      if (!selectedCustomer?.user_id) return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', selectedCustomer.user_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer?.user_id,
  });

  // Get data for delete preview
  const { data: deletePreviewData, isLoading: deletePreviewLoading } = useQuery({
    queryKey: ['admin-customer-delete-preview', customerToDelete?.user_id],
    queryFn: async () => {
      if (!customerToDelete?.user_id) return null;
      
      const [ordersResult, addressesResult, reviewsResult, returnsResult] = await Promise.all([
        supabase.from('orders').select('id, order_number, total_amount, status').eq('user_id', customerToDelete.user_id),
        supabase.from('addresses').select('id').eq('user_id', customerToDelete.user_id),
        supabase.from('reviews').select('id').eq('user_id', customerToDelete.user_id),
        supabase.from('returns').select('id').eq('user_id', customerToDelete.user_id),
      ]);
      
      return {
        orders: ordersResult.data || [],
        addressCount: addressesResult.data?.length || 0,
        reviewCount: reviewsResult.data?.length || 0,
        returnCount: returnsResult.data?.length || 0,
      };
    },
    enabled: !!customerToDelete?.user_id,
  });

  // Calculate order statistics
  const orderStats = useMemo(() => {
    if (!customerOrders || customerOrders.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        totalItems: 0,
      };
    }

    const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const completedOrders = customerOrders.filter(o => o.status === 'delivered').length;
    const pendingOrders = customerOrders.filter(o => 
      ['order_placed', 'payment_verification_pending', 'payment_confirmed', 'product_packed', 'shipped', 'out_for_delivery'].includes(o.status || '')
    ).length;
    const cancelledOrders = customerOrders.filter(o => o.status === 'cancelled').length;
    const totalItems = customerOrders.reduce((sum, order) => 
      sum + (order.order_items?.length || 0), 0
    );

    return {
      totalOrders: customerOrders.length,
      totalSpent,
      averageOrderValue: totalSpent / customerOrders.length,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalItems,
    };
  }, [customerOrders]);

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('Customer updated successfully');
      setEditingCustomer(null);
    },
    onError: (error) => {
      toast.error('Failed to update customer');
      console.error(error);
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete related data first (in order to avoid foreign key constraints)
      const { error: addressError } = await supabase.from('addresses').delete().eq('user_id', userId);
      if (addressError) console.error('Error deleting addresses:', addressError);
      
      const { error: reviewsError } = await supabase.from('reviews').delete().eq('user_id', userId);
      if (reviewsError) console.error('Error deleting reviews:', reviewsError);
      
      const { error: rolesError } = await supabase.from('user_roles').delete().eq('user_id', userId);
      if (rolesError) console.error('Error deleting user roles:', rolesError);
      
      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
      console.error(error);
    },
  });

  const filteredCustomers = customers?.filter(c => 
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openEditDialog = (customer: any) => {
    setEditingCustomer(customer);
    setEditForm({
      full_name: customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
    });
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer) return;
    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      updates: {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
      },
    });
  };

  // Export handlers
  const handleExportExcel = () => {
    if (!filteredCustomers?.length) {
      toast.error('No customers to export');
      return;
    }
    exportToExcel(formatCustomersForExport(filteredCustomers), 'customers-report', 'Customers');
    toast.success('Customers exported to Excel');
  };

  const handleExportPDF = () => {
    if (!filteredCustomers?.length) {
      toast.error('No customers to export');
      return;
    }
    const headers = ['Name', 'Email', 'Phone', 'Joined'];
    const data = filteredCustomers.map(customer => [
      customer.full_name || '-',
      customer.email || '-',
      customer.phone || '-',
      formatDateTime(customer.created_at),
    ]);
    
    exportToPDF('Customers Report', headers, data, 'customers-report', {
      summary: [
        { label: 'Total Customers', value: filteredCustomers.length.toString() },
      ],
    });
    toast.success('Customers exported to PDF');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Customers ({customers?.length || 0})</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <ExportButton
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                isLoading={isLoading}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Security Note */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> User passwords are securely hashed and cannot be viewed or recovered. 
              Users can reset their passwords via the "Forgot Password" option on the login page.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={customer.avatar_url || ''} />
                          <AvatarFallback>{getInitials(customer.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{customer.full_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {customer.email || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {customer.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(customer.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedCustomer(customer)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(customer)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setCustomerToDelete(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredCustomers?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No customers found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCustomer.avatar_url || ''} />
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedCustomer.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedCustomer.full_name || 'Unknown'}</h3>
                  <p className="text-muted-foreground">{selectedCustomer.email}</p>
                  {selectedCustomer.phone && (
                    <p className="text-muted-foreground">{selectedCustomer.phone}</p>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <strong>User ID:</strong> <span className="font-mono text-xs">{selectedCustomer.user_id}</span>
                </p>
                <p className="text-sm mt-1">
                  <strong>Joined:</strong> {formatDateTime(selectedCustomer.created_at)}
                </p>
              </div>

              {/* Customer Statistics */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Customer Statistics
                </h4>
                {ordersLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-primary">{orderStats.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <IndianRupee className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(orderStats.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(orderStats.averageOrderValue)}</p>
                      <p className="text-xs text-muted-foreground">Avg. Order</p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Package className="h-4 w-4 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{orderStats.totalItems}</p>
                      <p className="text-xs text-muted-foreground">Items Bought</p>
                    </div>
                  </div>
                )}
                
                {/* Order Status Breakdown */}
                {orderStats.totalOrders > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      ✓ {orderStats.completedOrders} Delivered
                    </Badge>
                    {orderStats.pendingOrders > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        ⏳ {orderStats.pendingOrders} In Progress
                      </Badge>
                    )}
                    {orderStats.cancelledOrders > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        ✕ {orderStats.cancelledOrders} Cancelled
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Addresses */}
              <div>
                <h4 className="font-semibold mb-3">Saved Addresses ({customerAddresses?.length || 0})</h4>
                {customerAddresses && customerAddresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customerAddresses.map((addr: any) => (
                      <div key={addr.id} className="p-3 border rounded-lg text-sm">
                        <p className="font-medium">{addr.full_name}</p>
                        <p className="text-muted-foreground">{addr.address_line1}</p>
                        {addr.address_line2 && (
                          <p className="text-muted-foreground">{addr.address_line2}</p>
                        )}
                        <p className="text-muted-foreground">
                          {addr.city}, {addr.state} {addr.postal_code}
                        </p>
                        <p className="text-muted-foreground">{addr.phone}</p>
                        {addr.is_default && (
                          <Badge variant="secondary" className="mt-2">Default</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No saved addresses</p>
                )}
              </div>

              <Separator />

              {/* Order History */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Order History ({customerOrders?.length || 0})
                </h4>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : customerOrders && customerOrders.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customerOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(order.created_at)} • {order.order_items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}
                          >
                            {order.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No orders yet</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="customer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingCustomer(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCustomer}
                disabled={updateCustomerMutation.isPending}
              >
                {updateCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog with Preview */}
      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Customer
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete <strong>{customerToDelete?.full_name || 'this customer'}</strong>?
                </p>
                
                {deletePreviewLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading customer data...</span>
                  </div>
                ) : deletePreviewData && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="font-medium text-foreground">This action will affect:</p>
                    
                    {/* Orders Warning */}
                    {deletePreviewData.orders.length > 0 && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-destructive font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {deletePreviewData.orders.length} Order(s) Found
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This customer has existing orders. Deleting will orphan these orders.
                        </p>
                        <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
                          {deletePreviewData.orders.slice(0, 3).map((order: any) => (
                            <div key={order.id} className="text-xs flex justify-between">
                              <span>{order.order_number}</span>
                              <span>{formatCurrency(order.total_amount)}</span>
                            </div>
                          ))}
                          {deletePreviewData.orders.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{deletePreviewData.orders.length - 3} more orders...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Data to be deleted */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-background rounded">
                        <p className="font-bold">{deletePreviewData.addressCount}</p>
                        <p className="text-xs text-muted-foreground">Addresses</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="font-bold">{deletePreviewData.reviewCount}</p>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <p className="font-bold">{deletePreviewData.returnCount}</p>
                        <p className="text-xs text-muted-foreground">Returns</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Profile, roles, addresses, and reviews will be permanently deleted.
                    </p>
                  </div>
                )}

                <p className="text-destructive font-medium text-sm">
                  ⚠️ This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (customerToDelete) {
                  deleteCustomerMutation.mutate(customerToDelete.user_id);
                  setCustomerToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Customer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
