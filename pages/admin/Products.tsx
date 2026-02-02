import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff } from 'lucide-react';
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
import { formatCurrency } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { DateFilter, useDateFilter } from '@/components/admin/DateFilter';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToExcel, exportToPDF, formatProductsForExport } from '@/lib/export';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import {
  BulkActionsBar,
  createDeleteAction,
  createExportAction,
  BulkAction,
} from '@/components/admin/BulkActionsBar';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  images: string[] | null;
  created_at: string;
  categories: { name: string } | null;
}

export default function Products() {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isAdmin, isBranchManager, userBranchId } = useAuth();

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

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', isBranchManager, userBranchId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name), branches(name, code)')
        .order('created_at', { ascending: false });
      
      // Branch managers only see their branch's products
      if (isBranchManager && userBranchId) {
        query = query.eq('branch_id', userBranchId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (Product & { branches: { name: string; code: string } | null })[];
    },
  });

  // Filter by date first, then by search
  const dateFilteredProducts = filterByDate(products);
  
  const filteredProducts = dateFilteredProducts?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const bulkSelection = useBulkSelection(filteredProducts);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted successfully');
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete product');
      console.error(error);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Products deleted successfully');
      bulkSelection.clearSelection();
    },
    onError: () => {
      toast.error('Failed to delete products');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product status updated');
    },
    onError: (error) => {
      toast.error('Failed to update product status');
      console.error(error);
    },
  });

  const bulkToggleActiveMutation = useMutation({
    mutationFn: async ({ ids, isActive }: { ids: string[]; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Products ${isActive ? 'activated' : 'deactivated'}`);
      bulkSelection.clearSelection();
    },
    onError: () => {
      toast.error('Failed to update products');
    },
  });

  // Export handlers
  const handleExportExcel = () => {
    if (!filteredProducts?.length) {
      toast.error('No products to export');
      return;
    }
    exportToExcel(formatProductsForExport(filteredProducts), 'products-report', 'Products');
    toast.success('Products exported to Excel');
  };

  const handleExportPDF = () => {
    if (!filteredProducts?.length) {
      toast.error('No products to export');
      return;
    }
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'];
    const data = filteredProducts.map(product => [
      product.name,
      product.sku || '-',
      (product.categories as any)?.name || '-',
      formatCurrency(product.price),
      product.stock_quantity?.toString() || '0',
      product.is_active ? 'Active' : 'Inactive',
    ]);
    
    const totalStockValue = filteredProducts.reduce((sum, p) => 
      sum + ((p.cost_price || p.price) * (p.stock_quantity || 0)), 0);
    
    exportToPDF('Products Report', headers, data, 'products-report', {
      summary: [
        { label: 'Total Products', value: filteredProducts.length.toString() },
        { label: 'Total Stock Value', value: formatCurrency(totalStockValue) },
      ],
    });
    toast.success('Products exported to PDF');
  };

  const handleBulkExport = () => {
    const selectedProducts = bulkSelection.selectedItems;
    if (!selectedProducts.length) return;
    
    exportToExcel(formatProductsForExport(selectedProducts), 'selected-products', 'Products');
    toast.success(`${selectedProducts.length} products exported`);
  };

  // Only show bulk delete for admins
  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Activate',
      icon: <Eye className="h-4 w-4" />,
      variant: 'default',
      onClick: () => bulkToggleActiveMutation.mutate({
        ids: Array.from(bulkSelection.selectedIds),
        isActive: true,
      }),
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: <EyeOff className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => bulkToggleActiveMutation.mutate({
        ids: Array.from(bulkSelection.selectedIds),
        isActive: false,
      }),
    },
    createExportAction(handleBulkExport),
    ...(isAdmin ? [createDeleteAction(
      () => bulkDeleteMutation.mutate(Array.from(bulkSelection.selectedIds)),
      bulkSelection.selectedCount
    )] : []),
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link to="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <CardTitle>All Products ({filteredProducts?.length || 0})</CardTitle>
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
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <BulkActionsBar
            selectedCount={bulkSelection.selectedCount}
            onClearSelection={bulkSelection.clearSelection}
            actions={bulkActions}
            isLoading={bulkDeleteMutation.isPending || bulkToggleActiveMutation.isPending}
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
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  {isAdmin && <TableHead>Branch</TableHead>}
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts?.map((product) => (
                  <TableRow
                    key={product.id}
                    className={bulkSelection.isSelected(product.id) ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={bulkSelection.isSelected(product.id)}
                        onCheckedChange={() => bulkSelection.toggleItem(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
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
                            <span className="text-xs text-muted-foreground">No img</span>
                          </div>
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku || '-'}
                    </TableCell>
                    <TableCell>
                      {(product.categories as any)?.name || '-'}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {(product as any).branches ? (
                          <Badge variant="outline">
                            {(product as any).branches.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">All</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <span className="font-medium">{formatCurrency(product.price)}</span>
                        {product.compare_at_price && (
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            {formatCurrency(product.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </TableCell>
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
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: product.id, 
                            isActive: !product.is_active 
                          })}
                        >
                          {product.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Link to={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredProducts?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
