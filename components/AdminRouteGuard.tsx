import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteGuardProps {
  children: ReactNode;
}

/**
 * Route guard that redirects pure admins (not branch managers) away from customer-facing pages.
 * Pure admins should only access /admin routes.
 */
export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isAdmin, isBranchManager, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (loading) return;

    // If user is admin but NOT a branch manager, redirect to admin panel
    if (user && isAdmin && !isBranchManager) {
      // Check if already on admin route
      const isAdminRoute = location.pathname.startsWith('/admin');
      const isAuthRoute = location.pathname === '/auth';
      
      if (!isAdminRoute && !isAuthRoute) {
        navigate('/admin', { replace: true });
        return;
      }
    }
    
    // Only render after we've checked and determined user should stay
    setShouldRender(true);
  }, [user, isAdmin, isBranchManager, loading, location.pathname, navigate]);

  // Show nothing while loading or checking redirect
  if (loading || !shouldRender) {
    return null;
  }

  // Don't render customer content for pure admins
  if (user && isAdmin && !isBranchManager) {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isAuthRoute = location.pathname === '/auth';
    if (!isAdminRoute && !isAuthRoute) {
      return null;
    }
  }

  return <>{children}</>;
}
