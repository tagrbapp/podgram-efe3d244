import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";
import podgramLogo from "@/assets/podgram-logo.png";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FooterLink {
  title: string;
  url: string;
}

interface FooterSettings {
  brand_name: string;
  brand_description: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  phone: string;
  email: string;
  address: string;
  copyright_text: string;
  quick_links: FooterLink[];
  support_links: FooterLink[];
  bottom_links: FooterLink[];
}

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("footer_settings")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          ...data,
          quick_links: Array.isArray(data.quick_links) ? data.quick_links as unknown as FooterLink[] : [],
          support_links: Array.isArray(data.support_links) ? data.support_links as unknown as FooterLink[] : [],
          bottom_links: Array.isArray(data.bottom_links) ? data.bottom_links as unknown as FooterLink[] : [],
        });
      }
    } catch (error) {
      console.error("Error fetching footer settings:", error);
    }
  };

  // Use fetched settings or fallback to defaults
  const brandName = settings?.brand_name || "Podgram";
  const brandDescription = settings?.brand_description || "المنصة الأولى للمنتجات الفاخرة في المنطقة. نجمع بين البائعين والمشترين في سوق آمن وموثوق.";
  const facebookUrl = settings?.facebook_url || "https://facebook.com";
  const instagramUrl = settings?.instagram_url || "https://instagram.com";
  const twitterUrl = settings?.twitter_url || "https://twitter.com";
  const linkedinUrl = settings?.linkedin_url || "https://linkedin.com";
  const youtubeUrl = settings?.youtube_url || "https://youtube.com";
  const phone = settings?.phone || "+966 50 123 4567";
  const email = settings?.email || "info@podgram.com";
  const address = settings?.address || "الرياض، المملكة العربية السعودية";
  const copyrightText = settings?.copyright_text || "Podgram. جميع الحقوق محفوظة.";
  
  const quickLinks = settings?.quick_links || [
    { title: "من نحن", url: "/about" },
    { title: "الكتالوج", url: "/catalog" },
    { title: "المفضلة", url: "/favorites" },
    { title: "أضف إعلان", url: "/add-listing" },
    { title: "الرسائل", url: "/messages" },
  ];
  
  const supportLinks = settings?.support_links || [
    { title: "الأسئلة الشائعة", url: "/faq" },
    { title: "مركز المساعدة", url: "/help" },
    { title: "كيف تبيع؟", url: "/how-to-sell" },
    { title: "كيف تشتري؟", url: "/how-to-buy" },
    { title: "نصائح الأمان", url: "/safety" },
    { title: "اتصل بنا", url: "/contact" },
  ];
  
  const bottomLinks = settings?.bottom_links || [
    { title: "سياسة الخصوصية", url: "/privacy" },
    { title: "الشروط والأحكام", url: "/terms" },
    { title: "سياسة ملفات تعريف الارتباط", url: "/cookies" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={podgramLogo} alt={brandName} className="h-12 w-12 object-contain" />
              <span className="text-2xl font-bold text-white">{brandName}</span>
            </div>
            <p className="text-sm leading-relaxed">
              {brandDescription}
            </p>
            <div className="flex items-center gap-3 pt-4">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">روابط سريعة</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.url} className="hover:text-qultura-blue transition-smooth text-sm">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">الدعم والمساعدة</h3>
            <ul className="space-y-3">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.url} className="hover:text-qultura-blue transition-smooth text-sm">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">تواصل معنا</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-qultura-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">الهاتف</p>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-sm hover:text-qultura-blue transition-smooth">
                    {phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-qultura-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">البريد الإلكتروني</p>
                  <a href={`mailto:${email}`} className="text-sm hover:text-qultura-blue transition-smooth">
                    {email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-qultura-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">العنوان</p>
                  <p className="text-sm">{address}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} {copyrightText}
            </p>
            <div className="flex items-center gap-6 text-sm">
              {bottomLinks.map((link, index) => (
                <Link key={index} to={link.url} className="hover:text-qultura-blue transition-smooth">
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
