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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertTriangle, Search, Eye, Package } from 'lucide-react';

type DamagedStockItem = {
  id: string;
  quantity: number;
  damage_notes: string | null;
  recorded_at: string;
  product: { name: string; sku: string | null };
  branch: { name: string; code: string };
  from_branch: { name: string; code: string };
  transfer_item: {
    transfer: {
      transfer_number: string;
    };
  };
};

export default function DamagedStock() {
  const { isAdmin, userBranchId } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>(isAdmin ? 'all' : (userBranchId || 'all'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<DamagedStockItem | null>(null);

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

  const { data: damagedStock, isLoading } = useQuery({
    queryKey: ['damaged-stock', selectedBranch],
    queryFn: async () => {
      let query = supabase
        .from('damaged_stock')
        .select(`
          *,
          product:product_id (name, sku),
          branch:branch_id (name, code),
          from_branch:from_branch_id (name, code),
          transfer_item:transfer_item_id (
            transfer:transfer_id (transfer_number)
          )
        `)
        .order('recorded_at', { ascending: false });

      if (selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as DamagedStockItem[];
    },
  });

  const filteredStock = damagedStock?.filter(item =>
    (item.product as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.product as any)?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDamagedUnits = damagedStock?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          Damaged Stock
        </h1>
        <p className="text-muted-foreground">Track and manage damaged stock from transfers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Damaged Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-500">{damagedStock?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Damaged Units</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{totalDamagedUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {damagedStock?.filter(item => {
                const recordedDate = new Date(item.recorded_at);
                const now = new Date();
                return recordedDate.getMonth() === now.getMonth() && 
                       recordedDate.getFullYear() === now.getFullYear();
              }).length || 0}
            </p>
          </CardContent>
        </Card>
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
            {isAdmin && (
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Damaged Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Damaged Stock Records
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
                  <TableHead>From Branch</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Recorded At</TableHead>
                  <TableHead>Transfer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No damaged stock records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStock?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{(item.product as any)?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{(item.product as any)?.sku || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{(item.branch as any)?.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{(item.from_branch as any)?.code}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        {item.quantity}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.recorded_at), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {(item.transfer_item as any)?.transfer?.transfer_number || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Damaged Stock Details</DialogTitle>
                            </DialogHeader>
                            {selectedItem && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Product</p>
                                    <p className="font-medium">{(selectedItem.product as any)?.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Quantity</p>
                                    <p className="font-medium text-destructive">{selectedItem.quantity} units</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Receiving Branch</p>
                                    <p className="font-medium">{(selectedItem.branch as any)?.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Source Branch</p>
                                    <p className="font-medium">{(selectedItem.from_branch as any)?.name}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">Recorded At</p>
                                    <p className="font-medium">
                                      {format(new Date(selectedItem.recorded_at), 'dd MMMM yyyy, HH:mm:ss')}
                                    </p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">Transfer Reference</p>
                                    <p className="font-mono">
                                      {(selectedItem.transfer_item as any)?.transfer?.transfer_number || '-'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                                    Damage Details
                                  </p>
                                  <p className="text-sm">
                                    <strong>Damaged during stock transfer</strong> on{' '}
                                    {format(new Date(selectedItem.recorded_at), 'dd/MM/yyyy')} at{' '}
                                    {format(new Date(selectedItem.recorded_at), 'HH:mm')}
                                  </p>
                                  <p className="text-sm mt-1">
                                    From: <strong>{(selectedItem.from_branch as any)?.name}</strong> → 
                                    To: <strong>{(selectedItem.branch as any)?.name}</strong>
                                  </p>
                                  {selectedItem.damage_notes && (
                                    <p className="text-sm mt-2 text-muted-foreground">
                                      <strong>Notes:</strong> {selectedItem.damage_notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
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
