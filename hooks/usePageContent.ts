import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PageContent {
  id: string;
  page_name: string;
  section_name: string;
  content: Record<string, any>;
}

export function usePageContent(pageName: string) {
  return useQuery({
    queryKey: ['page-content', pageName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_name', pageName);
      
      if (error) throw error;
      
      // Convert to a map by section_name for easy access
      const sections: Record<string, Record<string, any>> = {};
      (data as PageContent[])?.forEach((item) => {
        sections[item.section_name] = item.content;
      });
      
      return sections;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePageSection(pageName: string, sectionName: string) {
  return useQuery({
    queryKey: ['page-content', pageName, sectionName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('content')
        .eq('page_name', pageName)
        .eq('section_name', sectionName)
        .maybeSingle();
      
      if (error) throw error;
      return data?.content as Record<string, any> | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
