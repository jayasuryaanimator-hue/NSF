import { useMemo, useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatOrderStatus, formatDateTime } from '@/lib/format';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  order_id: string;
  order_number: string;
  old_status: string;
  new_status: string;
  created_at: string;
  is_read: boolean;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const storageKey = useMemo(() => {
    if (!user) return null;
    return `gc:lastSeenOrderNotifAt:${user.id}`;
  }, [user]);

  const getLastSeen = () => {
    if (!storageKey) return 0;
    const raw = localStorage.getItem(storageKey);
    const ts = raw ? Number(raw) : 0;
    return Number.isFinite(ts) ? ts : 0;
  };

  const setLastSeen = (value: number) => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, String(value));
  };

  // Fetch recent order status changes
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      // Get recent orders with status updates (orders updated in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, status, updated_at, created_at')
        .eq('user_id', user.id)
        .gte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(10);

      if (orders) {
        const lastSeen = getLastSeen();

        // Create notification-like entries from recent orders
        const notifs: Notification[] = orders
          .filter(order => order.status !== 'order_placed') // Exclude initial status
          .map(order => ({
            id: order.id,
            order_id: order.id,
            order_number: order.order_number,
            old_status: '', // We don't track old status
            new_status: order.status || 'order_placed',
            created_at: order.updated_at,
            // Persist read state locally per user
            is_read: new Date(order.updated_at).getTime() <= lastSeen,
          }));
        setNotifications(notifs);
      }
    };

    fetchNotifications();

    // Subscribe to real-time order status changes
    const channel = supabase
      .channel('order-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;
          
          if (newOrder.status !== oldOrder.status) {
            const lastSeen = getLastSeen();
            const newNotification: Notification = {
              id: `${newOrder.id}-${Date.now()}`,
              order_id: newOrder.id,
              order_number: newOrder.order_number,
              old_status: oldOrder.status || '',
              new_status: newOrder.status || '',
              created_at: new Date().toISOString(),
              is_read: Date.now() <= lastSeen,
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, storageKey]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = () => {
    setLastSeen(Date.now());
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'payment_confirmed':
        return '✅';
      case 'product_packed':
        return '📦';
      case 'shipped':
        return '🚚';
      case 'out_for_delivery':
        return '🏃';
      case 'delivered':
        return '🎉';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  to={`/orders/${notif.order_id}`}
                  className={`block p-4 hover:bg-secondary/50 transition-colors ${
                    !notif.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setLastSeen(Date.now());
                    setNotifications(prev =>
                      prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
                    );
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getStatusIcon(notif.new_status)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Order {notif.order_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {formatOrderStatus(notif.new_status)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Link
              to="/orders"
              className="text-sm text-primary hover:underline block text-center"
              onClick={() => setIsOpen(false)}
            >
              View all orders →
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
