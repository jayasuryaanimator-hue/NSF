import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, XCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DateFilter, useDateFilter } from '@/components/admin/DateFilter';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToExcel, exportToPDF, formatReturnsForExport } from '@/lib/export';
import { ReturnMessages } from '@/components/returns/ReturnMessages';
import type { Database } from '@/integrations/supabase/types';

type ReturnStatus = Database['public']['Enums']['return_status'];

const RETURN_STATUSES: ReturnStatus[] = [
  'requested',
  'approved',
  'rejected',
  'processing',
  'completed'
];

const getReturnStatusBadge = (status: ReturnStatus) => {
  const classes: Record<ReturnStatus, string> = {
    requested: 'bg-warning/10 text-warning',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    processing: 'bg-chart-5/10 text-chart-5',
    completed: 'bg-success/10 text-success',
  };
  return classes[status] || '';
};

// Hook to get unread message counts for all returns
function useReturnUnreadCounts() {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const { data, error } = await supabase
        .from('return_messages')
        .select('return_id')
        .eq('sender_type', 'customer')
        .eq('is_read', false);

      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((msg) => {
          counts[msg.return_id] = (counts[msg.return_id] || 0) + 1;
        });
        setUnreadCounts(counts);
      }
    };

    fetchUnreadCounts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-return-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_messages',
        },
        (payload) => {
          fetchUnreadCounts();
          
          // Show toast for new customer messages
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as any;
            if (newMsg.sender_type === 'customer') {
              toast.info('New customer message on return request', {
                icon: <MessageCircle className="h-4 w-4" />,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return unreadCounts;
}

export default function Returns() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [returnToReject, setReturnToReject] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();
  
  // Get unread message counts for all returns
  const unreadCounts = useReturnUnreadCounts();

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

  const { data: returns, isLoading } = useQuery({
    queryKey: ['admin-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          orders (
            order_number,
            total_amount,
            shipping_address
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateReturnMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from('returns')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      toast.success('Return updated');
      setSelectedReturn(null);
      setShowRejectDialog(false);
      setReturnToReject(null);
      setRejectReason('');
    },
    onError: (error) => {
      toast.error('Failed to update return');
      console.error(error);
    },
  });

  const handleStatusChange = (newStatus: ReturnStatus) => {
    if (!selectedReturn) return;

    const updates: Record<string, any> = { 
      status: newStatus,
      admin_notes: adminNotes,
    };
    
    if (newStatus === 'approved' || newStatus === 'processing') {
      updates.processed_at = new Date().toISOString();
    }
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.refund_amount = parseFloat(refundAmount) || null;
    }
    
    updateReturnMutation.mutate({ id: selectedReturn.id, updates });
  };

  const handleQuickReject = (ret: any) => {
    setReturnToReject(ret);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!returnToReject) return;
    
    updateReturnMutation.mutate({
      id: returnToReject.id,
      updates: {
        status: 'rejected',
        admin_notes: rejectReason || 'Return request rejected',
        processed_at: new Date().toISOString(),
      },
    });
  };

  // Filter by date first, then by other criteria
  const dateFilteredReturns = filterByDate(returns);
  
  const filteredReturns = dateFilteredReturns?.filter(ret => {
    const matchesSearch = 
      ret.orders?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      ret.reason.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const openReturnDetails = (ret: any) => {
    setSelectedReturn(ret);
    setAdminNotes(ret.admin_notes || '');
    setRefundAmount(ret.refund_amount?.toString() || '');
  };

  // Export handlers
  const handleExportExcel = () => {
    if (!filteredReturns?.length) {
      toast.error('No returns to export');
      return;
    }
    exportToExcel(formatReturnsForExport(filteredReturns), 'returns-report', 'Returns');
    toast.success('Returns exported to Excel');
  };

  const handleExportPDF = () => {
    if (!filteredReturns?.length) {
      toast.error('No returns to export');
      return;
    }
    const headers = ['Order #', 'Customer', 'Reason', 'Status', 'Refund Amount', 'Requested'];
    const data = filteredReturns.map(ret => [
      ret.orders?.order_number || '-',
      (ret.orders?.shipping_address as any)?.full_name || '-',
      ret.reason,
      ret.status?.charAt(0).toUpperCase() + ret.status?.slice(1) || '-',
      ret.refund_amount ? formatCurrency(ret.refund_amount) : '-',
      formatDateTime(ret.requested_at),
    ]);
    
    const totalRefunded = filteredReturns
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    
    exportToPDF('Returns Report', headers, data, 'returns-report', {
      summary: [
        { label: 'Total Returns', value: filteredReturns.length.toString() },
        { label: 'Pending', value: filteredReturns.filter(r => r.status === 'requested').length.toString() },
        { label: 'Approved', value: filteredReturns.filter(r => r.status === 'approved').length.toString() },
        { label: 'Rejected', value: filteredReturns.filter(r => r.status === 'rejected').length.toString() },
        { label: 'Completed', value: filteredReturns.filter(r => r.status === 'completed').length.toString() },
        { label: 'Total Refunded', value: formatCurrency(totalRefunded) },
      ],
    });
    toast.success('Returns exported to PDF');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Summary stats
  const pendingCount = filteredReturns?.filter(r => r.status === 'requested').length || 0;
  const approvedCount = filteredReturns?.filter(r => r.status === 'approved').length || 0;
  const rejectedCount = filteredReturns?.filter(r => r.status === 'rejected').length || 0;
  const completedCount = filteredReturns?.filter(r => r.status === 'completed').length || 0;
  const totalRefunded = filteredReturns
    ?.filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Returns & Refunds</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-success">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-primary">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-chart-5/5 border-chart-5/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Refunded</p>
            <p className="text-2xl font-bold text-chart-5">{formatCurrency(totalRefunded)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle>All Returns ({filteredReturns?.length || 0})</CardTitle>
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
                  placeholder="Search returns..."
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
                  {RETURN_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns?.map((ret) => {
                  const unreadCount = unreadCounts[ret.id] || 0;
                  return (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {ret.orders?.order_number}
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(ret.orders?.shipping_address as any)?.full_name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{ret.reason}</p>
                          {ret.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {ret.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ret.refund_amount 
                          ? formatCurrency(ret.refund_amount)
                          : formatCurrency(ret.orders?.total_amount || 0)
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={getReturnStatusBadge(ret.status)}>
                          {ret.status?.charAt(0).toUpperCase() + ret.status?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(ret.requested_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openReturnDetails(ret)}
                            title="View Details"
                            className="relative"
                          >
                            <Eye className="h-4 w-4" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
                            )}
                          </Button>
                          {ret.status === 'requested' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleQuickReject(ret)}
                              title="Reject"
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredReturns?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No return requests found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Return Details Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Request Details</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Order:</span>
                  <p className="font-medium">{selectedReturn.orders?.order_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Order Amount:</span>
                  <p className="font-medium">{formatCurrency(selectedReturn.orders?.total_amount || 0)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">
                    {(selectedReturn.orders?.shipping_address as any)?.full_name}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Requested:</span>
                  <p className="font-medium">{formatDateTime(selectedReturn.requested_at)}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Reason:</span>
                <p className="font-medium">{selectedReturn.reason}</p>
                {selectedReturn.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedReturn.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* Messages Section */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                </Label>
                <ReturnMessages
                  returnId={selectedReturn.id}
                  senderType="admin"
                  className="border rounded-lg p-3 bg-muted/30"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={selectedReturn.status} 
                  onValueChange={(v) => {
                    setSelectedReturn({ ...selectedReturn, status: v });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Refund Amount (₹)</Label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={selectedReturn.orders?.total_amount?.toString()}
                />
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this return..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedReturn(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleStatusChange(selectedReturn.status)}
                  disabled={updateReturnMutation.isPending}
                >
                  {updateReturnMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Return Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the return request for order {returnToReject?.orders?.order_number}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Rejection Reason (Optional)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReturnToReject(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={updateReturnMutation.isPending}
            >
              {updateReturnMutation.isPending ? 'Rejecting...' : 'Reject Return'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
