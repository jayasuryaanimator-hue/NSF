import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, RefreshCw, User, Key, Copy } from 'lucide-react';

interface BranchCredentialsSectionProps {
  branchId: string;
  branchCode: string;
  branchName: string;
  credentials: {
    email: string;
    user_id: string;
  } | null;
  onCredentialsCreated: () => void;
}

export function BranchCredentialsSection({
  branchId,
  branchCode,
  branchName,
  credentials,
  onCredentialsCreated,
}: BranchCredentialsSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleShowPassword = async () => {
    if (showPassword) {
      setShowPassword(false);
      setPassword(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-branch-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'get-password',
            branchId,
            branchCode,
            branchName,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setPassword(result.password);
      setShowPassword(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!credentials) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-branch-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'reset-password',
            branchId,
            branchCode,
            branchName,
            userId: credentials.user_id,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setPassword(result.password);
      setShowPassword(true);
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-branch-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: 'create',
            branchId,
            branchCode,
            branchName,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setPassword(result.password);
      setShowPassword(true);
      toast.success('Branch manager account created');
      onCredentialsCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (!credentials) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-sm">No manager account</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateUser}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        <User className="h-4 w-4 text-primary" />
        Manager Account
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs">
          {credentials.email}
        </Badge>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => copyToClipboard(credentials.email, 'Email')}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Key className="h-3 w-3 text-muted-foreground" />
        <div className="flex-1">
          {showPassword && password ? (
            <div className="flex items-center gap-2">
              <Input
                value={password}
                readOnly
                className="h-7 text-xs font-mono"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => copyToClipboard(password, 'Password')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">••••••••••••</span>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleShowPassword}
          disabled={isLoading}
          className="text-xs h-7"
        >
          {showPassword ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Show
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetPassword}
          disabled={isLoading}
          className="text-xs h-7"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
