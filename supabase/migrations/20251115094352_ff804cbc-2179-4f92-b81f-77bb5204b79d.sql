-- إنشاء جدول الملفات الشخصية
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- تفعيل RLS على جدول الملفات الشخصية
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للملفات الشخصية
CREATE POLICY "الجميع يمكنهم رؤية الملفات الشخصية"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "المستخدمون يمكنهم تحديث ملفاتهم الشخصية"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "المستخدمون يمكنهم إدراج ملفاتهم الشخصية"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- إنشاء جدول التصنيفات
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- تفعيل RLS على جدول التصنيفات
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- سياسة RLS للتصنيفات (قراءة عامة)
CREATE POLICY "الجميع يمكنهم رؤية التصنيفات"
  ON public.categories FOR SELECT
  USING (true);

-- إدراج التصنيفات الافتراضية
INSERT INTO public.categories (name, icon) VALUES
  ('سيارات', 'Car'),
  ('عقارات', 'Home'),
  ('إلكترونيات', 'Smartphone'),
  ('أزياء', 'Shirt'),
  ('أثاث', 'Sofa'),
  ('وظائف', 'Briefcase');

-- إنشاء جدول الإعلانات
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  location TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  images TEXT[], -- مصفوفة لروابط الصور
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- تفعيل RLS على جدول الإعلانات
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للإعلانات
CREATE POLICY "الجميع يمكنهم رؤية الإعلانات النشطة"
  ON public.listings FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة إعلاناتهم"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث إعلاناتهم"
  ON public.listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف إعلاناتهم"
  ON public.listings FOR DELETE
  USING (auth.uid() = user_id);

-- دالة لإنشاء ملف شخصي تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد')
  );
  RETURN new;
END;
$$;

-- محفز لتنفيذ الدالة عند إنشاء مستخدم جديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- محفزات لتحديث updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_listings_user_id ON public.listings(user_id);
CREATE INDEX idx_listings_category_id ON public.listings(category_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);