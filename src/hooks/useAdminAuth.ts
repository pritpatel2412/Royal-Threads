
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  email: string;
  is_active: boolean;
}

export const useAdminAuth = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check admin credentials in our custom admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        throw new Error('Invalid admin credentials');
      }

      setAdminUser(adminData);
      toast({
        title: "Login Successful",
        description: "Welcome to the admin panel",
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      return { success: false, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdminUser(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin panel",
    });
  };

  return {
    adminUser,
    loading,
    login,
    logout,
    isAuthenticated: !!adminUser,
  };
};
