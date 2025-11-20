import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuctionRealtime = (auctionId: string, onUpdate: () => void) => {
  useEffect(() => {
    if (!auctionId) return;

    // Subscribe to new bids
    const bidsChannel = supabase
      .channel(`auction-bids-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          toast.success("تم إضافة مزايدة جديدة! 🎉", {
            description: "تم تحديث المزاد",
          });
          onUpdate();
        }
      )
      .subscribe();

    // Subscribe to auction updates
    const auctionChannel = supabase
      .channel(`auction-${auctionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(auctionChannel);
    };
  }, [auctionId, onUpdate]);
};
