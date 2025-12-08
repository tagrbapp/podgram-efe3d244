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
  title_color: string | null;
  subtitle_color: string | null;
  description_color: string | null;
  floating_image_url: string | null;
  show_floating_card: boolean | null;
  cta_primary_bg_color: string | null;
  cta_primary_text_color: string | null;
  cta_secondary_bg_color: string | null;
  cta_secondary_text_color: string | null;
  cta_secondary_border_color: string | null;
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
    // Handle primary color gradients
    if (bgColor.includes('primary')) {
      return { 
        background: 'linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--primary) / 0.7))' 
      };
    }
    
    // Tailwind color palette
    const tailwindColors: Record<string, Record<string, string>> = {
      cyan: { '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490' },
      teal: { '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e' },
      blue: { '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af' },
      indigo: { '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca' },
      purple: { '400': '#c084fc', '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce' },
      pink: { '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d' },
      emerald: { '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857' },
      green: { '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534' },
      amber: { '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309' },
      orange: { '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c' },
      red: { '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c' },
      rose: { '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c' },
      violet: { '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9' },
      fuchsia: { '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf' },
      slate: { '600': '#475569', '700': '#334155', '800': '#1e293b', '900': '#0f172a' },
      zinc: { '600': '#52525b', '700': '#3f3f46', '800': '#27272a', '900': '#18181b' },
      gray: { '600': '#4b5563', '700': '#374151', '800': '#1f2937', '900': '#111827' },
    };
    
    // Parse Tailwind gradient format dynamically
    const fromMatch = bgColor.match(/from-([a-z]+)-(\d+)/);
    const toMatch = bgColor.match(/to-([a-z]+)-(\d+)/);
    
    if (fromMatch && toMatch) {
      const fromColor = tailwindColors[fromMatch[1]]?.[fromMatch[2]];
      const toColor = tailwindColors[toMatch[1]]?.[toMatch[2]];
      
      if (fromColor && toColor) {
        return { background: `linear-gradient(to bottom right, ${fromColor}, ${toColor})` };
      }
    }
    
    // Default fallback - use a visible gradient
    return { background: 'linear-gradient(to bottom right, #0d9488, #0891b2)' };
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
          const titleColor = slide.title_color || '#ffffff';
          const subtitleColor = slide.subtitle_color || '#06b6d4';
          const descriptionColor = slide.description_color || '#ffffff';
          
          return (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0">
              <div 
                className="relative overflow-hidden h-[550px]"
                style={getBackgroundStyle(slide.bg_color)}
              >
                {/* Background Image with Overlay - only show if image_url exists */}
                {slide.image_url && (
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
                
                {/* Floating Card */}
                {slide.show_floating_card && slide.floating_image_url && (
                  <div className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-20 hidden md:block">
                    <div className="bg-white rounded-2xl shadow-2xl p-4 animate-fade-in">
                      <img
                        src={slide.floating_image_url}
                        alt="Featured"
                        className="max-h-[350px] w-auto rounded-xl"
                      />
                    </div>
                  </div>
                )}
                
                {/* Content */}
                <div className={`relative z-10 flex flex-col ${slide.show_floating_card ? 'items-end pr-8 md:pr-16' : 'items-center'} justify-center h-full text-${slide.show_floating_card ? 'right' : 'center'} px-8 animate-fade-in`}>
                  {/* Badge */}
                  {slide.badge_text && (
                    <div className="mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      <span className="text-white text-sm font-medium">{slide.badge_text}</span>
                    </div>
                  )}
                  
                  <h2 
                    className="text-4xl md:text-6xl font-bold mb-2 leading-tight drop-shadow-lg"
                    style={{ color: titleColor }}
                  >
                    {slide.title}
                  </h2>
                  
                  {slide.subtitle && (
                    <p 
                      className="text-2xl md:text-4xl font-bold mb-4"
                      style={{ color: subtitleColor }}
                    >
                      {slide.subtitle}
                    </p>
                  )}
                  
                  {slide.description && (
                    <p 
                      className="text-lg mb-6 max-w-2xl"
                      style={{ color: descriptionColor }}
                    >
                      {slide.description}
                    </p>
                  )}
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-4 justify-center mb-8">
                    {slide.cta_secondary_text && slide.cta_secondary_link && (
                      <Link to={slide.cta_secondary_link}>
                        <button 
                          className="font-bold px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-2"
                          style={{
                            backgroundColor: slide.cta_secondary_bg_color === 'transparent' ? 'transparent' : (slide.cta_secondary_bg_color || 'transparent'),
                            color: slide.cta_secondary_text_color || '#1a1a1a',
                            borderColor: slide.cta_secondary_border_color || '#1a1a1a'
                          }}
                        >
                          {slide.cta_secondary_text}
                        </button>
                      </Link>
                    )}
                    {slide.cta_primary_text && slide.cta_primary_link && (
                      <Link to={slide.cta_primary_link}>
                        <button 
                          className="font-bold px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                          style={{
                            backgroundColor: slide.cta_primary_bg_color || '#0891b2',
                            color: slide.cta_primary_text_color || '#ffffff'
                          }}
                        >
                          {slide.cta_primary_text}
                        </button>
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
