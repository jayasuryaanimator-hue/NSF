import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Pencil } from 'lucide-react';
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
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DateFilter, useDateFilter } from '@/components/admin/DateFilter';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToExcel, formatBillingForExport } from '@/lib/export';
import { toast } from 'sonner';

export default function Billing() {
  const [search, setSearch] = useState('');
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

  const { data: bills, isLoading } = useQuery({
    queryKey: ['admin-billing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('billing_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-billing'] });
      toast.success('Bill deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete bill');
      console.error(error);
    },
  });

  // Filter by date first
  const dateFilteredBills = filterByDate(bills);

  // Then filter by search
  const filteredBills = dateFilteredBills?.filter(bill => {
    const matchesSearch = 
      bill.bill_number.toLowerCase().includes(search.toLowerCase()) ||
      bill.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      bill.customer_phone?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  const totalAmount = filteredBills?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;

  // Export handlers
  const handleExportExcel = () => {
    if (!filteredBills?.length) {
      toast.error('No bills to export');
      return;
    }
    exportToExcel(formatBillingForExport(filteredBills), 'billing-report', 'Billing');
    toast.success('Billing data exported to Excel');
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
        <h1 className="text-2xl font-bold">Billing</h1>
        <Link to="/admin/billing/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Bill
          </Button>
        </Link>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Bills</p>
              <p className="text-2xl font-bold">{filteredBills?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle>All Bills</CardTitle>
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
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills?.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.bill_number}</TableCell>
                    <TableCell>{bill.customer_name}</TableCell>
                    <TableCell>{bill.customer_phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(bill.items as any[])?.length || 0} items
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(bill.total_amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(bill.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/billing/${bill.id}`}>
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/admin/billing/${bill.id}`}>
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
                                <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete bill {bill.bill_number}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBillMutation.mutate(bill.id)}
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

            {filteredBills?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No bills found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
