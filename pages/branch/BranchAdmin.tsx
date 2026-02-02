import AdminLayout from '@/components/admin/AdminLayout';
import { BranchRouteGuard } from '@/components/BranchRouteGuard';

/**
 * Branch-specific admin wrapper.
 * Uses the same AdminLayout but with branch context awareness.
 */
export default function BranchAdmin() {
  return (
    <BranchRouteGuard>
      <AdminLayout />
    </BranchRouteGuard>
  );
}
