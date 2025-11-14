import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const AdminAnalyticsDashboard = () => {
  const { 
    orderAnalytics, 
    productAnalytics, 
    recentOrders, 
    isLoading, 
    summary,
    orderStats,
    dailyOrderAnalytics 
  } = useAdminAnalytics();

  console.log('Analytics Data:', {
    orderAnalytics,
    productAnalytics,
    summary,
    orderStats,
    dailyOrderAnalytics
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = orderAnalytics?.map(item => ({
    date: format(new Date(item.order_date), 'MMM dd'),
    revenue: item.total_revenue || 0,
    orders: item.total_orders || 0,
    delivered: item.completed_orders || 0,
    pending: item.pending_orders || 0
  })) || [];

  // Use daily analytics data for the daily orders chart (includes cancelled and shipped orders)
  const dailyOrdersChartData = dailyOrderAnalytics?.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    orders: item.total_orders || 0,
    delivered: item.delivered || 0,
    pending: item.pending || 0,
    cancelled: item.cancelled || 0,
    shipped: item.shipped || 0
  })) || [];

  // Enhanced top products data - Top 5 products with analytical insights
  // Handle both database format (product_name) and fallback format
  // IMPORTANT: Only counts revenue from delivered orders
  const allProductsData = (productAnalytics || [])
    .filter((product: any) => {
      const revenue = parseFloat((product.total_revenue || 0).toString());
      return revenue > 0;
    })
    .map((product: any) => {
      const productName = product.product_name || product.name || 'Unknown Product';
      const revenue = parseFloat((product.total_revenue || 0).toString());
      const quantity = parseInt((product.total_quantity_sold || 0).toString());
      const timesOrdered = parseInt((product.times_ordered || 0).toString());
      
      return {
        name: productName.length > 30 ? productName.substring(0, 30) + '...' : productName,
        fullName: productName,
        revenue: revenue,
        quantity: quantity,
        timesOrdered: timesOrdered,
        revenueFormatted: `₹${revenue.toLocaleString('en-IN')}`,
        avgOrderValue: timesOrdered > 0 ? revenue / timesOrdered : 0
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // Get top 5 products
  const topProductsData = allProductsData.slice(0, 5);
  
  // Calculate total revenue for percentage calculations
  const totalRevenue = allProductsData.reduce((sum, p) => sum + p.revenue, 0);
  
  // Add percentage and rank to top 5
  const topProductsWithInsights = topProductsData.map((product, index) => ({
    ...product,
    rank: index + 1,
    percentage: totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0,
    percentageFormatted: totalRevenue > 0 ? `${((product.revenue / totalRevenue) * 100).toFixed(1)}%` : '0%'
  }));

  console.log('Top Products Data:', topProductsWithInsights);

  // Real order status data from actual database
  const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const orderStatusData = allStatuses.map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: summary.statusCounts?.[status] || 0,
    color: getStatusColor(status)
  })).filter(item => item.value > 0); // Only show statuses with actual orders

  console.log('Order Status Data:', orderStatusData);

  function getStatusColor(status: string) {
    const colors = {
      delivered: '#10b981',    // Green
      processing: '#f59e0b',   // Orange
      pending: '#ef4444',      // Red
      shipped: '#3b82f6',      // Blue  
      confirmed: '#8b5cf6',    // Purple
      cancelled: '#6b7280'     // Gray
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  const calculateGrowth = (data: any[]) => {
    if (!data || data.length < 2) return 0;
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const growth = ((latest.revenue - previous.revenue) / previous.revenue) * 100;
    return growth || 0;
  };

  const revenueGrowth = calculateGrowth(revenueChartData);

  return (
    <div className="space-y-6">
      {/* Real-time Data Status Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live data - Updates every 30 seconds</span>
        </div>
        <div className="text-sm text-gray-500">
          Total Orders: {summary?.totalOrders || 0} | Revenue: ₹{summary?.totalRevenue?.toLocaleString() || 0}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#374151' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Status Distribution
              <span className="text-sm font-normal text-gray-500">
                ({orderStatusData.reduce((sum, item) => sum + item.value, 0)} total orders)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: string) => [value, `${name} Orders`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders found in the system</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Top 5 Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <div>
                  <div>Top 5 Performing Products (By Revenue)</div>
                  <p className="text-xs font-normal text-gray-500 mt-0.5">
                    Only delivered orders are counted
                  </p>
                </div>
              </div>
              <span className="text-sm font-normal text-gray-500">
                {topProductsWithInsights.length} of {allProductsData.length} products
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsWithInsights.length > 0 ? (
              <div className="space-y-6">
                {/* Enhanced Bar Chart */}
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart 
                    data={topProductsWithInsights} 
                    layout="horizontal"
                    margin={{ top: 10, right: 40, left: 150, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis 
                      type="number" 
                      fontSize={11}
                      tick={{ fill: '#6b7280' }}
                      tickFormatter={(value) => {
                        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
                        return `₹${value}`;
                      }}
                      label={{ 
                        value: 'Revenue (₹)', 
                        position: 'insideBottom', 
                        offset: -5, 
                        style: { textAnchor: 'middle', fontSize: 12, fill: '#374151', fontWeight: 500 } 
                      }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={145} 
                      fontSize={11}
                      tick={{ fill: '#374151', fontWeight: 500 }}
                      interval={0}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                <div className={`w-3 h-3 rounded-full ${
                                  data.rank === 1 ? 'bg-yellow-400' :
                                  data.rank === 2 ? 'bg-gray-300' :
                                  data.rank === 3 ? 'bg-amber-600' : 'bg-gray-400'
                                }`} />
                                <p className="font-bold text-sm text-gray-900">#{data.rank} - {data.fullName}</p>
                              </div>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600 font-medium">Revenue:</span>
                                  <span className="text-green-600 font-bold text-sm">₹{data.revenue.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600 font-medium">% of Total:</span>
                                  <span className="text-blue-600 font-semibold">{data.percentageFormatted}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600 font-medium">Units Sold:</span>
                                  <span className="text-gray-800 font-semibold">{data.quantity}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600 font-medium">Orders:</span>
                                  <span className="text-gray-800 font-semibold">{data.timesOrdered}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <span className="text-gray-600 font-medium">Avg Order Value:</span>
                                  <span className="text-purple-600 font-semibold">₹{data.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      radius={[0, 8, 8, 0]}
                      name="Revenue"
                    >
                      {topProductsWithInsights.map((entry, index) => {
                        // Gradient colors for top 5
                        const colors = [
                          '#059669', // Dark green for #1
                          '#10b981', // Green for #2
                          '#34d399', // Light green for #3
                          '#6ee7b7', // Lighter green for #4
                          '#a7f3d0'  // Lightest green for #5
                        ];
                        return (
                          <Cell key={`cell-${index}`} fill={colors[index] || '#6ee7b7'} />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Enhanced Summary Stats with Insights */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">Total Revenue (Top 5)</p>
                    <p className="text-xl font-bold text-green-700">
                      ₹{topProductsWithInsights.reduce((sum, p) => sum + p.revenue, 0).toLocaleString('en-IN')}
                    </p>
                    {totalRevenue > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        {((topProductsWithInsights.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100).toFixed(1)}% of all products
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium mb-1">Total Units Sold</p>
                    <p className="text-xl font-bold text-blue-700">
                      {topProductsWithInsights.reduce((sum, p) => sum + p.quantity, 0)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Avg: {Math.round(topProductsWithInsights.reduce((sum, p) => sum + p.quantity, 0) / topProductsWithInsights.length)} per product
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium mb-1">Total Orders</p>
                    <p className="text-xl font-bold text-purple-700">
                      {topProductsWithInsights.reduce((sum, p) => sum + p.timesOrdered, 0)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Avg: {Math.round(topProductsWithInsights.reduce((sum, p) => sum + p.timesOrdered, 0) / topProductsWithInsights.length)} per product
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium mb-1">Top Product</p>
                    <p className="text-sm font-bold text-amber-800 line-clamp-2">
                      {topProductsWithInsights[0]?.fullName || 'N/A'}
                    </p>
                    {topProductsWithInsights[0] && (
                      <p className="text-xs text-amber-600 mt-1">
                        {topProductsWithInsights[0].percentageFormatted} of total revenue
                      </p>
                    )}
                  </div>
                </div>

                {/* Product Ranking List */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Product Rankings</p>
                  <div className="space-y-2">
                    {topProductsWithInsights.map((product, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-gray-400 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{product.fullName}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">{product.quantity} units</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{product.timesOrdered} orders</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{product.revenue.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-gray-500">{product.percentageFormatted}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No product sales data available</p>
                  <p className="text-sm mt-2 text-gray-400">
                    Products will appear here after orders are placed and delivered
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Orders
              <span className="text-sm font-normal text-gray-500">
                ({recentOrders?.length || 0} recent)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-300 overflow-y-auto">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.slice(0, 6).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{order.order_number}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-sm">₹{order.total_amount.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent orders found</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Orders Overview with Cancelled and Shipped Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Daily Orders Overview (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyOrdersChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#f59e0b" 
                strokeWidth={3}
                name="Total Orders"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="delivered" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Delivered"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="shipped" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Shipped"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="pending" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Pending"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="cancelled" 
                stroke="#6b7280" 
                strokeWidth={2}
                name="Cancelled"
                dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsDashboard;
