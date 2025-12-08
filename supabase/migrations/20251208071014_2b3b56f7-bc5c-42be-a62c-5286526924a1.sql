-- Create merchant_plans table
CREATE TABLE public.merchant_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  auctions_per_day INTEGER NOT NULL DEFAULT 1,
  max_active_auctions INTEGER,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create merchant_subscriptions table
CREATE TABLE public.merchant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.merchant_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create merchant_commissions table
CREATE TABLE public.merchant_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  auction_id UUID REFERENCES public.auctions(id),
  sale_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_commissions ENABLE ROW LEVEL SECURITY;

-- Policies for merchant_plans (everyone can view, admins can manage)
CREATE POLICY "Anyone can view active plans" ON public.merchant_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.merchant_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for merchant_subscriptions
CREATE POLICY "Users can view their own subscription" ON public.merchant_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.merchant_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage subscriptions" ON public.merchant_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for merchant_commissions
CREATE POLICY "Users can view their own commissions" ON public.merchant_commissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage commissions" ON public.merchant_commissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default plans
INSERT INTO public.merchant_plans (name, name_en, price, auctions_per_day, max_active_auctions, commission_rate, features, is_popular, display_order) VALUES
('المجانية', 'free', 0, 1, 1, 1.0, '["مزاد واحد نشط فقط", "عمولة 1% عند البيع"]', false, 1),
('الأساسية', 'basic', 29, 1, NULL, 0.8, '["مزاد واحد يومياً", "عمولة 0.8% عند البيع", "دعم فني"]', false, 2),
('المتقدمة', 'advanced', 99, 3, NULL, 0.2, '["3 مزادات يومياً", "عمولة 0.2% عند البيع", "دعم فني أولوية", "شارة تاجر متميز"]', true, 3),
('المميزة', 'premium', 199, 5, NULL, 0, '["5 مزادات يومياً", "بدون عمولة!", "دعم فني VIP", "شارة تاجر VIP", "ظهور مميز"]', false, 4);

-- Add selected_plan_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_plan_id UUID REFERENCES public.merchant_plans(id);

-- Function to create subscription on merchant registration
CREATE OR REPLACE FUNCTION public.create_merchant_subscription_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.membership_type = 'merchant' AND NEW.selected_plan_id IS NOT NULL THEN
    INSERT INTO public.merchant_subscriptions (user_id, plan_id, status, started_at, next_payment_date)
    VALUES (
      NEW.id,
      NEW.selected_plan_id,
      'pending',
      now(),
      CASE 
        WHEN (SELECT price FROM merchant_plans WHERE id = NEW.selected_plan_id) > 0 
        THEN now() + INTERVAL '1 month'
        ELSE NULL
      END
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for subscription creation
CREATE TRIGGER on_merchant_profile_created
  AFTER INSERT OR UPDATE OF selected_plan_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_merchant_subscription_on_profile();

-- Function to check if merchant can create auction
CREATE OR REPLACE FUNCTION public.can_merchant_create_auction(_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _subscription RECORD;
  _plan RECORD;
  _today_auctions INTEGER;
  _active_auctions INTEGER;
BEGIN
  -- Get subscription
  SELECT * INTO _subscription FROM merchant_subscriptions WHERE user_id = _user_id;
  
  IF _subscription IS NULL THEN
    RETURN json_build_object('allowed', false, 'reason', 'لا يوجد اشتراك نشط');
  END IF;
  
  IF _subscription.status = 'suspended' THEN
    RETURN json_build_object('allowed', false, 'reason', 'تم إيقاف العضوية بسبب عدم سداد المستحقات');
  END IF;
  
  IF _subscription.status != 'active' THEN
    RETURN json_build_object('allowed', false, 'reason', 'الاشتراك غير نشط');
  END IF;
  
  -- Get plan limits
  SELECT * INTO _plan FROM merchant_plans WHERE id = _subscription.plan_id;
  
  -- Count today's auctions
  SELECT COUNT(*) INTO _today_auctions
  FROM auctions
  WHERE user_id = _user_id AND DATE(created_at) = CURRENT_DATE AND deleted_at IS NULL;
  
  -- Count active auctions
  SELECT COUNT(*) INTO _active_auctions
  FROM auctions
  WHERE user_id = _user_id AND status = 'active' AND deleted_at IS NULL;
  
  -- Check daily limit
  IF _today_auctions >= _plan.auctions_per_day THEN
    RETURN json_build_object('allowed', false, 'reason', 'تجاوزت الحد اليومي للمزادات (' || _plan.auctions_per_day || ' مزاد/يوم)');
  END IF;
  
  -- Check max active auctions (for free plan)
  IF _plan.max_active_auctions IS NOT NULL AND _active_auctions >= _plan.max_active_auctions THEN
    RETURN json_build_object('allowed', false, 'reason', 'لديك مزاد نشط بالفعل. يجب انتهاء المزاد الحالي أولاً');
  END IF;
  
  RETURN json_build_object('allowed', true, 'remaining_today', _plan.auctions_per_day - _today_auctions);
END;
$$;