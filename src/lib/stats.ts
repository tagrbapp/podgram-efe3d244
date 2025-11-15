import { supabase } from "@/integrations/supabase/client";

export interface SellerStats {
  responseRate: number;
  avgResponseTime: number;
  completionRate: number;
  totalSales: number;
}

export const getSellerStats = async (sellerId: string): Promise<SellerStats> => {
  try {
    // استدعاء الدوال SQL المخصصة
    const { data: responseRate } = await supabase
      .rpc('calculate_response_rate', { seller_uuid: sellerId });
    
    const { data: avgResponseTime } = await supabase
      .rpc('calculate_avg_response_time', { seller_uuid: sellerId });
    
    const { data: completionRate } = await supabase
      .rpc('calculate_completion_rate', { seller_uuid: sellerId });
    
    const { data: totalSales } = await supabase
      .rpc('get_total_sales', { seller_uuid: sellerId });

    return {
      responseRate: responseRate || 0,
      avgResponseTime: avgResponseTime || 0,
      completionRate: completionRate || 0,
      totalSales: totalSales || 0,
    };
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return {
      responseRate: 0,
      avgResponseTime: 0,
      completionRate: 0,
      totalSales: 0,
    };
  }
};

export const formatResponseTime = (minutes: number): string => {
  if (minutes < 1) return "أقل من دقيقة";
  if (minutes < 60) return `${Math.round(minutes)} دقيقة`;
  
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ساعة`;
  
  const days = Math.round(hours / 24);
  return `${days} يوم`;
};
