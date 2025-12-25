import { ExternalLink, Sparkles } from "lucide-react";
import bannerBg from "@/assets/ufq1-banner-bg.jpg";

const PromotionalBanners = () => {
  return (
    <a 
      href="https://www.ufq1.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className="block"
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl group cursor-pointer shadow-elegant hover:shadow-2xl transition-all duration-500">
        {/* Background Image */}
        <img 
          src={bannerBg} 
          alt="ufq1 promotional banner"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/20 to-transparent" />
        
        {/* Animated Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        
        {/* Content */}
        <div className="relative px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6" dir="rtl">
          {/* Logo & Text Content */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Logo */}
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-300">
              <img 
                src="https://www.ufq1.com/wp-content/uploads/2023/09/cropped-Artboard-1-copy.png" 
                alt="UFQ1 Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<span class="text-2xl font-bold text-teal-600">UFQ1</span>';
                }}
              />
            </div>
            
            {/* Text Content */}
            <div className="text-center sm:text-right space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-white/90 text-sm font-medium">اكتشف عالم التسوق</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                تسوق الآن من <span className="text-amber-400">ufq1.com</span>
              </h3>
              <p className="text-white/80 text-sm sm:text-base max-w-md">
                أفضل المنتجات والعروض الحصرية في مكان واحد
              </p>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-amber-400 text-teal-900 rounded-xl font-bold text-sm sm:text-base group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
              <span>زيارة الموقع</span>
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

export default PromotionalBanners;
