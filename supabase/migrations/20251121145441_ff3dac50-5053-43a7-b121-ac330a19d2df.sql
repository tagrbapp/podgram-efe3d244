-- إضافة حقول الروابط إلى جدول footer_settings
ALTER TABLE footer_settings
ADD COLUMN IF NOT EXISTS quick_links JSONB DEFAULT '[
  {"title": "من نحن", "url": "/about"},
  {"title": "الكتالوج", "url": "/catalog"},
  {"title": "المفضلة", "url": "/favorites"},
  {"title": "أضف إعلان", "url": "/add-listing"},
  {"title": "الرسائل", "url": "/messages"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS support_links JSONB DEFAULT '[
  {"title": "الأسئلة الشائعة", "url": "/faq"},
  {"title": "مركز المساعدة", "url": "/help"},
  {"title": "كيف تبيع؟", "url": "/how-to-sell"},
  {"title": "كيف تشتري؟", "url": "/how-to-buy"},
  {"title": "نصائح الأمان", "url": "/safety"},
  {"title": "اتصل بنا", "url": "/contact"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS bottom_links JSONB DEFAULT '[
  {"title": "سياسة الخصوصية", "url": "/privacy"},
  {"title": "الشروط والأحكام", "url": "/terms"},
  {"title": "سياسة ملفات تعريف الارتباط", "url": "/cookies"}
]'::jsonb;

-- تحديث السجل الموجود بالقيم الافتراضية
UPDATE footer_settings
SET 
  quick_links = '[
    {"title": "من نحن", "url": "/about"},
    {"title": "الكتالوج", "url": "/catalog"},
    {"title": "المفضلة", "url": "/favorites"},
    {"title": "أضف إعلان", "url": "/add-listing"},
    {"title": "الرسائل", "url": "/messages"}
  ]'::jsonb,
  support_links = '[
    {"title": "الأسئلة الشائعة", "url": "/faq"},
    {"title": "مركز المساعدة", "url": "/help"},
    {"title": "كيف تبيع؟", "url": "/how-to-sell"},
    {"title": "كيف تشتري؟", "url": "/how-to-buy"},
    {"title": "نصائح الأمان", "url": "/safety"},
    {"title": "اتصل بنا", "url": "/contact"}
  ]'::jsonb,
  bottom_links = '[
    {"title": "سياسة الخصوصية", "url": "/privacy"},
    {"title": "الشروط والأحكام", "url": "/terms"},
    {"title": "سياسة ملفات تعريف الارتباط", "url": "/cookies"}
  ]'::jsonb
WHERE quick_links IS NULL OR support_links IS NULL OR bottom_links IS NULL;