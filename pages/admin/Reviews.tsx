import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Star, Search, Trash2, Check, X, Pencil, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import {
  BulkActionsBar,
  createDeleteAction,
  createApproveAction,
  createUnapproveAction,
  createExportAction,
} from '@/components/admin/BulkActionsBar';
import { exportToExcel } from '@/lib/export';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_approved: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  product_id: string;
  user_id: string;
  products: { name: string; slug: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

export default function Reviews() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({ title: '', comment: '', rating: 5 });
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!reviewsData || reviewsData.length === 0) return [];

      // Fetch products
      const productIds = [...new Set(reviewsData.map((r) => r.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, slug')
        .in('id', productIds);

      const productsMap = new Map(productsData?.map((p) => [p.id, p]) || []);

      // Fetch profiles
      const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

      return reviewsData.map((review) => ({
        ...review,
        products: productsMap.get(review.product_id) || null,
        profiles: profilesMap.get(review.user_id) || null,
      })) as Review[];
    },
  });

  const filteredReviews = reviews.filter(
    (review) =>
      review.products?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bulkSelection = useBulkSelection(filteredReviews);

  // Stats
  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.is_approved).length,
    pending: reviews.filter(r => !r.is_approved).length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
      : '0',
  };

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: approved })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Review updated' });
    },
    onError: () => {
      toast({ title: 'Error updating review', variant: 'destructive' });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async ({ ids, approved }: { ids: string[]; approved: boolean }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: approved })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: `Reviews ${approved ? 'approved' : 'unapproved'}` });
      bulkSelection.clearSelection();
    },
    onError: () => {
      toast({ title: 'Error updating reviews', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, comment, rating }: { id: string; title: string; comment: string; rating: number }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ title, comment, rating })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Review updated successfully' });
      setEditingReview(null);
    },
    onError: () => {
      toast({ title: 'Error updating review', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Review deleted' });
    },
    onError: () => {
      toast({ title: 'Error deleting review', variant: 'destructive' });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('reviews').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Reviews deleted' });
      bulkSelection.clearSelection();
    },
    onError: () => {
      toast({ title: 'Error deleting reviews', variant: 'destructive' });
    },
  });

  const handleBulkExport = () => {
    const selected = bulkSelection.selectedItems;
    const exportData = selected.map(r => ({
      'Product': r.products?.name || 'Unknown',
      'Customer': r.profiles?.full_name || r.profiles?.email || 'Anonymous',
      'Rating': r.rating,
      'Title': r.title || '',
      'Comment': r.comment || '',
      'Status': r.is_approved ? 'Approved' : 'Pending',
      'Date': formatDate(r.created_at),
    }));
    exportToExcel(exportData, 'selected-reviews', 'Reviews');
    toast({ title: `${selected.length} reviews exported` });
  };

  const bulkActions = [
    createApproveAction(() =>
      bulkApproveMutation.mutate({
        ids: Array.from(bulkSelection.selectedIds),
        approved: true,
      })
    ),
    createUnapproveAction(() =>
      bulkApproveMutation.mutate({
        ids: Array.from(bulkSelection.selectedIds),
        approved: false,
      })
    ),
    createExportAction(handleBulkExport),
    createDeleteAction(
      () => bulkDeleteMutation.mutate(Array.from(bulkSelection.selectedIds)),
      bulkSelection.selectedCount
    ),
  ];

  const openEditDialog = (review: Review) => {
    setEditingReview(review);
    setEditForm({
      title: review.title || '',
      comment: review.comment || '',
      rating: review.rating,
    });
  };

  const handleUpdateReview = () => {
    if (editingReview) {
      updateMutation.mutate({
        id: editingReview.id,
        title: editForm.title,
        comment: editForm.comment,
        rating: editForm.rating,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          Reviews
        </h1>
        <p className="text-muted-foreground">Manage all customer reviews across the website</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{stats.averageRating}</p>
              <Star className="h-6 w-6 fill-warning text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews by product, customer, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <BulkActionsBar
        selectedCount={bulkSelection.selectedCount}
        onClearSelection={bulkSelection.clearSelection}
        actions={bulkActions}
        isLoading={bulkApproveMutation.isPending || bulkDeleteMutation.isPending}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={bulkSelection.isAllSelected}
                  onCheckedChange={bulkSelection.toggleAll}
                  aria-label="Select all"
                  className={bulkSelection.isPartiallySelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="max-w-xs">Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No reviews found
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow
                  key={review.id}
                  className={bulkSelection.isSelected(review.id) ? 'bg-primary/5' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={bulkSelection.isSelected(review.id)}
                      onCheckedChange={() => bulkSelection.toggleItem(review.id)}
                      aria-label={`Select review`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {review.products?.name || 'Unknown Product'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{review.profiles?.full_name || 'Anonymous'}</p>
                      {review.profiles?.email && (
                        <p className="text-xs text-muted-foreground">{review.profiles.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {review.title && <p className="font-medium truncate">{review.title}</p>}
                    {review.comment && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(review.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(review)}
                        title="Edit review"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      {/* Approve/Unapprove */}
                      {review.is_approved ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => approveMutation.mutate({ id: review.id, approved: false })}
                          title="Unapprove"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => approveMutation.mutate({ id: review.id, approved: true })}
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The review will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(review.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Review Dialog */}
      <Dialog open={!!editingReview} onOpenChange={(open) => !open && setEditingReview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Edit the review details for {editingReview?.products?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, rating: i + 1 }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 cursor-pointer transition-colors ${
                        i < editForm.rating
                          ? 'fill-warning text-warning'
                          : 'text-muted-foreground/30 hover:text-warning/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Review title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-comment">Comment</Label>
              <Textarea
                id="edit-comment"
                value={editForm.comment}
                onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Review comment"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReview(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateReview} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
