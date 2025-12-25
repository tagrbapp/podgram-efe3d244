import { ExternalLink, Sparkles } from "lucide-react";

const PromotionalBanners = () => {
  return (
    <a 
      href="https://www.ufq1.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className="block"
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-l from-primary via-primary/90 to-secondary group cursor-pointer shadow-elegant hover:shadow-2xl transition-all duration-500">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--primary-foreground)) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        {/* Animated Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-foreground/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        
        {/* Content */}
        <div className="relative px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6" dir="rtl">
          {/* Text Content */}
          <div className="text-center sm:text-right space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Sparkles className="w-5 h-5 text-primary-foreground animate-pulse" />
              <span className="text-primary-foreground/80 text-sm font-medium">اكتشف عالم التسوق</span>
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground">
              تسوق الآن من <span className="text-secondary-foreground">ufq1.com</span>
            </h3>
            <p className="text-primary-foreground/80 text-sm sm:text-base max-w-md">
              أفضل المنتجات والعروض الحصرية في مكان واحد
            </p>
          </div>
          
          {/* CTA Button */}
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary-foreground text-primary rounded-xl font-bold text-sm sm:text-base group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
              <span>زيارة الموقع</span>
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </a>
  );
};

export default PromotionalBanners;
