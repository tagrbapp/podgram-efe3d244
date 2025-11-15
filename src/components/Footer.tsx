import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";
import podgramLogo from "@/assets/podgram-logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={podgramLogo} alt="Podgram" className="h-12 w-12 object-contain" />
              <span className="text-2xl font-bold text-white">Podgram</span>
            </div>
            <p className="text-sm leading-relaxed">
              المنصة الأولى للمنتجات الفاخرة في المنطقة. نجمع بين البائعين والمشترين في سوق آمن وموثوق.
            </p>
            <div className="flex items-center gap-3 pt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-800 hover:bg-qultura-blue flex items-center justify-center transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
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
              <li>
                <Link to="/about" className="hover:text-qultura-blue transition-smooth text-sm">
                  من نحن
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-qultura-blue transition-smooth text-sm">
                  الكتالوج
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-qultura-blue transition-smooth text-sm">
                  المفضلة
                </Link>
              </li>
              <li>
                <Link to="/add-listing" className="hover:text-qultura-blue transition-smooth text-sm">
                  أضف إعلان
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-qultura-blue transition-smooth text-sm">
                  الرسائل
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">الدعم والمساعدة</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="hover:text-qultura-blue transition-smooth text-sm">
                  مركز المساعدة
                </Link>
              </li>
              <li>
                <Link to="/how-to-sell" className="hover:text-qultura-blue transition-smooth text-sm">
                  كيف تبيع؟
                </Link>
              </li>
              <li>
                <Link to="/how-to-buy" className="hover:text-qultura-blue transition-smooth text-sm">
                  كيف تشتري؟
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-qultura-blue transition-smooth text-sm">
                  نصائح الأمان
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-qultura-blue transition-smooth text-sm">
                  اتصل بنا
                </Link>
              </li>
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
                  <a href="tel:+966501234567" className="text-sm hover:text-qultura-blue transition-smooth">
                    +966 50 123 4567
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-qultura-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">البريد الإلكتروني</p>
                  <a href="mailto:info@podgram.com" className="text-sm hover:text-qultura-blue transition-smooth">
                    info@podgram.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-qultura-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">العنوان</p>
                  <p className="text-sm">الرياض، المملكة العربية السعودية</p>
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
              © {currentYear} Podgram. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/privacy" className="hover:text-qultura-blue transition-smooth">
                سياسة الخصوصية
              </Link>
              <Link to="/terms" className="hover:text-qultura-blue transition-smooth">
                الشروط والأحكام
              </Link>
              <Link to="/cookies" className="hover:text-qultura-blue transition-smooth">
                سياسة ملفات تعريف الارتباط
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
