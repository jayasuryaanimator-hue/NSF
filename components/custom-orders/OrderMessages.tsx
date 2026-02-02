import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

interface OrderMessagesProps {
  orderId: string;
  senderType: 'customer' | 'admin';
  className?: string;
}

interface Message {
  id: string;
  custom_order_id: string;
  sender_type: 'customer' | 'admin';
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function OrderMessages({ orderId, senderType, className = '' }: OrderMessagesProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['order-messages', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_order_messages')
        .select('*')
        .eq('custom_order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!orderId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('custom_order_messages')
        .insert({
          custom_order_id: orderId,
          sender_type: senderType,
          sender_id: user.id,
          message: message.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['order-messages', orderId] });
      toast.success('Message sent');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    if (newMessage.length > 1000) {
      toast.error('Message too long (max 1000 characters)');
      return;
    }
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Messages List */}
      <ScrollArea className="flex-1 max-h-64 pr-4">
        {messages && messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwnMessage = msg.sender_type === senderType;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.sender_type === 'admin' ? 'Admin' : 'You'} • {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">
            No messages yet. Start the conversation!
          </p>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="mt-3 flex gap-2">
        <Textarea
          placeholder="Type your message... (Press Enter to send)"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={1000}
          className="resize-none flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sendMessageMutation.isPending}
          size="icon"
          className="h-auto"
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-right">
        {newMessage.length}/1000
      </p>
    </div>
  );
}
