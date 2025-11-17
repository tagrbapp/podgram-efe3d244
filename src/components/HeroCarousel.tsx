import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import BrandLogos from "./BrandLogos";
import { supabase } from "@/integrations/supabase/client";
import heroGreenBanner from "@/assets/hero-green-banner.jpg";

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  bg_color: string;
  display_order: number;
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

  if (isLoading || slides.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl h-[500px] bg-gradient-to-br from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)] animate-pulse">
        <div className="flex items-center justify-center h-full">
          <p className="text-white text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative overflow-hidden rounded-3xl" 
      ref={emblaRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex">
        {slides.map((slide) => (
          <div key={slide.id} className="flex-[0_0_100%] min-w-0">
            <div className={`relative overflow-hidden h-[500px] bg-gradient-to-br ${slide.bg_color}`}>
              <img
                src={slide.image_url || heroGreenBanner}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover opacity-10"
              />
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
                <p className="text-lg text-white/90 mb-4">{slide.description}</p>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                  {slide.title}
                  <br />
                  <span className="text-white/80">{slide.subtitle}</span>
                </h2>
                <div className="mt-8">
                  <BrandLogos />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>

      {/* Autoplay Control Button */}
      <button
        onClick={toggleAutoplay}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all hover:scale-110 z-20"
        aria-label={isAutoplayActive ? "إيقاف الانتقال التلقائي" : "تشغيل الانتقال التلقائي"}
      >
        {isAutoplayActive ? (
          <Pause className="w-5 h-5 text-gray-800" />
        ) : (
          <Play className="w-5 h-5 text-gray-800" />
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
