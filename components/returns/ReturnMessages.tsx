import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

interface ReturnMessagesProps {
  returnId: string;
  senderType: 'customer' | 'admin';
  className?: string;
  onUnreadCountChange?: (count: number) => void;
}

interface Message {
  id: string;
  return_id: string;
  sender_type: 'customer' | 'admin';
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function ReturnMessages({ returnId, senderType, className = '', onUnreadCountChange }: ReturnMessagesProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());

  const { data: messages, isLoading } = useQuery({
    queryKey: ['return-messages', returnId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_messages')
        .select('*')
        .eq('return_id', returnId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!returnId,
  });

  // Calculate unread count (messages from the other party that haven't been read)
  const unreadCount = messages?.filter(
    (msg) => msg.sender_type !== senderType && !msg.is_read
  ).length || 0;

  // Track known message IDs on initial load to avoid showing notifications for existing messages
  useEffect(() => {
    if (messages && initialLoadRef.current) {
      messages.forEach((msg) => knownMessageIdsRef.current.add(msg.id));
      initialLoadRef.current = false;
    }
  }, [messages]);

  // Notify parent of unread count changes
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (!messages || !user) return;
    
    const unreadMessages = messages.filter(
      (msg) => msg.sender_type !== senderType && !msg.is_read
    );

    if (unreadMessages.length > 0) {
      // Mark messages as read
      const markAsRead = async () => {
        const { error } = await supabase
          .from('return_messages')
          .update({ is_read: true })
          .eq('return_id', returnId)
          .neq('sender_type', senderType)
          .eq('is_read', false);

        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['return-messages', returnId] });
        }
      };

      markAsRead();
    }
  }, [messages, returnId, senderType, user, queryClient]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!returnId) return;

    const channel = supabase
      .channel(`return-messages-${returnId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'return_messages',
          filter: `return_id=eq.${returnId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          // Only show notification for truly new messages (not ones we already know about)
          const isNewMessage = !knownMessageIdsRef.current.has(newMsg.id);
          
          if (isNewMessage) {
            knownMessageIdsRef.current.add(newMsg.id);
            
            // Show toast notification if message is from the other party
            if (newMsg.sender_type !== senderType) {
              toast.info('New message received', {
                description: newMsg.message.substring(0, 50) + (newMsg.message.length > 50 ? '...' : ''),
                icon: <MessageCircle className="h-4 w-4" />,
              });
              
              // Play notification sound
              try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {
                  // Ignore audio play errors (autoplay restrictions)
                });
              } catch {
                // Ignore audio errors
              }
            }
          }
          
          // Refresh messages
          queryClient.invalidateQueries({ queryKey: ['return-messages', returnId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [returnId, senderType, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('return_messages')
        .insert({
          return_id: returnId,
          sender_type: senderType,
          sender_id: user.id,
          message: message.trim(),
        } as any);

      if (error) throw error;

      // Send email notification (fire and forget)
      try {
        await supabase.functions.invoke('send-return-message-email', {
          body: {
            returnId,
            message: message.trim(),
            senderType,
          },
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the message send if email fails
      }
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['return-messages', returnId] });
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
      <ScrollArea className="flex-1 max-h-64 pr-4" ref={scrollRef}>
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
                      {msg.sender_type === 'admin' ? 'Admin' : 'Customer'} • {formatDateTime(msg.created_at)}
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

// Hook to get unread message count for a return
export function useReturnUnreadCount(returnId: string | undefined, senderType: 'customer' | 'admin') {
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!returnId) return;

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from('return_messages')
        .select('id')
        .eq('return_id', returnId)
        .neq('sender_type', senderType)
        .eq('is_read', false);

      if (!error && data) {
        setUnreadCount(data.length);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`return-unread-${returnId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_messages',
          filter: `return_id=eq.${returnId}`,
        },
        () => {
          fetchUnreadCount();
          queryClient.invalidateQueries({ queryKey: ['return-messages', returnId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [returnId, senderType, queryClient]);

  return unreadCount;
}
