import { X, Trash2, Check, Eye, EyeOff, Mail, MailOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { motion, AnimatePresence } from 'framer-motion';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  requiresConfirmation?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  onClick: () => void;
}

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  isLoading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  actions,
  isLoading,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          {actions.map((action) =>
            action.requiresConfirmation ? (
              <AlertDialog key={action.id}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={action.variant || 'outline'}
                    size="sm"
                    disabled={isLoading}
                    className="h-8"
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {action.confirmTitle || `${action.label}?`}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {action.confirmDescription ||
                        `Are you sure you want to ${action.label.toLowerCase()} ${selectedCount} item${selectedCount !== 1 ? 's' : ''}?`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={action.onClick}
                      className={
                        action.variant === 'destructive'
                          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          : ''
                      }
                    >
                      {action.label}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={isLoading}
                className="h-8"
              >
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </Button>
            )
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Pre-built action creators for common use cases
export const createDeleteAction = (
  onDelete: () => void,
  count: number
): BulkAction => ({
  id: 'delete',
  label: 'Delete',
  icon: <Trash2 className="h-4 w-4" />,
  variant: 'destructive',
  requiresConfirmation: true,
  confirmTitle: 'Delete Selected Items?',
  confirmDescription: `This will permanently delete ${count} item${count !== 1 ? 's' : ''}. This action cannot be undone.`,
  onClick: onDelete,
});

export const createApproveAction = (onApprove: () => void): BulkAction => ({
  id: 'approve',
  label: 'Approve',
  icon: <Check className="h-4 w-4" />,
  variant: 'default',
  onClick: onApprove,
});

export const createUnapproveAction = (onUnapprove: () => void): BulkAction => ({
  id: 'unapprove',
  label: 'Unapprove',
  icon: <X className="h-4 w-4" />,
  variant: 'outline',
  onClick: onUnapprove,
});

export const createPublishAction = (onPublish: () => void): BulkAction => ({
  id: 'publish',
  label: 'Publish',
  icon: <Eye className="h-4 w-4" />,
  variant: 'default',
  onClick: onPublish,
});

export const createUnpublishAction = (onUnpublish: () => void): BulkAction => ({
  id: 'unpublish',
  label: 'Unpublish',
  icon: <EyeOff className="h-4 w-4" />,
  variant: 'outline',
  onClick: onUnpublish,
});

export const createMarkReadAction = (onMarkRead: () => void): BulkAction => ({
  id: 'mark-read',
  label: 'Mark Read',
  icon: <MailOpen className="h-4 w-4" />,
  variant: 'outline',
  onClick: onMarkRead,
});

export const createMarkUnreadAction = (onMarkUnread: () => void): BulkAction => ({
  id: 'mark-unread',
  label: 'Mark Unread',
  icon: <Mail className="h-4 w-4" />,
  variant: 'outline',
  onClick: onMarkUnread,
});

export const createExportAction = (onExport: () => void): BulkAction => ({
  id: 'export',
  label: 'Export',
  icon: <Download className="h-4 w-4" />,
  variant: 'outline',
  onClick: onExport,
});
