import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Pencil, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatCurrency, formatDateTime, formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DateFilter, useDateFilter } from '@/components/admin/DateFilter';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToExcel } from '@/lib/export';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const getStatusBadge = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-chart-5/10 text-chart-5',
    accepted: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    expired: 'bg-warning/10 text-warning',
  };
  return classes[status] || 'bg-muted text-muted-foreground';
};

export default function Quotations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

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

  const { data: quotations, isLoading } = useQuery({
    queryKey: ['admin-quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteQuotationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quotations'] });
      toast.success('Quotation deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete quotation');
      console.error(error);
    },
  });

  // Filter by date first
  const dateFilteredQuotations = filterByDate(quotations);

  const filteredQuotations = dateFilteredQuotations?.filter(quote => {
    const matchesSearch = 
      quote.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      quote.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      quote.customer_phone?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredQuotations?.reduce((sum, q) => sum + Number(q.total_amount), 0) || 0;

  // Export handlers
  const formatQuotationsForExport = (quotations: any[]) => {
    return quotations.map(quote => ({
      'Quotation Number': quote.quotation_number,
      'Customer Name': quote.customer_name,
      'Email': quote.customer_email || '-',
      'Phone': quote.customer_phone || '-',
      'Items Count': (quote.items as any[])?.length || 0,
      'Subtotal': formatCurrency(quote.subtotal),
      'Tax': formatCurrency(quote.tax_amount || 0),
      'Discount': formatCurrency(quote.discount_amount || 0),
      'Total': formatCurrency(quote.total_amount),
      'Status': quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1) || 'Draft',
      'Valid Until': quote.valid_until ? formatDate(quote.valid_until) : '-',
      'Date': formatDateTime(quote.created_at),
    }));
  };

  const handleExportExcel = () => {
    if (!filteredQuotations?.length) {
      toast.error('No quotations to export');
      return;
    }
    exportToExcel(formatQuotationsForExport(filteredQuotations), 'quotations-report', 'Quotations');
    toast.success('Quotations exported to Excel');
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Quotations</h1>
        <Link to="/admin/quotations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Quotation
          </Button>
        </Link>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Quotations</p>
              <p className="text-2xl font-bold">{filteredQuotations?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle>All Quotations</CardTitle>
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
                  isLoading={isLoading}
                  showPdfOption={false}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-48 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
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
                  <TableHead>Quotation No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quotation_number}</TableCell>
                    <TableCell>
                      <div>
                        <p>{quote.customer_name}</p>
                        {quote.customer_phone && (
                          <p className="text-xs text-muted-foreground">{quote.customer_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(quote.items as any[])?.length || 0} items
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(quote.total_amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(quote.status || 'draft')}>
                        {quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1) || 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(quote.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/quotations/${quote.id}`}>
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/admin/quotations/${quote.id}`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" title="Delete" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete quotation {quote.quotation_number}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteQuotationMutation.mutate(quote.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredQuotations?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No quotations found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
