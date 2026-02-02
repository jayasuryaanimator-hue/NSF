import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, Shield, UserCheck, Clock, AlertCircle, Store, X } from 'lucide-react';
import { format } from 'date-fns';

// Define app_role type locally to include branch_manager
type AppRole = 'admin' | 'moderator' | 'customer' | 'branch_manager';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface BranchAssignment {
  branch_id: string;
  branch?: Branch;
  is_primary: boolean;
}

interface UserWithRole {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole | null;
  branch_assignment?: BranchAssignment | null;
}

interface AuditLog {
  id: string;
  target_user_id: string;
  changed_by_user_id: string;
  old_role: AppRole | null;
  new_role: AppRole;
  action: string;
  notes: string | null;
  created_at: string;
  target_user?: { email: string | null; full_name: string | null };
  changed_by?: { email: string | null; full_name: string | null };
}

const roleColors: Record<AppRole, string> = {
  admin: 'bg-destructive text-destructive-foreground',
  moderator: 'bg-primary text-primary-foreground',
  customer: 'bg-secondary text-secondary-foreground',
  branch_manager: 'bg-amber-500 text-white',
};

export default function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('customer');
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Fetch all users with their roles and branch assignments
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get branch assignments
      const { data: branchUsers, error: branchError } = await supabase
        .from('branch_users')
        .select('user_id, branch_id, is_primary, branches:branch_id(id, name, code)');

      if (branchError) throw branchError;

      // Merge profiles with roles and branch assignments
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]));
      const branchMap = new Map(branchUsers?.map(bu => [bu.user_id, {
        branch_id: bu.branch_id,
        branch: bu.branches as unknown as Branch,
        is_primary: bu.is_primary ?? true
      }]));
      
      return (profiles || []).map(profile => ({
        ...profile,
        role: roleMap.get(profile.user_id) || null,
        branch_assignment: branchMap.get(profile.user_id) || null,
      })) as UserWithRole[];
    },
  });

  // Fetch branches
  const { data: branches } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as Branch[];
    },
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['role-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user info for each log entry
      const userIds = new Set<string>();
      data?.forEach(log => {
        userIds.add(log.target_user_id);
        userIds.add(log.changed_by_user_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return (data || []).map(log => ({
        ...log,
        target_user: profileMap.get(log.target_user_id),
        changed_by: profileMap.get(log.changed_by_user_id),
      })) as AuditLog[];
    },
  });

  // Mutation to change user role and branch assignment
  const changeRoleMutation = useMutation({
    mutationFn: async ({ 
      targetUserId, 
      oldRole, 
      newRole, 
      notes,
      branchId
    }: { 
      targetUserId: string; 
      oldRole: AppRole | null; 
      newRole: AppRole; 
      notes: string;
      branchId: string | null;
    }) => {
      // Update or insert the role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: targetUserId, 
          role: newRole 
        }, { 
          onConflict: 'user_id' 
        });

      if (roleError) throw roleError;

      // Handle branch assignment for branch_manager role
      if (newRole === 'branch_manager' && branchId) {
        // First remove any existing branch assignments
        await supabase
          .from('branch_users')
          .delete()
          .eq('user_id', targetUserId);

        // Then add the new assignment
        const { error: branchError } = await supabase
          .from('branch_users')
          .insert({
            user_id: targetUserId,
            branch_id: branchId,
            is_primary: true
          });

        if (branchError) throw branchError;
      } else if (newRole !== 'branch_manager') {
        // Remove branch assignment if role is changed away from branch_manager
        await supabase
          .from('branch_users')
          .delete()
          .eq('user_id', targetUserId);
      }

      // Create audit log entry
      const { error: auditError } = await supabase
        .from('role_audit_log')
        .insert({
          target_user_id: targetUserId,
          changed_by_user_id: user?.id!,
          old_role: oldRole,
          new_role: newRole,
          action: oldRole ? 'changed' : 'assigned',
          notes: branchId ? `${notes} (Branch: ${branches?.find(b => b.id === branchId)?.name || branchId})` : notes || null,
        });

      if (auditError) throw auditError;
    },
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['role-audit-logs'] });
      setDialogOpen(false);
      setSelectedUser(null);
      setNotes('');
      setSelectedBranchId('');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });

  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = (userItem: UserWithRole) => {
    setSelectedUser(userItem);
    setNewRole(userItem.role || 'customer');
    setSelectedBranchId(userItem.branch_assignment?.branch_id || '');
    setNotes('');
    setDialogOpen(true);
  };

  const confirmRoleChange = () => {
    if (!selectedUser) return;
    
    // Validate branch selection for branch_manager role
    if (newRole === 'branch_manager' && !selectedBranchId) {
      toast.error('Please select a branch for the branch manager');
      return;
    }
    
    changeRoleMutation.mutate({
      targetUserId: selectedUser.user_id,
      oldRole: selectedUser.role,
      newRole,
      notes,
      branchId: newRole === 'branch_manager' ? selectedBranchId : null,
    });
  };

  // Filter admins and branch managers for quick access view
  const admins = users?.filter(u => u.role === 'admin') || [];
  const branchManagers = users?.filter(u => u.role === 'branch_manager') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <Tabs defaultValue="access" className="space-y-4">
        <TabsList>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Access
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Role Access Summary Tab */}
        <TabsContent value="access" className="space-y-6">
          {/* Security Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Security Notice</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Passwords are securely encrypted and cannot be displayed. Users can reset their password via the login page using "Forgot Password".
              </p>
            </div>
          </div>

          {/* Admins Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Administrators ({admins.length})
              </h2>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email (Username)</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="spinner w-6 h-6 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : admins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No administrators found
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow key={admin.user_id}>
                        <TableCell className="font-medium">
                          {admin.full_name || 'No name set'}
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {admin.email || 'No email'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground italic text-sm">••••••••</span>
                          <span className="text-xs text-muted-foreground ml-2">(encrypted)</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(admin.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(admin)}
                            disabled={admin.user_id === user?.id}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Branch Managers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Store className="h-5 w-5 text-amber-500" />
                Branch Managers ({branchManagers.length})
              </h2>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email (Username)</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Assigned Branch</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="spinner w-6 h-6 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : branchManagers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No branch managers found. Assign the "Branch Manager" role to users and select their branch.
                      </TableCell>
                    </TableRow>
                  ) : (
                    branchManagers.map((manager) => (
                      <TableRow key={manager.user_id}>
                        <TableCell className="font-medium">
                          {manager.full_name || 'No name set'}
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {manager.email || 'No email'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground italic text-sm">••••••••</span>
                          <span className="text-xs text-muted-foreground ml-2">(encrypted)</span>
                        </TableCell>
                        <TableCell>
                          {manager.branch_assignment?.branch ? (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Store className="h-3 w-3" />
                              {manager.branch_assignment.branch.name}
                            </Badge>
                          ) : (
                            <span className="text-destructive text-sm">No branch assigned!</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(manager.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(manager)}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Quick Help */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium">How to add new admin or branch manager:</h3>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Have the user sign up at <code className="bg-muted px-1 rounded">/auth</code> with their email and password</li>
              <li>Go to the "All Users" tab and find their account</li>
              <li>Click "Manage Role" and select "Admin" or "Branch Manager"</li>
              <li>For branch managers, also select which branch they will manage</li>
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="spinner w-6 h-6 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((userItem) => (
                    <TableRow key={userItem.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            {userItem.avatar_url ? (
                              <img 
                                src={userItem.avatar_url} 
                                alt="" 
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {userItem.full_name?.[0] || userItem.email?.[0] || '?'}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">
                            {userItem.full_name || 'No name'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {userItem.email}
                      </TableCell>
                      <TableCell>
                        <Badge className={userItem.role ? roleColors[userItem.role] : 'bg-muted'}>
                          <Shield className="h-3 w-3 mr-1" />
                          {userItem.role === 'branch_manager' ? 'Branch Manager' : userItem.role || 'No role'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userItem.branch_assignment?.branch ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Store className="h-3 w-3" />
                            {userItem.branch_assignment.branch.name} ({userItem.branch_assignment.branch.code})
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(userItem.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleChange(userItem)}
                          disabled={userItem.user_id === user?.id}
                        >
                          Manage Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {/* Audit Log Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="spinner w-6 h-6 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : auditLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No audit logs yet
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{log.target_user?.full_name || 'Unknown'}</span>
                          <span className="block text-xs text-muted-foreground">{log.target_user?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{log.changed_by?.full_name || 'Unknown'}</span>
                          <span className="block text-xs text-muted-foreground">{log.changed_by?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.old_role && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {log.old_role}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                            </>
                          )}
                          <Badge className={roleColors[log.new_role]}>
                            {log.new_role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {log.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Role Change Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage User Role & Branch
            </DialogTitle>
            <DialogDescription>
              Update the role and branch assignment for {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm">
                Admins have full access. Branch Managers can manage their assigned branch's products, bills, and quotations.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="flex items-center gap-2">
                <Badge className={selectedUser?.role ? roleColors[selectedUser.role] : 'bg-muted'}>
                  {selectedUser?.role === 'branch_manager' ? 'Branch Manager' : selectedUser?.role || 'No role'}
                </Badge>
                {selectedUser?.branch_assignment?.branch && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {selectedUser.branch_assignment.branch.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="branch_manager">Branch Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Selection - Only show when branch_manager is selected */}
            {newRole === 'branch_manager' && (
              <div className="space-y-2">
                <Label>Assign to Branch *</Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          {branch.name} ({branch.code})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Branch managers can only manage products, bills, and quotations for their assigned branch
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add a reason for this change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRoleChange}
              disabled={
                changeRoleMutation.isPending || 
                (newRole === selectedUser?.role && selectedBranchId === (selectedUser?.branch_assignment?.branch_id || ''))
              }
            >
              {changeRoleMutation.isPending ? 'Updating...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
