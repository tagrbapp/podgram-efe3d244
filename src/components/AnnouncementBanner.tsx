import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { Link } from "react-router-dom";

interface Announcement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  button_text: string | null;
}

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("dismissed_announcements");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, description, image_url, link_url, button_text")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      
      // Filter out dismissed announcements
      const visibleAnnouncements = (data || []).filter(
        (announcement) => !dismissedIds.includes(announcement.id)
      );
      
      setAnnouncements(visibleAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const handleDismiss = (id: string) => {
    const newDismissedIds = [...dismissedIds, id];
    setDismissedIds(newDismissedIds);
    localStorage.setItem("dismissed_announcements", JSON.stringify(newDismissedIds));
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  if (announcements.length === 0) return null;

  return (
    <div className="w-full space-y-4 mb-6">
      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
        >
          <button
            onClick={() => handleDismiss(announcement.id)}
            className="absolute top-4 left-4 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col md:flex-row items-center gap-4 p-6">
            {announcement.image_url && (
              <img
                src={announcement.image_url}
                alt={announcement.title}
                className="w-full md:w-48 h-32 object-cover rounded-lg"
              />
            )}

            <div className="flex-1 text-center md:text-right">
              <h3 className="text-xl font-bold mb-2 text-primary">
                {announcement.title}
              </h3>
              {announcement.description && (
                <p className="text-muted-foreground mb-4">
                  {announcement.description}
                </p>
              )}

              {announcement.link_url && (
                <Button asChild variant="default" className="group">
                  <Link to={announcement.link_url}>
                    {announcement.button_text || "اعرف المزيد"}
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
