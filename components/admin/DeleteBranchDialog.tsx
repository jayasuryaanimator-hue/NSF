import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Package, Receipt, ShoppingCart, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface DeleteBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchName: string;
  branchId: string;
  stats: {
    products: number;
    orders: number;
    bills: number;
    quotations: number;
    stockValue: number;
  };
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export function DeleteBranchDialog({
  open,
  onOpenChange,
  branchName,
  branchId,
  stats,
  onConfirmDelete,
  isDeleting,
}: DeleteBranchDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  
  const isConfirmValid = confirmText === branchName;

  const handleClose = () => {
    setConfirmText('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Branch Permanently?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm">
                This action cannot be undone. This will permanently delete the branch
                <strong className="text-foreground"> "{branchName}"</strong> and all associated data.
              </p>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-destructive">
                  The following will be permanently deleted:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    <span>{stats.products} products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3" />
                    <span>{stats.orders} orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-3 w-3" />
                    <span>{stats.bills} bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    <span>{stats.quotations} quotations</span>
                  </div>
                </div>
                <p className="text-xs text-destructive font-medium pt-1">
                  Stock value: {formatCurrency(stats.stockValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  + Branch manager account will be deleted
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-sm">
                  Type <strong>"{branchName}"</strong> to confirm:
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={branchName}
                  className="font-mono"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            disabled={!isConfirmValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
