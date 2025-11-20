import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import FAQSchema from "@/components/FAQSchema";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, ShoppingBag, Gavel, Shield, CreditCard, Truck, Users, MessageCircle } from "lucide-react";

const FAQ = () => {
  const faqCategories = [
    {
      title: "الأسئلة العامة",
      icon: HelpCircle,
      color: "text-primary",
      faqs: [
        {
          question: "ما هي منصة Podgram؟",
          answer: "Podgram هي المنصة الأولى لإعادة بيع المنتجات الفاخرة في المنطقة. نوفر سوقاً آمناً وموثوقاً للبائعين والمشترين لتبادل المنتجات الفاخرة مثل الساعات، الحقائب، المجوهرات، السيارات، والعقارات."
        },
        {
          question: "هل التسجيل في المنصة مجاني؟",
          answer: "نعم، التسجيل في منصة Podgram مجاني تماماً. يمكنك إنشاء حساب والبدء في تصفح الإعلانات والمزادات دون أي رسوم."
        },
        {
          question: "ما هي المنتجات المسموح بيعها على المنصة؟",
          answer: "نسمح ببيع المنتجات الفاخرة مثل الساعات الفاخرة، الحقائب، المجوهرات، العطور، الملابس الفاخرة، السيارات الفاخرة، والعقارات. يجب أن تكون جميع المنتجات أصلية وتلتزم بشروط الاستخدام."
        },
        {
          question: "كيف أتواصل مع خدمة العملاء؟",
          answer: "يمكنك التواصل معنا عبر البريد الإلكتروني info@podgram.com أو عبر الهاتف +966 50 123 4567. فريق الدعم متاح للرد على استفساراتك."
        }
      ]
    },
    {
      title: "البيع على المنصة",
      icon: ShoppingBag,
      color: "text-secondary",
      faqs: [
        {
          question: "كيف أضيف إعلاناً جديداً؟",
          answer: "بعد تسجيل الدخول، انقر على 'أضف إعلان' من القائمة الرئيسية. املأ تفاصيل المنتج، أضف صوراً واضحة، حدد السعر والموقع، ثم انقر على 'نشر الإعلان'. سيتم مراجعة إعلانك من قبل فريقنا قبل النشر."
        },
        {
          question: "هل يوجد رسوم على نشر الإعلانات؟",
          answer: "نشر الإعلانات مجاني حالياً. قد نطبق رسوماً رمزية على بعض الخدمات المميزة في المستقبل."
        },
        {
          question: "كم من الوقت يستغرق الموافقة على إعلاني؟",
          answer: "عادةً ما تتم مراجعة والموافقة على الإعلانات خلال 24 ساعة من تقديمها. سنرسل لك إشعاراً بمجرد الموافقة على إعلانك."
        },
        {
          question: "كيف أحدث أو أحذف إعلاني؟",
          answer: "يمكنك إدارة إعلاناتك من لوحة التحكم الخاصة بك. انتقل إلى 'لوحة التحكم' > 'إعلاناتي' حيث يمكنك تحديث التفاصيل أو حذف الإعلان."
        }
      ]
    },
    {
      title: "المزادات",
      icon: Gavel,
      color: "text-accent",
      faqs: [
        {
          question: "كيف تعمل المزادات على Podgram؟",
          answer: "المزادات هي طريقة تنافسية لبيع المنتجات. يحدد البائع سعراً ابتدائياً ومدة المزاد. يمكن للمشترين المزايدة على المنتج، وأعلى مزايد في نهاية المزاد يفوز بالمنتج."
        },
        {
          question: "ما هو نظام المزايدة التلقائية؟",
          answer: "المزايدة التلقائية تسمح لك بتحديد حد أقصى للمبلغ الذي تريد دفعه. سيقوم النظام تلقائياً بالمزايدة نيابة عنك حتى هذا الحد، مما يوفر عليك مراقبة المزاد باستمرار."
        },
        {
          question: "ماذا يحدث إذا فزت بمزاد؟",
          answer: "عند فوزك بمزاد، ستتلقى إشعاراً فورياً. يجب عليك التواصل مع البائع خلال 48 ساعة لإتمام عملية الشراء والاتفاق على التسليم والدفع."
        },
        {
          question: "هل يمكنني إلغاء مزايدتي؟",
          answer: "لا يمكن إلغاء المزايدات بمجرد تقديمها. تأكد من رغبتك في المنتج قبل المزايدة. هذا يضمن جدية المزايدات ويحمي حقوق البائعين."
        },
        {
          question: "ما هو السعر الاحتياطي في المزاد؟",
          answer: "السعر الاحتياطي هو الحد الأدنى للسعر الذي يقبله البائع. إذا لم تصل المزايدات لهذا السعر، يمكن للبائع عدم إتمام البيع."
        }
      ]
    },
    {
      title: "الأمان والثقة",
      icon: Shield,
      color: "text-green-600",
      faqs: [
        {
          question: "كيف تضمنون أصالة المنتجات؟",
          answer: "نطلب من البائعين تقديم صور واضحة وتفصيلية للمنتجات. ننصح المشترين بالفحص الدقيق والتأكد من أصالة المنتج قبل الشراء. كما نشجع على التعامل المباشر للسلع عالية القيمة."
        },
        {
          question: "ماذا أفعل إذا اشتبهت في احتيال؟",
          answer: "إذا لاحظت أي نشاط مشبوه، أبلغ عنه فوراً من خلال زر 'الإبلاغ' في الإعلان أو تواصل مع فريق الدعم. نتخذ جميع البلاغات على محمل الجد."
        },
        {
          question: "هل معلوماتي الشخصية آمنة؟",
          answer: "نعم، نحن نلتزم بأعلى معايير الأمان لحماية بياناتك. نستخدم تشفير SSL ولا نشارك معلوماتك مع أطراف ثالثة دون موافقتك."
        },
        {
          question: "كيف أتجنب عمليات الاحتيال؟",
          answer: "لا تشارك معلوماتك المصرفية مباشرة، التقي بالبائع في أماكن عامة للسلع المحلية، استخدم طرق دفع آمنة، وتحقق من سمعة البائع من خلال التقييمات."
        }
      ]
    },
    {
      title: "الدفع والتسليم",
      icon: CreditCard,
      color: "text-blue-600",
      faqs: [
        {
          question: "ما هي طرق الدفع المتاحة؟",
          answer: "يتم الاتفاق على طريقة الدفع بين البائع والمشتري مباشرة. ننصح باستخدام طرق الدفع الآمنة والموثوقة مثل التحويل البنكي أو الدفع عند الاستلام للسلع المحلية."
        },
        {
          question: "كيف يتم التسليم؟",
          answer: "التسليم يتم بالاتفاق المباشر بين البائع والمشتري. يمكن الاتفاق على التسليم المباشر، أو الشحن عبر شركات الشحن الموثوقة. المنصة لا تتحمل مسؤولية التسليم."
        },
        {
          question: "من يتحمل تكاليف الشحن؟",
          answer: "تكاليف الشحن يتم الاتفاق عليها بين البائع والمشتري. عادةً ما يتحملها المشتري، ولكن بعض البائعين قد يقدمون شحناً مجانياً."
        }
      ]
    },
    {
      title: "الحساب والملف الشخصي",
      icon: Users,
      color: "text-purple-600",
      faqs: [
        {
          question: "كيف أحدث معلومات ملفي الشخصي؟",
          answer: "انتقل إلى 'الإعدادات' من القائمة الرئيسية حيث يمكنك تحديث اسمك، صورتك الشخصية، رقم الهاتف، وغيرها من المعلومات."
        },
        {
          question: "لماذا يحتاج حسابي للموافقة؟",
          answer: "نراجع الحسابات الجديدة لضمان جودة المنصة ومنع الحسابات الوهمية. هذا يساعد في بناء مجتمع موثوق وآمن."
        },
        {
          question: "كيف أحذف حسابي؟",
          answer: "يمكنك طلب حذف حسابك من خلال التواصل مع فريق الدعم. سيتم حذف جميع بياناتك بشكل دائم خلال 30 يوماً."
        },
        {
          question: "ماذا تعني النقاط والشارات في ملفي؟",
          answer: "نظام النقاط والشارات يكافئك على نشاطك في المنصة. تكسب نقاطاً من خلال البيع، الشراء، والمشاركة. الشارات تعكس إنجازاتك ومستوى نشاطك."
        }
      ]
    },
    {
      title: "التواصل والرسائل",
      icon: MessageCircle,
      color: "text-orange-600",
      faqs: [
        {
          question: "كيف أتواصل مع البائع؟",
          answer: "في صفحة الإعلان، انقر على زر 'مراسلة البائع' أو 'الاتصال'. يمكنك إرسال رسالة عبر المنصة أو الاتصال مباشرة إذا كان رقم الهاتف متاحاً."
        },
        {
          question: "هل تصلني إشعارات بالرسائل الجديدة؟",
          answer: "نعم، ستتلقى إشعارات فورية عبر المنصة والبريد الإلكتروني عند استلام رسائل جديدة. يمكنك إدارة تفضيلات الإشعارات من الإعدادات."
        },
        {
          question: "ماذا أفعل إذا لم يرد البائع؟",
          answer: "امنح البائع 48 ساعة للرد. إذا لم يرد، يمكنك البحث عن إعلانات مشابهة أو التواصل مع فريق الدعم إذا كانت هناك مشكلة."
        }
      ]
    }
  ];

  // Flatten all FAQs for schema
  const allFAQs = faqCategories.flatMap(category => category.faqs);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="الأسئلة الشائعة - Podgram | دليلك الشامل للمنصة"
        description="إجابات على جميع أسئلتك حول منصة Podgram. تعرف على كيفية البيع، الشراء، المزادات، الأمان، والمزيد."
        keywords="أسئلة شائعة, FAQ, مساعدة, دليل الاستخدام, كيفية البيع, كيفية الشراء, المزادات"
      />
      <FAQSchema faqs={allFAQs} />
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "الرئيسية", href: "/" },
            { label: "الأسئلة الشائعة" }
          ]}
        />

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            الأسئلة الشائعة
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            لديك سؤال؟ ابحث عن الإجابة هنا. جمعنا أكثر الأسئلة شيوعاً لمساعدتك في استخدام المنصة
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
          {faqCategories.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <Card key={categoryIndex} className="p-6 md:p-8 shadow-lg border-2 hover:border-primary/50 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl bg-muted ${category.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem 
                      key={faqIndex} 
                      value={`item-${categoryIndex}-${faqIndex}`}
                      className="border-b border-border/50"
                    >
                      <AccordionTrigger className="text-right hover:no-underline hover:text-primary transition-colors py-4">
                        <span className="text-base font-semibold">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed pb-4 text-base">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            );
          })}
        </div>

        {/* Contact CTA */}
        <Card className="mt-12 p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-2 max-w-3xl mx-auto">
          <MessageCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-3">
            لم تجد إجابة لسؤالك؟
          </h3>
          <p className="text-muted-foreground mb-6 text-lg">
            فريق الدعم لدينا جاهز لمساعدتك في أي وقت
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:info@podgram.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:shadow-elegant transition-all hover:-translate-y-0.5"
            >
              راسلنا عبر البريد الإلكتروني
            </a>
            <a 
              href="tel:+966501234567"
              className="inline-flex items-center justify-center px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:shadow-elegant transition-all hover:-translate-y-0.5"
            >
              اتصل بنا
            </a>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
