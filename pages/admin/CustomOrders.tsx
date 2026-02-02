import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Eye, MessageCircle, Phone, Mail, Calendar, ChevronDown, IndianRupee, Image, ExternalLink, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderMessages } from '@/components/custom-orders/OrderMessages';

const WHATSAPP_NUMBER = '918344559144';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
  { value: 'quoted', label: 'Quoted', color: 'bg-purple-100 text-purple-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

interface CustomOrder {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  product_type: string;
  dimensions: string | null;
  finish_type: string | null;
  engraving_text: string | null;
  special_requirements: string | null;
  budget_range: string | null;
  timeline: string | null;
  reference_images: string[] | null;
  status: string;
  admin_notes: string | null;
  quoted_price: number | null;
  created_at: string;
}

export default function CustomOrders() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-custom-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .eq('deleted_by_admin', false)
        .eq('deleted_by_customer', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CustomOrder[];
    },
  });

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.name.toLowerCase().includes(search.toLowerCase()) ||
      order.email.toLowerCase().includes(search.toLowerCase()) ||
      order.product_type.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('custom_orders')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-custom-orders'] });
      toast.success('Order updated');
    },
    onError: (error) => {
      toast.error('Failed to update order');
      console.error(error);
    },
  });

  // Soft delete mutation for admin
  const softDeleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('custom_orders')
        .update({
          deleted_by_admin: true,
          admin_deleted_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-custom-orders'] });
      setSelectedOrder(null);
      toast.success('Order archived');
    },
    onError: (error) => {
      toast.error('Failed to archive order');
      console.error(error);
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ id: orderId, updates: { status: newStatus } });
  };

  const handleSaveDetails = () => {
    if (!selectedOrder) return;
    
    updateOrderMutation.mutate({
      id: selectedOrder.id,
      updates: {
        admin_notes: adminNotes,
        quoted_price: quotedPrice ? parseFloat(quotedPrice) : null,
      },
    });
  };

  const openOrderDetail = (order: CustomOrder) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || '');
    setQuotedPrice(order.quoted_price?.toString() || '');
  };

  const sendWhatsAppMessage = (order: CustomOrder) => {
    let message = `Hi ${order.name}!\n\n`;
    message += `Regarding your custom order request for: ${order.product_type}\n\n`;
    if (order.quoted_price) {
      message += `Quoted Price: ₹${order.quoted_price.toLocaleString()}\n\n`;
    }
    message += `Please let us know if you have any questions!\n\n`;
    message += `- Gounder & Co Team`;
    
    const phone = order.phone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone || WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Custom Orders</h1>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {orders?.filter(o => o.status === 'pending').length || 0} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle>All Custom Order Requests ({filteredOrders?.length || 0})</CardTitle>
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
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No custom orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.name}</p>
                          <p className="text-xs text-muted-foreground">{order.email}</p>
                          {order.phone && (
                            <p className="text-xs text-muted-foreground">{order.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{order.product_type}</p>
                        {order.dimensions && (
                          <p className="text-xs text-muted-foreground">{order.dimensions}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {order.finish_type && <p>Finish: {order.finish_type}</p>}
                          {order.engraving_text && <p>Engrave: {order.engraving_text}</p>}
                          {order.reference_images && order.reference_images.length > 0 && (
                            <p className="flex items-center gap-1">
                              <Image className="w-3 h-3" />
                              {order.reference_images.length} images
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.budget_range || '-'}</span>
                      </TableCell>
                      <TableCell>
                        {order.quoted_price ? (
                          <span className="font-medium text-green-600">
                            {formatCurrency(order.quoted_price)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="h-8 w-28">
                            {getStatusBadge(order.status)}
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(order.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openOrderDetail(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => sendWhatsAppMessage(order)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Order Details</DialogTitle>
            <DialogDescription>
              Order from {selectedOrder?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedOrder.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <a href={`mailto:${selectedOrder.email}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedOrder.email}
                  </a>
                </div>
                {selectedOrder.phone && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <a href={`tel:${selectedOrder.phone}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedOrder.phone}
                    </a>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(selectedOrder.created_at)}
                  </p>
                </div>
              </div>

              {/* Product Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Product Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Product Type</Label>
                    <p className="font-medium">{selectedOrder.product_type}</p>
                  </div>
                  {selectedOrder.dimensions && (
                    <div>
                      <Label className="text-muted-foreground">Dimensions</Label>
                      <p className="font-medium">{selectedOrder.dimensions}</p>
                    </div>
                  )}
                  {selectedOrder.finish_type && (
                    <div>
                      <Label className="text-muted-foreground">Finish Type</Label>
                      <p className="font-medium">{selectedOrder.finish_type}</p>
                    </div>
                  )}
                  {selectedOrder.engraving_text && (
                    <div>
                      <Label className="text-muted-foreground">Engraving</Label>
                      <p className="font-medium">{selectedOrder.engraving_text}</p>
                    </div>
                  )}
                  {selectedOrder.budget_range && (
                    <div>
                      <Label className="text-muted-foreground">Budget Range</Label>
                      <p className="font-medium">{selectedOrder.budget_range}</p>
                    </div>
                  )}
                  {selectedOrder.timeline && (
                    <div>
                      <Label className="text-muted-foreground">Timeline</Label>
                      <p className="font-medium">{selectedOrder.timeline}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Requirements */}
              {selectedOrder.special_requirements && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Special Requirements</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedOrder.special_requirements}</p>
                </div>
              )}

              {/* Reference Images */}
              {selectedOrder.reference_images && selectedOrder.reference_images.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground mb-3 block">Reference Images</Label>
                  <div className="flex flex-wrap gap-3">
                    {selectedOrder.reference_images.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
                        <img
                          src={url}
                          alt={`Reference ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Customer Messages
                </h3>
                <OrderMessages orderId={selectedOrder.id} senderType="admin" />
              </div>

              <Separator />

              {/* Admin Section */}
              <div className="space-y-4">
                <h3 className="font-semibold">Admin Actions</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quoted_price">Quoted Price (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="quoted_price"
                        type="number"
                        placeholder="Enter quote"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => {
                        handleStatusChange(selectedOrder.id, value);
                        setSelectedOrder({ ...selectedOrder, status: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_notes">Admin Notes (visible to customer)</Label>
                  <Textarea
                    id="admin_notes"
                    placeholder="Notes that will be visible to the customer..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSaveDetails} className="flex-1">
                    Save Details
                  </Button>
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    onClick={() => sendWhatsAppMessage(selectedOrder)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Archive
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will hide the order from your admin view. The customer will still be able to see their order until they delete it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => softDeleteMutation.mutate(selectedOrder.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Archive Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
