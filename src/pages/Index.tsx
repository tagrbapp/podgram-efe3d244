import Navbar from "@/components/Navbar";
import CategoryCard from "@/components/CategoryCard";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Home, Smartphone, Shirt, Sofa, Briefcase, Search } from "lucide-react";

const Index = () => {
  const categories = [
    { icon: Car, title: "سيارات", count: 245 },
    { icon: Home, title: "عقارات", count: 189 },
    { icon: Smartphone, title: "إلكترونيات", count: 567 },
    { icon: Shirt, title: "أزياء", count: 432 },
    { icon: Sofa, title: "أثاث", count: 198 },
    { icon: Briefcase, title: "وظائف", count: 321 },
  ];

  const listings = [
    {
      title: "سيارة تويوتا كامري 2020 فل كامل",
      price: "75,000",
      location: "الرياض",
      time: "منذ ساعة",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400",
      category: "سيارات"
    },
    {
      title: "شقة للإيجار 3 غرف وصالة",
      price: "2,500",
      location: "جدة",
      time: "منذ ساعتين",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
      category: "عقارات"
    },
    {
      title: "آيفون 14 برو ماكس حالة ممتازة",
      price: "4,200",
      location: "الدمام",
      time: "منذ 3 ساعات",
      image: "https://images.unsplash.com/photo-1592286927505-c636729cc21f?w=400",
      category: "إلكترونيات"
    },
    {
      title: "طقم كنب جديد لم يستخدم",
      price: "3,800",
      location: "مكة",
      time: "منذ 4 ساعات",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
      category: "أثاث"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              اعثر على ما تبحث عنه
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              آلاف الإعلانات المبوبة في انتظارك. اشتري، بع، أو أجر بكل سهولة
            </p>
            
            {/* Search Bar */}
            <div className="flex gap-2 max-w-2xl mx-auto shadow-elegant rounded-lg overflow-hidden bg-card p-2">
              <Input 
                placeholder="ابحث عن أي شيء..."
                className="flex-1 border-0 bg-transparent text-right focus-visible:ring-0"
              />
              <Button className="gap-2 bg-gradient-primary hover:opacity-90 transition-smooth">
                <Search className="h-4 w-4" />
                بحث
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">التصنيفات الرئيسية</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <CategoryCard key={index} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">أحدث الإعلانات</h2>
            <Button variant="outline">عرض الكل</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing, index) => (
              <ListingCard key={index} {...listing} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">إعلاناتي</h3>
              <p className="text-muted-foreground text-sm">
                منصتك الموثوقة للإعلانات المبوبة في المملكة
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">من نحن</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">اتصل بنا</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">الشروط والأحكام</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">التصنيفات</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">سيارات</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">عقارات</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">إلكترونيات</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">تابعنا</h4>
              <p className="text-muted-foreground text-sm">
                ابق على تواصل معنا عبر منصات التواصل الاجتماعي
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 إعلاناتي. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
