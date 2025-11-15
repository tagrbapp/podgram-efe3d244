import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-gradient-to-r from-qultura-blue to-qultura-green py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
              الشروط والأحكام
            </h1>
            <p className="text-white/90 text-center mt-4 text-lg">
              آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">مرحباً بك في Podgram</h2>
              <p className="text-gray-600 leading-relaxed">
                من خلال الوصول إلى منصة Podgram واستخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام خدماتنا.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. قبول الشروط</h2>
              <p className="text-gray-600 leading-relaxed">
                باستخدام Podgram، فإنك توافق على الالتزام بهذه الشروط والأحكام وجميع القوانين واللوائح المعمول بها. إذا كنت لا توافق على أي من هذه الشروط، فيجب عليك عدم استخدام المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. استخدام المنصة</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>عند استخدام Podgram، يجب عليك:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>تقديم معلومات دقيقة وكاملة عند إنشاء حساب</li>
                  <li>الحفاظ على أمان حسابك وكلمة المرور</li>
                  <li>عدم انتحال شخصية أي شخص أو كيان آخر</li>
                  <li>عدم نشر محتوى غير قانوني أو مسيء أو مضلل</li>
                  <li>احترام حقوق الملكية الفكرية للآخرين</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. الإعلانات والقوائم</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>عند نشر إعلان على Podgram:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>يجب أن تكون مالك المنتج أو مخول ببيعه</li>
                  <li>يجب أن تكون جميع المعلومات والصور دقيقة وحقيقية</li>
                  <li>لا يُسمح ببيع منتجات مزيفة أو محظورة</li>
                  <li>يحق لـ Podgram إزالة أي إعلان يخالف هذه الشروط</li>
                  <li>أنت مسؤول عن الإعلانات التي تنشرها</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. المعاملات</h2>
              <p className="text-gray-600 leading-relaxed">
                Podgram هي منصة تربط بين البائعين والمشترين. نحن لا نشارك بشكل مباشر في المعاملات بين المستخدمين. البائع والمشتري مسؤولان عن:
              </p>
              <ul className="list-disc list-inside space-y-2 mr-4 mt-4 text-gray-600">
                <li>التفاوض على الأسعار والشروط</li>
                <li>التحقق من المنتجات قبل الشراء</li>
                <li>إتمام عمليات الدفع والتسليم</li>
                <li>حل أي نزاعات قد تنشأ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. الرسوم والدفع</h2>
              <p className="text-gray-600 leading-relaxed">
                قد تفرض Podgram رسوماً على بعض الخدمات المميزة. سيتم إبلاغك بأي رسوم قبل استخدام هذه الخدمات. جميع الرسوم غير قابلة للاسترداد ما لم ينص على خلاف ذلك.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. الملكية الفكرية</h2>
              <p className="text-gray-600 leading-relaxed">
                جميع المحتويات على منصة Podgram، بما في ذلك النصوص والصور والشعارات والتصميمات، محمية بحقوق الطبع والنشر والملكية الفكرية. لا يجوز نسخ أو توزيع أو تعديل أي محتوى دون إذن كتابي مسبق.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. إخلاء المسؤولية</h2>
              <p className="text-gray-600 leading-relaxed">
                يتم توفير المنصة "كما هي" دون أي ضمانات. لا نضمن دقة أو اكتمال أو موثوقية أي محتوى على المنصة. استخدامك للمنصة على مسؤوليتك الخاصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. تحديد المسؤولية</h2>
              <p className="text-gray-600 leading-relaxed">
                Podgram غير مسؤولة عن أي أضرار مباشرة أو غير مباشرة أو عرضية تنتج عن استخدام المنصة أو عدم القدرة على استخدامها، بما في ذلك المعاملات بين المستخدمين.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. إنهاء الحساب</h2>
              <p className="text-gray-600 leading-relaxed">
                يحق لنا تعليق أو إنهاء حسابك في أي وقت إذا انتهكت هذه الشروط أو إذا كان استخدامك للمنصة يشكل خطراً على المستخدمين الآخرين أو على المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. التعديلات</h2>
              <p className="text-gray-600 leading-relaxed">
                نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعارك بأي تغييرات جوهرية. استمرارك في استخدام المنصة بعد التعديلات يعني موافقتك عليها.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. القانون المطبق</h2>
              <p className="text-gray-600 leading-relaxed">
                تخضع هذه الشروط والأحكام للقوانين المعمول بها في المملكة العربية السعودية. يتم حل أي نزاع وفقاً للقوانين المحلية.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">التواصل</h2>
              <p className="text-gray-600 leading-relaxed">
                لأي استفسارات حول هذه الشروط والأحكام، يرجى التواصل معنا:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">البريد الإلكتروني: legal@podgram.com</p>
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

export default Terms;
