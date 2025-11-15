-- إصلاح مشاكل الأمان

-- 1. تفعيل RLS على جدول test_bidder_stats
ALTER TABLE IF EXISTS public.test_bidder_stats ENABLE ROW LEVEL SECURITY;

-- حذف السياسة القديمة إن وجدت ثم إنشاء واحدة جديدة
DROP POLICY IF EXISTS "Users can view their own test stats" ON public.test_bidder_stats;

CREATE POLICY "Users can view their own test stats"
ON public.test_bidder_stats FOR SELECT
USING (auth.uid() = user_id);

-- 2. تحديث الدوال لإضافة search_path

-- تحديث دالة calculate_response_rate
CREATE OR REPLACE FUNCTION public.calculate_response_rate(seller_uuid uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT c.id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(DISTINCT CASE WHEN m.sender_id = seller_uuid THEN c.id END)::NUMERIC / 
         COUNT(DISTINCT c.id)::NUMERIC) * 100, 
        1
      )
    END
  FROM public.conversations c
  LEFT JOIN public.messages m ON m.conversation_id = c.id
  WHERE c.seller_id = seller_uuid
$function$;

-- تحديث دالة calculate_avg_response_time
CREATE OR REPLACE FUNCTION public.calculate_avg_response_time(seller_uuid uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    COALESCE(
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (
            first_seller_reply.created_at - first_buyer_message.created_at
          )) / 60
        )::NUMERIC,
        1
      ),
      0
    )
  FROM public.conversations c
  CROSS JOIN LATERAL (
    SELECT created_at 
    FROM public.messages 
    WHERE conversation_id = c.id AND sender_id = c.buyer_id
    ORDER BY created_at ASC 
    LIMIT 1
  ) AS first_buyer_message
  CROSS JOIN LATERAL (
    SELECT created_at 
    FROM public.messages 
    WHERE conversation_id = c.id AND sender_id = c.seller_id AND created_at > first_buyer_message.created_at
    ORDER BY created_at ASC 
    LIMIT 1
  ) AS first_seller_reply
  WHERE c.seller_id = seller_uuid
$function$;

-- تحديث دالة calculate_completion_rate
CREATE OR REPLACE FUNCTION public.calculate_completion_rate(seller_uuid uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE status = 'sold')::NUMERIC / COUNT(*)::NUMERIC) * 100,
        1
      )
    END
  FROM public.listings
  WHERE user_id = seller_uuid
$function$;

-- تحديث دالة get_total_sales
CREATE OR REPLACE FUNCTION public.get_total_sales(seller_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.listings
  WHERE user_id = seller_uuid AND status = 'sold'
$function$;