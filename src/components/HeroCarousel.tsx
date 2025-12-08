import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play, UserPlus, Gavel } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogos from "./BrandLogos";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroGreenBanner from "@/assets/hero-green-banner.jpg";

interface StatItem {
  value: string;
  label: string;
}

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  bg_color: string;
  display_order: number;
  badge_text: string | null;
  cta_primary_text: string | null;
  cta_primary_link: string | null;
  cta_secondary_text: string | null;
  cta_secondary_link: string | null;
  stats: unknown;
}

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["carousel-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carousel_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as CarouselSlide[];
    },
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi || !isAutoplayActive || isHovered) return;
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(autoplay);
  }, [emblaApi, isAutoplayActive, isHovered]);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayActive((prev) => !prev);
  }, []);

  const parseStats = (stats: unknown): StatItem[] => {
    if (!stats) return [];
    if (Array.isArray(stats)) return stats as StatItem[];
    if (typeof stats === 'string') {
      try {
        return JSON.parse(stats);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Convert Tailwind gradient class to CSS style
  const getBackgroundStyle = (bgColor: string): React.CSSProperties => {
    const gradientMap: Record<string, string> = {
      // Primary colors
      'from-primary to-primary/70': 'linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
      // Emerald/Teal
      'from-emerald-500 to-teal-600': 'linear-gradient(to bottom right, #10b981, #0d9488)',
      'from-cyan-500 to-teal-600': 'linear-gradient(to bottom right, #06b6d4, #0d9488)',
      'from-teal-500 to-emerald-600': 'linear-gradient(to bottom right, #14b8a6, #059669)',
      // Blue
      'from-blue-500 to-indigo-600': 'linear-gradient(to bottom right, #3b82f6, #4f46e5)',
      'from-blue-600 to-blue-800': 'linear-gradient(to bottom right, #2563eb, #1e40af)',
      'from-blue-500 to-blue-700': 'linear-gradient(to bottom right, #3b82f6, #1d4ed8)',
      'from-cyan-500 to-blue-600': 'linear-gradient(to bottom right, #06b6d4, #2563eb)',
      'from-indigo-500 to-blue-600': 'linear-gradient(to bottom right, #6366f1, #2563eb)',
      // Purple/Pink
      'from-purple-500 to-pink-600': 'linear-gradient(to bottom right, #a855f7, #db2777)',
      'from-violet-500 to-purple-600': 'linear-gradient(to bottom right, #8b5cf6, #9333ea)',
      'from-fuchsia-500 to-purple-600': 'linear-gradient(to bottom right, #d946ef, #9333ea)',
      // Orange/Amber
      'from-amber-500 to-orange-600': 'linear-gradient(to bottom right, #f59e0b, #ea580c)',
      'from-orange-500 to-red-600': 'linear-gradient(to bottom right, #f97316, #dc2626)',
      // Red/Rose
      'from-rose-500 to-red-600': 'linear-gradient(to bottom right, #f43f5e, #dc2626)',
      'from-red-500 to-rose-600': 'linear-gradient(to bottom right, #ef4444, #e11d48)',
      // Green
      'from-green-500 to-emerald-600': 'linear-gradient(to bottom right, #22c55e, #059669)',
      'from-green-600 to-green-800': 'linear-gradient(to bottom right, #16a34a, #166534)',
      // Dark
      'from-slate-700 to-slate-900': 'linear-gradient(to bottom right, #334155, #0f172a)',
      'from-zinc-700 to-zinc-900': 'linear-gradient(to bottom right, #3f3f46, #18181b)',
      'from-gray-700 to-gray-900': 'linear-gradient(to bottom right, #374151, #111827)',
    };
    
    // Check if exact match exists
    if (gradientMap[bgColor]) {
      return { background: gradientMap[bgColor] };
    }
    
    // Parse Tailwind gradient format dynamically
    const fromMatch = bgColor.match(/from-([a-z]+)-(\d+)/);
    const toMatch = bgColor.match(/to-([a-z]+)-(\d+)/);
    
    if (fromMatch && toMatch) {
      const tailwindColors: Record<string, Record<string, string>> = {
        cyan: { '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490' },
        teal: { '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e' },
        blue: { '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af' },
        indigo: { '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca' },
        purple: { '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce' },
        pink: { '500': '#ec4899', '600': '#db2777', '700': '#be185d' },
        emerald: { '500': '#10b981', '600': '#059669', '700': '#047857' },
        green: { '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534' },
        amber: { '500': '#f59e0b', '600': '#d97706', '700': '#b45309' },
        orange: { '500': '#f97316', '600': '#ea580c', '700': '#c2410c' },
        red: { '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c' },
        rose: { '500': '#f43f5e', '600': '#e11d48', '700': '#be123c' },
        violet: { '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9' },
        fuchsia: { '500': '#d946ef', '600': '#c026d3', '700': '#a21caf' },
        slate: { '700': '#334155', '800': '#1e293b', '900': '#0f172a' },
        zinc: { '700': '#3f3f46', '800': '#27272a', '900': '#18181b' },
        gray: { '700': '#374151', '800': '#1f2937', '900': '#111827' },
      };
      
      const fromColor = tailwindColors[fromMatch[1]]?.[fromMatch[2]];
      const toColor = tailwindColors[toMatch[1]]?.[toMatch[2]];
      
      if (fromColor && toColor) {
        return { background: `linear-gradient(to bottom right, ${fromColor}, ${toColor})` };
      }
    }
    
    // Default fallback
    return { background: 'linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary) / 0.7))' };
  };

  if (isLoading || slides.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl h-[550px] bg-gradient-to-br from-primary to-primary/70 animate-pulse">
        <div className="flex items-center justify-center h-full">
          <p className="text-primary-foreground text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative overflow-hidden rounded-3xl shadow-2xl" 
      ref={emblaRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex">
        {slides.map((slide) => {
          const stats = parseStats(slide.stats);
          
          return (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0">
              <div 
                className="relative overflow-hidden h-[550px]"
                style={getBackgroundStyle(slide.bg_color)}
              >
                {/* Background Image with Overlay */}
                <img
                  src={slide.image_url || heroGreenBanner}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
                  {/* Badge */}
                  {slide.badge_text && (
                    <div className="mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      <span className="text-white text-sm font-medium">{slide.badge_text}</span>
                    </div>
                  )}
                  
                  {slide.description && (
                    <p className="text-xl text-white/95 mb-4 max-w-2xl">{slide.description}</p>
                  )}
                  
                  <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                    {slide.title}
                  </h2>
                  
                  {slide.subtitle && (
                    <p className="text-2xl md:text-3xl text-white/90 mb-8 font-light">
                      {slide.subtitle}
                    </p>
                  )}
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-4 justify-center mb-8">
                    {slide.cta_primary_text && slide.cta_primary_link && (
                      <Link to={slide.cta_primary_link}>
                        <Button 
                          size="lg" 
                          className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                        >
                          <UserPlus className="ml-2 h-5 w-5" />
                          {slide.cta_primary_text}
                        </Button>
                      </Link>
                    )}
                    {slide.cta_secondary_text && slide.cta_secondary_link && (
                      <Link to={slide.cta_secondary_link}>
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="border-2 border-white text-white hover:bg-white/20 font-bold px-8 py-6 text-lg rounded-full backdrop-blur-sm transition-all hover:scale-105"
                        >
                          <Gavel className="ml-2 h-5 w-5" />
                          {slide.cta_secondary_text}
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  {/* Stats */}
                  {stats.length > 0 && (
                    <div className="flex flex-wrap gap-8 justify-center text-white/90">
                      {stats.map((stat, index) => (
                        <div key={index} className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-3xl font-bold">{stat.value}</p>
                            <p className="text-sm opacity-80">{stat.label}</p>
                          </div>
                          {index < stats.length - 1 && (
                            <div className="w-px h-12 bg-white/30 hidden sm:block" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <BrandLogos />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>

      {/* Autoplay Control Button */}
      <button
        onClick={toggleAutoplay}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-20"
        aria-label={isAutoplayActive ? "إيقاف الانتقال التلقائي" : "تشغيل الانتقال التلقائي"}
      >
        {isAutoplayActive ? (
          <Pause className="w-5 h-5 text-foreground" />
        ) : (
          <Play className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex ? "bg-white w-8" : "bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
