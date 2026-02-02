import { ReactNode } from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { Skeleton } from '@/components/ui/skeleton';

interface BranchLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for branch-specific routes.
 * Provides branch context and loading states.
 */
export function BranchLayout({ children }: BranchLayoutProps) {
  const { currentBranch, isLoading } = useBranch();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!currentBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Branch Not Found</h1>
          <p className="text-muted-foreground">The requested branch does not exist.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
