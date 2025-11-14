import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DailyOrderAnalytics {
  date: string;
  total_orders: number;
  delivered: number;
  pending: number;
  cancelled: number;
  shipped: number;
  revenue: number;
}

export const useAdminAnalytics = () => {
  const { data: orderAnalytics, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-order-analytics'],
    queryFn: async () => {
      console.log('Fetching order analytics...');
      try {
        const { data, error } = await supabase
          .from('order_analytics')
          .select('*')
          .order('order_date', { ascending: false })
          .limit(30);
        
        if (error) {
          console.error('Order analytics error:', error);
          throw error;
        }
        console.log('Order analytics data:', data);
        return data;
      } catch (error) {
        // Fallback to manual calculation if analytics table doesn't exist
        console.log('Analytics table not found, calculating manually...');
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('status, total_amount, created_at, cancellation_fee')
          .order('created_at', { ascending: false });
        
        if (ordersError) throw ordersError;
        
        // Group by date and calculate analytics manually
        const dailyStats = orders.reduce((acc: any, order) => {
          const date = new Date(order.created_at).toDateString();
          
          if (!acc[date]) {
            acc[date] = {
              order_date: date,
              total_orders: 0,
              completed_orders: 0,
              pending_orders: 0,
              cancelled_orders: 0,
              shipped_orders: 0,
              total_revenue: 0,
              cancellation_fees: 0
            };
          }
          
          acc[date].total_orders += 1;
          
          if (order.status === 'delivered') {
            acc[date].completed_orders += 1;
            acc[date].total_revenue += parseFloat(order.total_amount.toString());
          } else if (order.status === 'pending') {
            acc[date].pending_orders += 1;
          } else if (order.status === 'cancelled') {
            acc[date].cancelled_orders += 1;
            acc[date].cancellation_fees += parseFloat((order as any).cancellation_fee?.toString() || '0');
          } else if (order.status === 'shipped') {
            acc[date].shipped_orders += 1;
          }
          
          return acc;
        }, {});
        
        return Object.values(dailyStats).slice(0, 30);
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const { data: productAnalytics, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-product-analytics'],
    queryFn: async () => {
      console.log('Fetching product analytics (delivered orders only)...');
      try {
        // Always calculate from delivered orders to ensure accuracy
        // This ensures we only count delivered orders even if the trigger hasn't updated correctly
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select(`
            product_id,
            product_name,
            quantity,
            total_price,
            orders!inner(status, id)
          `)
          .eq('orders.status', 'delivered'); // CRITICAL: Only count delivered orders
        
        if (orderItemsError) {
          console.error('Order items error:', orderItemsError);
          throw orderItemsError;
        }
        
        console.log(`Found ${orderItems?.length || 0} order items from delivered orders`);
        
        // Group by product and calculate analytics
        const productStats = (orderItems || []).reduce((acc: any, item) => {
          const productId = item.product_id;
          
          if (!acc[productId]) {
            acc[productId] = {
              product_id: productId,
              product_name: item.product_name,
              total_quantity_sold: 0,
              total_revenue: 0,
              times_ordered: 0
            };
          }
          
          acc[productId].total_quantity_sold += item.quantity;
          acc[productId].total_revenue += parseFloat(item.total_price.toString());
          acc[productId].times_ordered += 1;
          
          return acc;
        }, {});
        
        const result = Object.values(productStats)
          .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
          .slice(0, 10);
        
        console.log('Calculated product analytics from delivered orders:', result);
        return result;
      } catch (error) {
        console.error('Error calculating product analytics:', error);
        // Return empty array on error
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const { data: recentOrders, isLoading: recentOrdersLoading } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      console.log('Fetching recent orders...');
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Recent orders error:', error);
        throw error;
      }
      console.log('Recent orders data:', data);
      return data;
    },
    refetchInterval: 15000, // More frequent updates for recent orders
  });

  // Enhanced daily analytics with cancelled and shipped orders
  const { data: dailyOrderAnalytics, isLoading: dailyAnalyticsLoading } = useQuery<DailyOrderAnalytics[]>({
    queryKey: ['admin-daily-order-analytics'],
    queryFn: async (): Promise<DailyOrderAnalytics[]> => {
      console.log('Fetching daily order analytics with cancelled and shipped orders...');
      const { data, error } = await supabase
        .from('orders')
        .select('status, created_at, total_amount')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Daily order analytics error:', error);
        throw error;
      }
      
      // Group by date and calculate daily stats including cancelled and shipped orders
      const dailyStats = data.reduce((acc: Record<string, DailyOrderAnalytics>, order) => {
        const date = new Date(order.created_at).toDateString();
        
        if (!acc[date]) {
          acc[date] = {
            date,
            total_orders: 0,
            delivered: 0,
            pending: 0,
            cancelled: 0,
            shipped: 0,
            revenue: 0
          };
        }
        
        acc[date].total_orders += 1;
        
        // Only add to revenue if order is delivered
        if (order.status === 'delivered') {
          acc[date].delivered += 1;
          acc[date].revenue += parseFloat(order.total_amount.toString());
        } else if (order.status === 'pending') {
          acc[date].pending += 1;
        } else if (order.status === 'cancelled') {
          acc[date].cancelled += 1;
          // Add cancellation fee to revenue for cancelled orders
          const cancellationFee = parseFloat((order as any).cancellation_fee?.toString() || '0');
          acc[date].revenue += cancellationFee;
        } else if (order.status === 'shipped') {
          acc[date].shipped += 1;
        }
        
        return acc;
      }, {});
      
      // Convert to array and sort by date (last 30 days)
      const result: DailyOrderAnalytics[] = Object.values(dailyStats)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30);
      
      console.log('Daily analytics with cancelled and shipped orders:', result);
      return result;
    },
    refetchInterval: 30000,
  });

  // Get comprehensive real-time order stats
  const { data: orderStats, isLoading: orderStatsLoading } = useQuery({
    queryKey: ['admin-order-stats'],
    queryFn: async () => {
      console.log('Fetching comprehensive order stats...');
      const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Order stats error:', error);
        throw error;
      }
      
      console.log('Raw order stats data:', data?.length, 'orders');
      
      // Calculate comprehensive stats - only include delivered orders in revenue
      const totalRevenue = data
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);
      
      // Add cancellation fees from cancelled orders to revenue
      const cancellationFees = data
        .filter(order => order.status === 'cancelled')
        .reduce((sum, order) => sum + (parseFloat(order.cancellation_fee?.toString() || '0')), 0);
      
      const finalRevenue = totalRevenue + cancellationFees;
      const totalOrders = data.length;
      const averageOrderValue = totalOrders > 0 ? finalRevenue / totalOrders : 0;
      
      // Detailed status breakdown - count all possible statuses including cancelled
      const statusCounts = data.reduce((acc: any, order) => {
        const status = order.status.toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      console.log('Status counts breakdown:', statusCounts);

      // Recent growth (last 7 days vs previous 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const recentOrders = data.filter(order => new Date(order.created_at) >= sevenDaysAgo);
      const previousOrders = data.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= fourteenDaysAgo && orderDate < sevenDaysAgo;
      });
      
      const recentRevenue = recentOrders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) +
        recentOrders
          .filter(order => order.status === 'cancelled')
          .reduce((sum, order) => sum + (parseFloat(order.cancellation_fee?.toString() || '0')), 0);
      
      const previousRevenue = previousOrders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) +
        previousOrders
          .filter(order => order.status === 'cancelled')
          .reduce((sum, order) => sum + (parseFloat(order.cancellation_fee?.toString() || '0')), 0);
      
      const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const stats = {
        totalRevenue: finalRevenue,
        totalOrders,
        averageOrderValue,
        statusCounts,
        growthRate,
        recentOrdersCount: recentOrders.length,
        previousOrdersCount: previousOrders.length
      };

      console.log('Computed order stats:', stats);
      return stats;
    },
    refetchInterval: 30000,
  });

  // Calculate summary stats from real-time data with fallbacks
  const totalRevenue = orderStats?.totalRevenue || orderAnalytics?.reduce((sum, day) => sum + (day.total_revenue || 0) + (day.cancellation_fees || 0), 0) || 0;
  const totalOrders = orderStats?.totalOrders || orderAnalytics?.reduce((sum, day) => sum + (day.total_orders || 0), 0) || 0;
  const averageOrderValue = orderStats?.averageOrderValue || (totalOrders > 0 ? totalRevenue / totalOrders : 0);

  const summary = {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    growthRate: orderStats?.growthRate || 0,
    statusCounts: orderStats?.statusCounts || {}
  };

  console.log('Final summary:', summary);

  return {
    orderAnalytics,
    productAnalytics,
    recentOrders,
    orderStats,
    dailyOrderAnalytics,
    isLoading: ordersLoading || productsLoading || recentOrdersLoading || orderStatsLoading || dailyAnalyticsLoading,
    summary,
  };
};
