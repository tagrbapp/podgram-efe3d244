import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-gradient-to-r from-qultura-blue to-qultura-green py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
              سياسة الخصوصية
            </h1>
            <p className="text-white/90 text-center mt-4 text-lg">
              آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">مقدمة</h2>
              <p className="text-gray-600 leading-relaxed">
                نحن في Podgram نلتزم بحماية خصوصيتك وأمان بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات التي تقدمها لنا عند استخدام منصتنا.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">المعلومات التي نجمعها</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>نقوم بجمع الأنواع التالية من المعلومات:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف</li>
                  <li>معلومات الإعلانات: العنوان، الوصف، الصور، السعر</li>
                  <li>معلومات الاستخدام: سجل التصفح، التفاعلات، الإحصائيات</li>
                  <li>المعلومات التقنية: عنوان IP، نوع المتصفح، نظام التشغيل</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">كيف نستخدم معلوماتك</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>نستخدم المعلومات المجمعة للأغراض التالية:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>تقديم وتحسين خدماتنا</li>
                  <li>التواصل معك بخصوص حسابك والإعلانات</li>
                  <li>معالجة المعاملات والطلبات</li>
                  <li>تحليل استخدام المنصة وتحسين الأداء</li>
                  <li>الامتثال للمتطلبات القانونية والتنظيمية</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">مشاركة المعلومات</h2>
              <p className="text-gray-600 leading-relaxed">
                نحن لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4 mt-4 text-gray-600">
                <li>مع موافقتك الصريحة</li>
                <li>مع مقدمي الخدمات الذين يساعدوننا في تشغيل المنصة</li>
                <li>عند الامتثال للقوانين أو الإجراءات القانونية</li>
                <li>لحماية حقوقنا وسلامة المستخدمين</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">أمان البيانات</h2>
              <p className="text-gray-600 leading-relaxed">
                نستخدم تدابير أمنية تقنية وتنظيمية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو الإفصاح أو التغيير أو الإتلاف. نستخدم تشفير SSL لحماية البيانات أثناء النقل.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">حقوقك</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>الوصول إلى معلوماتك الشخصية</li>
                  <li>تصحيح أو تحديث معلوماتك</li>
                  <li>حذف حسابك ومعلوماتك</li>
                  <li>الاعتراض على معالجة بياناتك</li>
                  <li>طلب نقل بياناتك</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">ملفات تعريف الارتباط</h2>
              <p className="text-gray-600 leading-relaxed">
                نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك على منصتنا. يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">التواصل معنا</h2>
              <p className="text-gray-600 leading-relaxed">
                إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا على:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">البريد الإلكتروني: privacy@podgram.com</p>
                <p className="text-gray-700 mt-2">الهاتف: +966 50 123 4567</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
