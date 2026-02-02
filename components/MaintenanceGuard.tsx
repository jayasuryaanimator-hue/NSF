import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaintenancePage } from './MaintenancePage';
import { Skeleton } from '@/components/ui/skeleton';

interface MaintenanceGuardProps {
  children: ReactNode;
}

interface MaintenanceSettings {
  maintenance_mode: boolean;
  maintenance_started_at: number | null;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const location = useLocation();
  
  // Allow admin routes to bypass maintenance
  const isAdminRoute = location.pathname.startsWith('/admin');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['maintenance-settings'],
    queryFn: async (): Promise<MaintenanceSettings> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_started_at']);

      if (error) throw error;

      const result: MaintenanceSettings = {
        maintenance_mode: false,
        maintenance_started_at: null,
      };

      data?.forEach((item) => {
        const val = typeof item.value === 'object' && item.value !== null
          ? (item.value as Record<string, unknown>).value
          : item.value;

        if (item.key === 'maintenance_mode') {
          result.maintenance_mode = val === true || val === 'true';
        } else if (item.key === 'maintenance_started_at') {
          result.maintenance_started_at = typeof val === 'number' ? val : null;
        }
      });

      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Show loading skeleton only briefly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  // Check if maintenance mode is active
  const isMaintenanceActive = settings?.maintenance_mode === true;
  const startedAt = settings?.maintenance_started_at;

  // Check if 4 hours have passed (auto-disable)
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const isExpired = startedAt ? Date.now() - startedAt > FOUR_HOURS_MS : false;

  // Show maintenance page for non-admin routes when maintenance is active and not expired
  if (isMaintenanceActive && !isExpired && !isAdminRoute) {
    return <MaintenancePage startedAt={startedAt || Date.now()} />;
  }

  return <>{children}</>;
}
