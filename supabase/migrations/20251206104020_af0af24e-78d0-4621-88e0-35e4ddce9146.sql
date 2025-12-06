
-- Create static pages table for editable content pages
CREATE TABLE public.static_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read active pages
CREATE POLICY "Anyone can view active static pages"
ON public.static_pages
FOR SELECT
USING (is_active = true);

-- Only admins can manage pages
CREATE POLICY "Admins can manage static pages"
ON public.static_pages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_static_pages_updated_at
  BEFORE UPDATE ON public.static_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pages
INSERT INTO public.static_pages (slug, title, content, meta_description) VALUES
('about', 'من نحن', '<h2>من نحن</h2>
<p>نحن منصة Podgram، المنصة الأولى للمنتجات الفاخرة في المنطقة العربية.</p>
<h3>رؤيتنا</h3>
<p>أن نكون الوجهة الأولى للمنتجات الفاخرة الأصلية في الشرق الأوسط.</p>
<h3>مهمتنا</h3>
<p>توفير منصة آمنة وموثوقة تجمع بين البائعين والمشترين للمنتجات الفاخرة.</p>
<h3>قيمنا</h3>
<ul>
<li>الأصالة والجودة</li>
<li>الشفافية والثقة</li>
<li>خدمة العملاء المتميزة</li>
<li>الابتكار المستمر</li>
</ul>', 'تعرف على منصة Podgram - المنصة الأولى للمنتجات الفاخرة في المنطقة'),

('help', 'مركز المساعدة', '<h2>مركز المساعدة</h2>
<p>مرحباً بك في مركز المساعدة. نحن هنا لمساعدتك!</p>
<h3>كيف يمكننا مساعدتك؟</h3>
<p>يمكنك التواصل معنا عبر:</p>
<ul>
<li>البريد الإلكتروني: support@podgram.com</li>
<li>الهاتف: +966 50 123 4567</li>
<li>نموذج الاتصال في صفحة اتصل بنا</li>
</ul>
<h3>ساعات العمل</h3>
<p>نحن متواجدون من الأحد إلى الخميس، من 9 صباحاً حتى 6 مساءً.</p>', 'مركز المساعدة - احصل على المساعدة والدعم في Podgram'),

('how-to-sell', 'كيف تبيع؟', '<h2>كيف تبيع على Podgram؟</h2>
<p>اتبع هذه الخطوات البسيطة للبدء في البيع:</p>
<h3>الخطوة 1: إنشاء حساب</h3>
<p>قم بالتسجيل كتاجر في المنصة وانتظر موافقة الإدارة.</p>
<h3>الخطوة 2: إضافة منتج</h3>
<p>بعد الموافقة، يمكنك إضافة منتجاتك مع الصور والوصف والسعر.</p>
<h3>الخطوة 3: إدارة الطلبات</h3>
<p>تابع طلباتك وتواصل مع المشترين عبر نظام الرسائل.</p>
<h3>الخطوة 4: الشحن والتوصيل</h3>
<p>قم بشحن المنتج للمشتري بعد إتمام عملية الدفع.</p>
<h3>نصائح للبيع الناجح</h3>
<ul>
<li>أضف صور عالية الجودة</li>
<li>اكتب وصفاً تفصيلياً</li>
<li>حدد سعراً تنافسياً</li>
<li>رد على الاستفسارات بسرعة</li>
</ul>', 'تعلم كيف تبيع منتجاتك على منصة Podgram'),

('how-to-buy', 'كيف تشتري؟', '<h2>كيف تشتري من Podgram؟</h2>
<p>الشراء سهل وآمن! اتبع هذه الخطوات:</p>
<h3>الخطوة 1: تصفح المنتجات</h3>
<p>استعرض المنتجات المتاحة أو ابحث عما تريد.</p>
<h3>الخطوة 2: تواصل مع البائع</h3>
<p>أرسل رسالة للبائع للاستفسار عن المنتج.</p>
<h3>الخطوة 3: المزايدة أو الشراء</h3>
<p>يمكنك المشاركة في المزادات أو الشراء المباشر.</p>
<h3>الخطوة 4: الاستلام والتقييم</h3>
<p>بعد استلام المنتج، قم بتقييم البائع.</p>
<h3>نصائح للشراء الآمن</h3>
<ul>
<li>تحقق من تقييمات البائع</li>
<li>اقرأ الوصف بعناية</li>
<li>اسأل عن أي تفاصيل إضافية</li>
<li>تأكد من سياسة الإرجاع</li>
</ul>', 'تعلم كيف تشتري بأمان من منصة Podgram'),

('safety', 'نصائح الأمان', '<h2>نصائح الأمان</h2>
<p>سلامتك أولويتنا. اتبع هذه النصائح للتعامل الآمن:</p>
<h3>حماية حسابك</h3>
<ul>
<li>استخدم كلمة مرور قوية</li>
<li>لا تشارك بيانات حسابك مع أحد</li>
<li>فعّل المصادقة الثنائية</li>
</ul>
<h3>التعاملات الآمنة</h3>
<ul>
<li>تعامل داخل المنصة فقط</li>
<li>لا تشارك معلوماتك الشخصية</li>
<li>احذر من العروض المشبوهة</li>
</ul>
<h3>التحقق من المنتجات</h3>
<ul>
<li>اطلب صوراً إضافية</li>
<li>تحقق من تقييمات البائع</li>
<li>اسأل عن شهادات الأصالة</li>
</ul>
<h3>الإبلاغ عن المشاكل</h3>
<p>إذا واجهت أي مشكلة، أبلغنا فوراً عبر صفحة اتصل بنا.</p>', 'نصائح الأمان للتعامل الآمن على منصة Podgram'),

('contact', 'اتصل بنا', '<h2>اتصل بنا</h2>
<p>نحن هنا لمساعدتك! تواصل معنا بأي من الطرق التالية:</p>
<h3>معلومات الاتصال</h3>
<ul>
<li><strong>البريد الإلكتروني:</strong> info@podgram.com</li>
<li><strong>الهاتف:</strong> +966 50 123 4567</li>
<li><strong>العنوان:</strong> الرياض، المملكة العربية السعودية</li>
</ul>
<h3>ساعات العمل</h3>
<p>الأحد - الخميس: 9:00 صباحاً - 6:00 مساءً</p>
<h3>تابعنا على</h3>
<p>تابعنا على منصات التواصل الاجتماعي للبقاء على اطلاع بآخر الأخبار والعروض.</p>', 'تواصل مع فريق Podgram - نحن هنا لمساعدتك'),

('cookies', 'سياسة ملفات تعريف الارتباط', '<h2>سياسة ملفات تعريف الارتباط (الكوكيز)</h2>
<p>نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا.</p>
<h3>ما هي ملفات تعريف الارتباط؟</h3>
<p>هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة موقعنا.</p>
<h3>أنواع الكوكيز المستخدمة</h3>
<ul>
<li><strong>كوكيز ضرورية:</strong> لتشغيل الموقع بشكل صحيح</li>
<li><strong>كوكيز الأداء:</strong> لتحليل كيفية استخدام الموقع</li>
<li><strong>كوكيز الوظائف:</strong> لتذكر تفضيلاتك</li>
</ul>
<h3>إدارة الكوكيز</h3>
<p>يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك.</p>', 'سياسة ملفات تعريف الارتباط في Podgram');
