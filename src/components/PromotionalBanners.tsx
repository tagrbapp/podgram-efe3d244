import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PromotionalBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: number;
  is_active: boolean;
}

const PromotionalBanners = () => {
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["promotional-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotional_banners")
        .select("*")
        .eq("is_active", true)
        .order("position");

      if (error) throw error;
      return data as PromotionalBanner[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <Skeleton className="h-48 lg:h-full rounded-2xl" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const mainBanners = banners.filter(b => b.position <= 3);
  const sideBanner = banners.find(b => b.position === 4);

  const BannerCard = ({ banner, className = "" }: { banner: PromotionalBanner; className?: string }) => {
    const content = (
      <div 
        className={`relative overflow-hidden rounded-2xl group cursor-pointer ${className}`}
      >
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-bold text-lg drop-shadow-lg">{banner.title}</h3>
        </div>

        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/30 to-transparent transform rotate-45 translate-x-8 -translate-y-8" />
        </div>
      </div>
    );

    if (banner.link_url) {
      return (
        <Link to={banner.link_url} className="block">
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" dir="rtl">
      {/* Main 3 Banners */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        {mainBanners.map((banner) => (
          <BannerCard 
            key={banner.id} 
            banner={banner} 
            className="h-48 md:h-56"
          />
        ))}
      </div>

      {/* Side Banner */}
      {sideBanner && (
        <div className="lg:row-span-1">
          <BannerCard 
            banner={sideBanner} 
            className="h-48 lg:h-56"
          />
        </div>
      )}
    </div>
  );
};

export default PromotionalBanners;
