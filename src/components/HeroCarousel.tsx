import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BrandLogos from "./BrandLogos";
import heroGreenBanner from "@/assets/hero-green-banner.jpg";

const slides = [
  {
    id: 1,
    title: "Largest selection of",
    subtitle: "luxury brands",
    description: "أكثر من 249 علامة فاخرة على المنصة",
    bgColor: "from-[hsl(var(--qultura-green))] to-[hsl(159,58%,47%)]",
  },
  {
    id: 2,
    title: "Exclusive collection of",
    subtitle: "designer items",
    description: "مجموعة حصرية من العلامات الفاخرة",
    bgColor: "from-[hsl(var(--qultura-blue))] to-[hsl(219,78%,46%)]",
  },
  {
    id: 3,
    title: "Premium quality",
    subtitle: "authentic luxury",
    description: "جودة ممتازة وأصالة مضمونة",
    bgColor: "from-[hsl(25,95%,58%)] to-[hsl(25,95%,48%)]",
  },
];

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

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
    if (!emblaApi) return;
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(autoplay);
  }, [emblaApi]);

  return (
    <div className="relative overflow-hidden rounded-3xl" ref={emblaRef}>
      <div className="flex">
        {slides.map((slide) => (
          <div key={slide.id} className="flex-[0_0_100%] min-w-0">
            <div className={`relative overflow-hidden h-[500px] bg-gradient-to-br ${slide.bgColor}`}>
              <img
                src={heroGreenBanner}
                alt="Luxury Brands"
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
