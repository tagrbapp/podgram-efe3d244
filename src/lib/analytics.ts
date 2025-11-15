import { supabase } from "@/integrations/supabase/client";
import { subDays, format } from "date-fns";

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface ViewsData {
  date: string;
  views: number;
}

export interface SalesData {
  date: string;
  sales: number;
}

export const getRevenueData = async (userId: string, days: number = 30): Promise<RevenueData[]> => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  const { data, error } = await supabase.rpc('get_revenue_by_period', {
    seller_uuid: userId,
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  });

  if (error) {
    console.error('Error fetching revenue data:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    date: item.date,
    revenue: Number(item.revenue),
  }));
};

export const getViewsData = async (userId: string, days: number = 30): Promise<ViewsData[]> => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  const { data, error } = await supabase.rpc('get_views_by_period', {
    seller_uuid: userId,
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(endDate, 'yyyy-MM-dd'),
  });

  if (error) {
    console.error('Error fetching views data:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    date: item.date,
    views: Number(item.total_views),
  }));
};

export const getSalesData = async (userId: string): Promise<SalesData[]> => {
  const { data, error } = await supabase
    .from('daily_sales')
    .select('sale_date, price')
    .eq('user_id', userId)
    .order('sale_date', { ascending: true });

  if (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }

  // Group by date and count sales
  const salesByDate = (data || []).reduce((acc: any, sale) => {
    const date = sale.sale_date;
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date]++;
    return acc;
  }, {});

  return Object.entries(salesByDate).map(([date, sales]) => ({
    date,
    sales: sales as number,
  }));
};

export const recordView = async (listingId: string, userId: string) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { error } = await supabase
    .from('daily_views')
    .upsert({
      listing_id: listingId,
      user_id: userId,
      view_date: today,
      views_count: 1,
    }, {
      onConflict: 'listing_id,view_date',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Error recording view:', error);
  }
};
