import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminProductManagement from './AdminProductManagement';
import AdminOrderManagement from './AdminOrderManagement';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
import AdminContactManagement from './AdminContactManagement';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Package, ShoppingCart, TrendingUp, IndianRupee } from 'lucide-react';

const AdminPanel = () => {
  const { logout, adminUser } = useAdminAuth();
  const { summary, isLoading } = useAdminAnalytics();

  // ✅ Calculate growth rate from totalRevenue vs previousRevenue
  const calculateGrowthRate = (current: number, previous: number) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0; // Avoid divide by 0
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = calculateGrowthRate(
    summary?.totalRevenue || 0,
    summary?.previousRevenue || 0
  );

  return (
    <div className="min-h-screen bg-royal-ivory">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {adminUser?.email}</p>
          </div>
          <Button onClick={logout} variant="outline" size="lg">
            Logout
          </Button>
        </div>
      </header>

      <main className="p-6">
        {/* Quick Stats - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{summary?.totalRevenue?.toLocaleString() || 0}</div>
              <p className="text-xs opacity-80 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.totalOrders || 0}</div>
              <p className="text-xs opacity-80 mt-1">All time orders</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{summary?.averageOrderValue?.toFixed(0) || 0}</div>
              <p className="text-xs opacity-80 mt-1">Per order</p>
            </CardContent>
          </Card>

          {/* ✅ Dynamic Growth Rate */}
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <Package className="h-5 w-5 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {revenueGrowth > 0 ? `+${revenueGrowth.toFixed(1)}%` : `${revenueGrowth.toFixed(1)}%`}
              </div>
              <p className="text-xs opacity-80 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="analytics" className="text-base">Analytics Dashboard</TabsTrigger>
            <TabsTrigger value="products" className="text-base">Product Management</TabsTrigger>
            <TabsTrigger value="orders" className="text-base">Order Management</TabsTrigger>
            <TabsTrigger value="contacts" className="text-base">Contact Submissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-4">
            <AdminAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="products" className="space-y-4">
            <AdminProductManagement />
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-4">
            <AdminOrderManagement />
          </TabsContent>
          
          <TabsContent value="contacts" className="space-y-4">
            <AdminContactManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
