
import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

const Admin = () => {
  const { isAuthenticated } = useAdminAuth();

  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />;
};

export default Admin;
