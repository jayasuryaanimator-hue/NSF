import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Trash2, Mail, MailOpen, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import {
  BulkActionsBar,
  createDeleteAction,
  createMarkReadAction,
  createMarkUnreadAction,
  createExportAction,
} from '@/components/admin/BulkActionsBar';
import { exportToExcel } from '@/lib/export';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  replied_at: string | null;
}

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Message[];
    },
  });

  const filteredMessages = messages.filter(
    (msg) =>
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bulkSelection = useBulkSelection(filteredMessages);
  const unreadCount = messages.filter((m) => !m.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    },
  });

  const bulkMarkReadMutation = useMutation({
    mutationFn: async ({ ids, is_read }: { ids: string[]; is_read: boolean }) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { is_read }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast({ title: `Messages marked as ${is_read ? 'read' : 'unread'}` });
      bulkSelection.clearSelection();
    },
    onError: () => {
      toast({ title: 'Error updating messages', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast({ title: 'Message deleted' });
    },
    onError: () => {
      toast({ title: 'Error deleting message', variant: 'destructive' });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('contact_messages').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast({ title: 'Messages deleted' });
      bulkSelection.clearSelection();
    },
    onError: () => {
      toast({ title: 'Error deleting messages', variant: 'destructive' });
    },
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markReadMutation.mutate({ id: message.id, is_read: true });
    }
  };

  const handleBulkExport = () => {
    const selected = bulkSelection.selectedItems;
    const exportData = selected.map(m => ({
      'Name': m.name,
      'Email': m.email,
      'Phone': m.phone || '',
      'Subject': m.subject || 'No subject',
      'Message': m.message,
      'Status': m.is_read ? 'Read' : 'Unread',
      'Date': formatDateTime(m.created_at),
    }));
    exportToExcel(exportData, 'selected-messages', 'Messages');
    toast({ title: `${selected.length} messages exported` });
  };

  const bulkActions = [
    createMarkReadAction(() =>
      bulkMarkReadMutation.mutate({
        ids: Array.from(bulkSelection.selectedIds),
        is_read: true,
      })
    ),
    createMarkUnreadAction(() =>
      bulkMarkReadMutation.mutate({
        ids: Array.from(bulkSelection.selectedIds),
        is_read: false,
      })
    ),
    createExportAction(handleBulkExport),
    createDeleteAction(
      () => bulkDeleteMutation.mutate(Array.from(bulkSelection.selectedIds)),
      bulkSelection.selectedCount
    ),
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All messages read'}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
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
        isLoading={bulkMarkReadMutation.isPending || bulkDeleteMutation.isPending}
      />

      <div className="border rounded-lg">
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
              <TableHead className="w-8"></TableHead>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages.map((msg) => (
                <TableRow
                  key={msg.id}
                  className={`${!msg.is_read ? 'bg-primary/5' : ''} ${
                    bulkSelection.isSelected(msg.id) ? 'bg-primary/10' : ''
                  }`}
                >
                  <TableCell>
                    <Checkbox
                      checked={bulkSelection.isSelected(msg.id)}
                      onCheckedChange={() => bulkSelection.toggleItem(msg.id)}
                      aria-label={`Select message from ${msg.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    {msg.is_read ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className={`font-medium ${!msg.is_read ? 'text-foreground' : ''}`}>
                        {msg.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{msg.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className={`truncate ${!msg.is_read ? 'font-medium' : ''}`}>
                      {msg.subject || 'No subject'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                  </TableCell>
                  <TableCell>{formatDateTime(msg.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewMessage(msg)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markReadMutation.mutate({ id: msg.id, is_read: !msg.is_read })}
                        title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                      >
                        {msg.is_read ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <MailOpen className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(msg.id)}
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
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject || 'No subject'}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">From:</span>{' '}
                  <span className="font-medium">{selectedMessage.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <a href={`tel:${selectedMessage.phone}`} className="text-primary hover:underline">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Date:</span>{' '}
                  {formatDateTime(selectedMessage.created_at)}
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || ''}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Reply via Email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
