import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListingCard from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Phone, Calendar, MapPin } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  created_at: string;
  images: string[] | null;
  categories: {
    name: string;
  } | null;
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchListings();
    }
  }, [id]);

  const fetchProfile = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast.error("فشل في جلب بيانات المستخدم");
      navigate("/");
      return;
    }

    setProfile(data);
  };

  const fetchListings = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        location,
        created_at,
        images,
        categories (
          name
        )
      `)
      .eq("user_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("فشل في جلب الإعلانات");
      setIsLoading(false);
      return;
    }

    setListings(data || []);
    setIsLoading(false);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else if (diffInDays < 30) {
      return `منذ ${diffInDays} يوم`;
    } else {
      return date.toLocaleDateString("ar-SA");
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg">جاري التحميل...</p>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg">المستخدم غير موجود</p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-right space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    عضو
                  </span>
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    انضم {getTimeAgo(profile.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 justify-center md:justify-start">
                <Badge variant="secondary" className="text-lg py-2 px-4">
                  <MapPin className="h-4 w-4 ml-1" />
                  {listings.length} إعلان نشط
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Listings Section */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="active" className="flex-1 md:flex-none">
              الإعلانات النشطة ({listings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {listings.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">لا توجد إعلانات نشطة</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    price={listing.price.toString()}
                    location={listing.location}
                    image={listing.images?.[0] || "/placeholder.svg"}
                    category={listing.categories?.name || "غير مصنف"}
                    time={getTimeAgo(listing.created_at)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
