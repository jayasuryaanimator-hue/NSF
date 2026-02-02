import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, 
  Store, 
  Edit, 
  MapPin, 
  Phone,
  Package,
  Receipt,
  FileText,
  ShoppingCart,
  IndianRupee,
  Trash2,
  Copy,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { BranchCredentialsSection } from '@/components/admin/BranchCredentialsSection';
import { DeleteBranchDialog } from '@/components/admin/DeleteBranchDialog';

interface Branch {
  id: string;
  name: string;
  code: string;
  slug: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  email: string | null;
  instagram_url: string | null;
  map_embed_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface BranchFormData {
  name: string;
  code: string;
  slug: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  email: string;
  instagram_url: string;
  map_embed_url: string;
  is_active: boolean;
  display_order: number;
}

const defaultFormData: BranchFormData = {
  name: '',
  code: '',
  slug: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: 'Tamil Nadu',
  postal_code: '',
  phone: '',
  email: '',
  instagram_url: '',
  map_embed_url: '',
  is_active: true,
  display_order: 0,
};

export default function BranchManagement() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(defaultFormData);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch branches
  const { data: branches, isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Branch[];
    },
  });

  // Fetch branch summaries
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

  const { data: billingSummary } = useQuery({
    queryKey: ['branch-billing-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_billing_summary')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: ordersSummary } = useQuery({
    queryKey: ['branch-orders-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_orders_summary')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch quotations summary
  const { data: quotationsSummary } = useQuery({
    queryKey: ['branch-quotations-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_quotations_summary')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch branch credentials
  const { data: credentials, refetch: refetchCredentials } = useQuery({
    queryKey: ['branch-credentials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_credentials')
        .select('branch_id, email, user_id');
      
      if (error) throw error;
      return data;
    },
  });

  // Create/Update branch mutation
  const saveBranchMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update(data)
          .eq('id', editingBranch.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('branches')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      toast.success(editingBranch ? 'Branch updated successfully' : 'Branch created successfully');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(`Failed to save branch: ${error.message}`);
    },
  });

  const handleOpenDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        code: branch.code,
        slug: branch.slug || branch.code.toLowerCase(),
        address_line1: branch.address_line1,
        address_line2: branch.address_line2 || '',
        city: branch.city,
        state: branch.state,
        postal_code: branch.postal_code,
        phone: branch.phone,
        email: branch.email || '',
        instagram_url: branch.instagram_url || '',
        map_embed_url: branch.map_embed_url || '',
        is_active: branch.is_active,
        display_order: branch.display_order,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        ...defaultFormData,
        display_order: (branches?.length || 0) + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const generateSlug = (code: string) => {
    return code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleCodeChange = (code: string) => {
    const upperCode = code.toUpperCase();
    setFormData({ 
      ...formData, 
      code: upperCode,
      slug: formData.slug || generateSlug(upperCode)
    });
  };

  const copyBranchUrl = (slug: string) => {
    const url = `${window.location.origin}/${slug}/`;
    navigator.clipboard.writeText(url);
    toast.success('Branch URL copied to clipboard');
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBranch(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBranchMutation.mutate(formData);
  };

  const getBranchStats = (branchId: string) => {
    const stock = stockSummary?.find(s => s.branch_id === branchId);
    const billing = billingSummary?.find(b => b.branch_id === branchId);
    const orders = ordersSummary?.find(o => o.branch_id === branchId);
    const quotations = quotationsSummary?.find(q => q.branch_id === branchId);
    return { stock, billing, orders, quotations };
  };

  const getBranchCredentials = (branchId: string) => {
    return credentials?.find(c => c.branch_id === branchId) || null;
  };

  const handleDeleteBranch = async () => {
    if (!deletingBranch) return;
    
    setIsDeleting(true);
    try {
      const creds = getBranchCredentials(deletingBranch.id);
      
      // Delete auth user if exists
      if (creds) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-branch-user`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                action: 'delete',
                branchId: deletingBranch.id,
                branchCode: deletingBranch.code,
                branchName: deletingBranch.name,
                userId: creds.user_id,
              }),
            }
          );
        }
      }

      // Delete branch (cascades to all related data)
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', deletingBranch.id);

      if (error) throw error;

      toast.success('Branch deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch-credentials'] });
      setDeletingBranch(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete branch');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground">Manage all your showroom branches</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Edappadi Showroom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="e.g., EDP"
                    maxLength={5}
                    required
                  />
                </div>
              </div>

              {/* URL Slug Field */}
              <div className="space-y-2">
                <Label htmlFor="slug">Branch URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded-md">/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="edappadi"
                    className="font-mono"
                    required
                  />
                  <span className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded-md">/</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Branch URL path: <code className="bg-muted px-1 rounded">/{formData.slug || 'slug'}/</code> — This will be accessible at your domain
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1 *</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  placeholder="Area, landmark"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="map_embed_url">Google Maps Embed URL</Label>
                <Textarea
                  id="map_embed_url"
                  value={formData.map_embed_url}
                  onChange={(e) => setFormData({ ...formData, map_embed_url: e.target.value })}
                  placeholder="Paste Google Maps embed URL"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveBranchMutation.isPending}>
                  {saveBranchMutation.isPending ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Branch Cards */}
      <div className="grid gap-6">
        {branches?.map((branch) => {
          const stats = getBranchStats(branch.id);
          const branchCreds = getBranchCredentials(branch.id);
          return (
            <Card 
              key={branch.id} 
              className={`transition-all hover:shadow-lg hover:border-primary/50 ${!branch.is_active ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => navigate(`/admin/branches/${branch.id}`)}
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {branch.name}
                        <Badge variant="outline" className="font-mono">
                          {branch.code}
                        </Badge>
                        {!branch.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {branch.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {branch.phone}
                        </span>
                      </div>
                      {/* Branch URL */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          /{branch.slug || branch.code.toLowerCase()}/
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyBranchUrl(branch.slug || branch.code.toLowerCase());
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/${branch.slug || branch.code.toLowerCase()}/`, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(branch);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingBranch(branch);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Credentials Section */}
                <div onClick={(e) => e.stopPropagation()}>
                  <BranchCredentialsSection
                    branchId={branch.id}
                    branchCode={branch.code}
                    branchName={branch.name}
                    credentials={branchCreds}
                    onCredentialsCreated={() => refetchCredentials()}
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Products */}
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-xs font-medium">Products</span>
                    </div>
                    <p className="text-lg font-bold">{stats.stock?.total_products || 0}</p>
                    <p className="text-xs text-muted-foreground">{stats.stock?.total_units || 0} units</p>
                  </div>

                  {/* Stock Value */}
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <IndianRupee className="h-4 w-4" />
                      <span className="text-xs font-medium">Stock Value</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(Number(stats.stock?.total_cost_value) || 0)}</p>
                    <p className="text-xs text-muted-foreground">Retail: {formatCurrency(Number(stats.stock?.total_retail_value) || 0)}</p>
                  </div>

                  {/* Bills */}
                  <div className="p-3 rounded-lg bg-violet-500/10">
                    <div className="flex items-center gap-2 text-violet-600 mb-1">
                      <Receipt className="h-4 w-4" />
                      <span className="text-xs font-medium">Bills</span>
                    </div>
                    <p className="text-lg font-bold">{stats.billing?.total_bills || 0}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(Number(stats.billing?.total_amount) || 0)}</p>
                  </div>

                  {/* Orders */}
                  <div className="p-3 rounded-lg bg-emerald-500/10">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-xs font-medium">Orders</span>
                    </div>
                    <p className="text-lg font-bold">{stats.orders?.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">{stats.orders?.pending_count || 0} pending</p>
                  </div>

                  {/* Sales */}
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <IndianRupee className="h-4 w-4" />
                      <span className="text-xs font-medium">Sales</span>
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(Number(stats.orders?.total_sales) || 0)}</p>
                    <p className="text-xs text-muted-foreground">{stats.orders?.delivered_count || 0} delivered</p>
                  </div>

                  {/* Stock Alerts */}
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-xs font-medium">Alerts</span>
                    </div>
                    <p className="text-lg font-bold">{stats.stock?.out_of_stock_count || 0}</p>
                    <p className="text-xs text-muted-foreground">{stats.stock?.low_stock_count || 0} low stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!branches || branches.length === 0) && (
        <Card className="p-8 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Branches Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first branch to get started</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </Card>
      )}

      {/* Delete Branch Dialog */}
      {deletingBranch && (
        <DeleteBranchDialog
          open={!!deletingBranch}
          onOpenChange={(open) => !open && setDeletingBranch(null)}
          branchName={deletingBranch.name}
          branchId={deletingBranch.id}
          stats={{
            products: Number(getBranchStats(deletingBranch.id).stock?.total_products) || 0,
            orders: Number(getBranchStats(deletingBranch.id).orders?.total_orders) || 0,
            bills: Number(getBranchStats(deletingBranch.id).billing?.total_bills) || 0,
            quotations: Number(getBranchStats(deletingBranch.id).quotations?.total_quotations) || 0,
            stockValue: Number(getBranchStats(deletingBranch.id).stock?.total_cost_value) || 0,
          }}
          onConfirmDelete={handleDeleteBranch}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
