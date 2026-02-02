import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  ShoppingCart, 
  RotateCcw, 
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface ReminderItem {
  id: string;
  type: 'order' | 'return' | 'custom_order';
  title: string;
  subtitle: string;
  createdAt: Date;
  status: string;
  amount?: number;
  path: string;
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const ONE_HOUR_MS = 1 * 60 * 60 * 1000;

function getTimeColor(createdAt: Date): 'green' | 'yellow' | 'red' {
  const elapsed = Date.now() - createdAt.getTime();
  if (elapsed >= TWO_HOURS_MS) return 'red';
  if (elapsed >= ONE_HOUR_MS) return 'yellow';
  return 'green';
}

function formatElapsedTime(createdAt: Date): string {
  const elapsed = Date.now() - createdAt.getTime();
  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function ReminderCard({ item, onClick }: { item: ReminderItem; onClick: () => void }) {
  const [, setTick] = useState(0);
  const color = getTimeColor(item.createdAt);
  
  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const colorClasses = {
    green: 'border-l-green-500 bg-green-500/5 hover:bg-green-500/10',
    yellow: 'border-l-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10',
    red: 'border-l-red-500 bg-red-500/5 hover:bg-red-500/10 animate-pulse',
  };

  const timerColorClasses = {
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  };

  const iconColorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  const Icon = item.type === 'order' 
    ? ShoppingCart 
    : item.type === 'return' 
    ? RotateCcw 
    : FileText;

  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg bg-muted/50 ${iconColorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
            {item.amount && (
              <p className="text-xs font-semibold text-primary mt-0.5">
                {formatCurrency(item.amount)}
              </p>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold ${timerColorClasses[color]}`}>
          <Clock className="h-3 w-3" />
          {formatElapsedTime(item.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default function ReminderSection() {
  const navigate = useNavigate();

  // Fetch pending orders (not delivered/cancelled)
  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['admin-reminder-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at, shipping_address')
        .not('status', 'in', '(delivered,cancelled)')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch pending returns (requested, approved, processing)
  const { data: pendingReturns = [] } = useQuery({
    queryKey: ['admin-reminder-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('id, order_id, reason, status, refund_amount, created_at')
        .in('status', ['requested', 'approved', 'processing'])
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch pending custom orders (not completed/rejected)
  const { data: pendingCustomOrders = [] } = useQuery({
    queryKey: ['admin-reminder-custom-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('id, name, product_type, status, quoted_price, created_at')
        .eq('deleted_by_admin', false)
        .not('status', 'in', '(completed,rejected)')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Transform data into reminder items
  const reminderItems: ReminderItem[] = [
    ...pendingOrders.map((order): ReminderItem => {
      const address = order.shipping_address as { full_name?: string } | null;
      return {
        id: order.id,
        type: 'order',
        title: `Order ${order.order_number}`,
        subtitle: address?.full_name || 'Customer',
        createdAt: new Date(order.created_at),
        status: order.status || 'order_placed',
        amount: order.total_amount,
        path: `/admin/orders/${order.id}`,
      };
    }),
    ...pendingReturns.map((ret): ReminderItem => ({
      id: ret.id,
      type: 'return',
      title: `Return Request`,
      subtitle: ret.reason,
      createdAt: new Date(ret.created_at),
      status: ret.status || 'requested',
      amount: ret.refund_amount || undefined,
      path: '/admin/returns',
    })),
    ...pendingCustomOrders.map((co): ReminderItem => ({
      id: co.id,
      type: 'custom_order',
      title: `Custom: ${co.product_type}`,
      subtitle: co.name,
      createdAt: new Date(co.created_at),
      status: co.status || 'pending',
      amount: co.quoted_price || undefined,
      path: '/admin/custom-orders',
    })),
  ];

  // Sort by oldest first (most urgent)
  const sortedItems = [...reminderItems].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  const delayedCount = sortedItems.filter(
    item => getTimeColor(item.createdAt) === 'red'
  ).length;

  const warningCount = sortedItems.filter(
    item => getTimeColor(item.createdAt) === 'yellow'
  ).length;

  if (sortedItems.length === 0) {
    return (
      <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-green-500" />
            Action Required
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              0
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">All caught up!</p>
              <p className="text-xs text-muted-foreground">No pending orders, returns, or custom orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Action Required
            <Badge variant="secondary" className="ml-2">
              {sortedItems.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {delayedCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {delayedCount} Delayed
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {warningCount} Warning
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          <span className="inline-flex items-center gap-1 mr-3">
            <span className="w-2 h-2 rounded-full bg-green-500" /> &lt;1 hour
          </span>
          <span className="inline-flex items-center gap-1 mr-3">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> 1-2 hours
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> &gt;2 hours (delayed)
          </span>
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {sortedItems.map((item) => (
              <ReminderCard
                key={`${item.type}-${item.id}`}
                item={item}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
