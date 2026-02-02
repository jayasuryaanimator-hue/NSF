import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Branch {
  id: string;
  name: string;
  slug: string;
  code: string;
  phone: string;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  is_active: boolean;
}

interface BranchContextType {
  currentBranch: Branch | null;
  branchSlug: string | null;
  isLoading: boolean;
  isBranchRoute: boolean;
  allBranches: Branch[];
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Extract branch slug from URL path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const potentialSlug = pathSegments[0];

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (allBranches.length > 0 && potentialSlug) {
      const branch = allBranches.find(b => b.slug === potentialSlug);
      setCurrentBranch(branch || null);
    } else {
      setCurrentBranch(null);
    }
  }, [potentialSlug, allBranches]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // Map branches with slug - use existing slug or fallback to code lowercase
      const branchesWithSlug = (data || []).map(branch => ({
        ...branch,
        slug: branch.slug || branch.code.toLowerCase(),
      }));

      setAllBranches(branchesWithSlug);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isBranchRoute = allBranches.some(b => b.slug === potentialSlug);

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        branchSlug: isBranchRoute ? potentialSlug : null,
        isLoading,
        isBranchRoute,
        allBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
