
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type ProductTag = Tables<'product_tags'>;
type ProductTagAssignment = Tables<'product_tag_assignments'>;

export const useProductTags = () => {
  return useQuery({
    queryKey: ['product-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_tags')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ProductTag[];
    },
  });
};

export const useProductTagAssignments = (productId?: string) => {
  return useQuery({
    queryKey: ['product-tag-assignments', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_tag_assignments')
        .select(`
          *,
          product_tags (
            id,
            name,
            color,
            text_color
          )
        `)
        .eq('product_id', productId);

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
};

export const useCreateProductTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tagData: Partial<ProductTag>) => {
      const { data, error } = await supabase
        .from('product_tags')
        .insert([tagData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
    },
  });
};

export const useUpdateProductTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<ProductTag> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
    },
  });
};

export const useDeleteProductTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_tags')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-tags'] });
    },
  });
};

export const useAssignTagToProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, tagId }: { productId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('product_tag_assignments')
        .insert([{ product_id: productId, tag_id: tagId }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-tag-assignments', variables.productId] });
    },
  });
};

export const useRemoveTagFromProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, tagId }: { productId: string; tagId: string }) => {
      const { error } = await supabase
        .from('product_tag_assignments')
        .delete()
        .eq('product_id', productId)
        .eq('tag_id', tagId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-tag-assignments', variables.productId] });
    },
  });
};
