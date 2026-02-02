import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Package, AlertTriangle, Search } from 'lucide-react';

export default function StockOverview() {
  const { isAdmin } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-stock', selectedBranch],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          branches:branch_id (name, code),
          categories:category_id (name)
        `)
        .eq('is_active', true)
        .order('name');

      if (selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: stockSummary } = useQuery({
    queryKey: ['branch-stock-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_stock_summary')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockBadge = (quantity: number | null) => {
    const qty = quantity ?? 0;
    if (qty === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (qty <= 10) return <Badge className="bg-amber-500">Low Stock</Badge>;
    return <Badge className="bg-emerald-500">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Overview</h1>
        <p className="text-muted-foreground">View stock levels across all branches</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stockSummary?.map((branch) => (
          <Card key={branch.branch_id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{branch.branch_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{branch.total_products || 0}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{branch.total_units || 0}</p>
                  <p className="text-xs text-muted-foreground">Units</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {(branch.low_stock_count ?? 0) > 0 && (
                  <Badge className="bg-amber-500 text-xs">
                    {branch.low_stock_count} Low
                  </Badge>
                )}
                {(branch.out_of_stock_count ?? 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {branch.out_of_stock_count} Out
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(product.branches as any)?.code || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{(product.categories as any)?.name || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.stock_quantity ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{product.price.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStockBadge(product.stock_quantity)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
