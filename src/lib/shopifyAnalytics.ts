import { supabase } from "@/integrations/supabase/client";

// Generate or get session ID for anonymous users
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('shopify_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('shopify_session_id', sessionId);
  }
  return sessionId;
};

export interface ProductEvent {
  product_id: string;
  product_handle: string;
  event_type: 'view' | 'cart_add' | 'cart_remove' | 'purchase';
  quantity?: number;
  price?: number;
}

export interface ProductAnalytics {
  id: string;
  product_id: string;
  product_handle: string;
  product_title: string | null;
  views_count: number;
  cart_adds_count: number;
  purchases_count: number;
  units_sold: number;
  unique_viewers: number;
  unique_cart_adders: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export const trackProductEvent = async (event: ProductEvent) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = getSessionId();

    const { error } = await supabase
      .from('shopify_product_events')
      .insert({
        product_id: event.product_id,
        product_handle: event.product_handle,
        user_id: user?.id || null,
        session_id: sessionId,
        event_type: event.event_type,
        quantity: event.quantity || 1,
        price: event.price || null,
      });

    if (error) {
      console.error('Error tracking product event:', error);
    }
  } catch (error) {
    console.error('Error tracking product event:', error);
  }
};

export const getProductAnalytics = async (): Promise<ProductAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from('shopify_product_analytics')
      .select('*')
      .order('views_count', { ascending: false });

    if (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return [];
  }
};

export const getAnalyticsSummary = async () => {
  try {
    const { data, error } = await supabase
      .from('shopify_product_analytics')
      .select('*');

    if (error) {
      console.error('Error fetching analytics summary:', error);
      return null;
    }

    const analytics = data || [];
    
    return {
      totalViews: analytics.reduce((sum, a) => sum + (a.views_count || 0), 0),
      totalCartAdds: analytics.reduce((sum, a) => sum + (a.cart_adds_count || 0), 0),
      totalPurchases: analytics.reduce((sum, a) => sum + (a.purchases_count || 0), 0),
      totalUnitsSold: analytics.reduce((sum, a) => sum + (a.units_sold || 0), 0),
      totalRevenue: analytics.reduce((sum, a) => sum + parseFloat(String(a.revenue || 0)), 0),
      uniqueViewers: analytics.reduce((sum, a) => sum + (a.unique_viewers || 0), 0),
      uniqueCartAdders: analytics.reduce((sum, a) => sum + (a.unique_cart_adders || 0), 0),
      conversionRate: analytics.length > 0 
        ? (analytics.reduce((sum, a) => sum + (a.purchases_count || 0), 0) / 
           Math.max(analytics.reduce((sum, a) => sum + (a.views_count || 0), 0), 1) * 100).toFixed(2)
        : '0.00',
      cartConversionRate: analytics.length > 0
        ? (analytics.reduce((sum, a) => sum + (a.purchases_count || 0), 0) /
           Math.max(analytics.reduce((sum, a) => sum + (a.cart_adds_count || 0), 0), 1) * 100).toFixed(2)
        : '0.00',
    };
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return null;
  }
};

export const getRecentEvents = async (limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('shopify_product_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent events:', error);
    return [];
  }
};

export interface TimeSeriesData {
  date: string;
  views: number;
  cartAdds: number;
  purchases: number;
}

export const getTimeSeriesAnalytics = async (
  period: 'day' | 'week' | 'month' = 'day',
  days: number = 30
): Promise<TimeSeriesData[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('shopify_product_events')
      .select('created_at, event_type')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching time series:', error);
      return [];
    }

    const events = data || [];
    const groupedData: { [key: string]: TimeSeriesData } = {};

    events.forEach(event => {
      const date = new Date(event.created_at);
      let key: string;

      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = { date: key, views: 0, cartAdds: 0, purchases: 0 };
      }

      if (event.event_type === 'view') {
        groupedData[key].views++;
      } else if (event.event_type === 'cart_add') {
        groupedData[key].cartAdds++;
      } else if (event.event_type === 'purchase') {
        groupedData[key].purchases++;
      }
    });

    return Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching time series:', error);
    return [];
  }
};
