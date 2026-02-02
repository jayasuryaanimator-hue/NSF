import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';

interface BranchRouteGuardProps {
  children: ReactNode;
}

/**
 * Route guard that validates branch manager access to branch-specific admin routes.
 * Branch managers can only access their assigned branch's admin panel.
 */
export function BranchRouteGuard({ children }: BranchRouteGuardProps) {
  const { user, isAdmin, isBranchManager, userBranchId, loading: authLoading } = useAuth();
  const { currentBranch, isLoading: branchLoading } = useBranch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || branchLoading) return;

    // Check if this is a branch admin route (e.g., /edappadi/admin/...)
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const isBranchAdminRoute = pathSegments.length >= 2 && pathSegments[1] === 'admin';

    if (isBranchAdminRoute && currentBranch) {
      // Global admins can access any branch admin
      if (isAdmin) return;

      // Branch managers can only access their assigned branch
      if (isBranchManager && userBranchId) {
        if (currentBranch.id !== userBranchId) {
          navigate('/', { replace: true });
        }
      } else if (!isBranchManager) {
        // Non-managers cannot access branch admin
        navigate('/', { replace: true });
      }
    }
  }, [user, isAdmin, isBranchManager, userBranchId, currentBranch, authLoading, branchLoading, location.pathname, navigate]);

  if (authLoading || branchLoading) {
    return null;
  }

  return <>{children}</>;
}
