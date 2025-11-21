export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          is_repeatable: boolean
          name: string
          requirement_value: number
          reward_points: number
          updated_at: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_repeatable?: boolean
          name: string
          requirement_value?: number
          reward_points?: number
          updated_at?: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_repeatable?: boolean
          name?: string
          requirement_value?: number
          reward_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          button_text: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          priority: number | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          priority?: number | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          priority?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      auction_alerts: {
        Row: {
          alert_type: string
          auction_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_triggered: boolean | null
          target_price: number | null
          time_before_end: number | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          auction_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_triggered?: boolean | null
          target_price?: number | null
          time_before_end?: number | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          auction_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_triggered?: boolean | null
          target_price?: number | null
          time_before_end?: number | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_alerts_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_invitations: {
        Row: {
          auction_id: string
          created_at: string | null
          id: string
          invitee_id: string
          inviter_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          auction_id: string
          created_at?: string | null
          id?: string
          invitee_id: string
          inviter_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          auction_id?: string
          created_at?: string | null
          id?: string
          invitee_id?: string
          inviter_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_invitations_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          bid_increment: number
          category_id: string | null
          created_at: string | null
          current_bid: number | null
          description: string | null
          end_time: string
          highest_bidder_id: string | null
          id: string
          images: string[] | null
          invited_bidders: string[] | null
          is_private: boolean | null
          listing_id: string | null
          reserve_price: number | null
          start_time: string
          starting_price: number
          status: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bid_increment?: number
          category_id?: string | null
          created_at?: string | null
          current_bid?: number | null
          description?: string | null
          end_time: string
          highest_bidder_id?: string | null
          id?: string
          images?: string[] | null
          invited_bidders?: string[] | null
          is_private?: boolean | null
          listing_id?: string | null
          reserve_price?: number | null
          start_time?: string
          starting_price: number
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bid_increment?: number
          category_id?: string | null
          created_at?: string | null
          current_bid?: number | null
          description?: string | null
          end_time?: string
          highest_bidder_id?: string | null
          id?: string
          images?: string[] | null
          invited_bidders?: string[] | null
          is_private?: boolean | null
          listing_id?: string | null
          reserve_price?: number | null
          start_time?: string
          starting_price?: number
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_bids: {
        Row: {
          auction_id: string
          created_at: string | null
          current_proxy_bid: number | null
          id: string
          is_active: boolean | null
          max_bid_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auction_id: string
          created_at?: string | null
          current_proxy_bid?: number | null
          id?: string
          is_active?: boolean | null
          max_bid_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auction_id?: string
          created_at?: string | null
          current_proxy_bid?: number | null
          id?: string
          is_active?: boolean | null
          max_bid_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      bidder_reviews: {
        Row: {
          auction_id: string
          bidder_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          review_type: string
          reviewer_id: string
        }
        Insert: {
          auction_id: string
          bidder_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          review_type: string
          reviewer_id: string
        }
        Update: {
          auction_id?: string
          bidder_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          review_type?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bidder_reviews_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      bidder_stats: {
        Row: {
          avg_rating: number | null
          communication_rating: number | null
          created_at: string | null
          id: string
          payment_speed_rating: number | null
          reliability_score: number | null
          total_bids: number | null
          updated_at: string | null
          user_id: string
          won_auctions: number | null
        }
        Insert: {
          avg_rating?: number | null
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          payment_speed_rating?: number | null
          reliability_score?: number | null
          total_bids?: number | null
          updated_at?: string | null
          user_id: string
          won_auctions?: number | null
        }
        Update: {
          avg_rating?: number | null
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          payment_speed_rating?: number | null
          reliability_score?: number | null
          total_bids?: number | null
          updated_at?: string | null
          user_id?: string
          won_auctions?: number | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          auction_id: string
          bid_amount: number
          created_at: string | null
          id: string
          is_autobid: boolean | null
          user_id: string
        }
        Insert: {
          auction_id: string
          bid_amount: number
          created_at?: string | null
          id?: string
          is_autobid?: boolean | null
          user_id: string
        }
        Update: {
          auction_id?: string
          bid_amount?: number
          created_at?: string | null
          id?: string
          is_autobid?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_by: string | null
          blocked_id: string
          blocker_id: string
          created_at: string
          expires_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          blocked_id: string
          blocker_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      carousel_slides: {
        Row: {
          bg_color: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          is_archived_by_buyer: boolean | null
          is_archived_by_seller: boolean | null
          is_pinned_by_buyer: boolean | null
          is_pinned_by_seller: boolean | null
          listing_id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          is_archived_by_buyer?: boolean | null
          is_archived_by_seller?: boolean | null
          is_pinned_by_buyer?: boolean | null
          is_pinned_by_seller?: boolean | null
          listing_id: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          is_archived_by_buyer?: boolean | null
          is_archived_by_seller?: boolean | null
          is_pinned_by_buyer?: boolean | null
          is_pinned_by_seller?: boolean | null
          listing_id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sales: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          price: number
          sale_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          price: number
          sale_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          price?: number
          sale_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_views: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
          view_date: string
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
          view_date?: string
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
          view_date?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      footer_settings: {
        Row: {
          address: string | null
          brand_description: string
          brand_name: string
          copyright_text: string | null
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_active: boolean
          linkedin_url: string | null
          phone: string | null
          twitter_url: string | null
          updated_at: string | null
          updated_by: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          brand_description?: string
          brand_name?: string
          copyright_text?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          linkedin_url?: string | null
          phone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          brand_description?: string
          brand_name?: string
          copyright_text?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          linkedin_url?: string | null
          phone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      homepage_section_history: {
        Row: {
          background_color: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          items_limit: number | null
          section_id: string
          settings: Json | null
        }
        Insert: {
          background_color?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          items_limit?: number | null
          section_id: string
          settings?: Json | null
        }
        Update: {
          background_color?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          items_limit?: number | null
          section_id?: string
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_section_history_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "homepage_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_sections: {
        Row: {
          background_color: string | null
          display_order: number
          id: string
          is_visible: boolean
          items_limit: number | null
          section_key: string
          section_name: string
          settings: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          background_color?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          items_limit?: number | null
          section_key: string
          section_name: string
          settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          background_color?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          items_limit?: number | null
          section_key?: string
          section_name?: string
          settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          images: string[] | null
          location: string
          phone: string | null
          price: number
          status: string | null
          title: string
          updated_at: string
          user_id: string
          views: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          location: string
          phone?: string | null
          price: number
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
          views?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          location?: string
          phone?: string | null
          price?: number
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          listing_id: string | null
          message: string
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id?: string | null
          message: string
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id?: string | null
          message?: string
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      points_history: {
        Row: {
          created_at: string | null
          id: string
          points: number
          reason: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points: number
          reason: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number
          reason?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          listing_id: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string | null
          rating: number
          replied_at: string | null
          reviewer_id: string
          seller_id: string
          seller_reply: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating: number
          replied_at?: string | null
          reviewer_id: string
          seller_id: string
          seller_reply?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating?: number
          replied_at?: string | null
          reviewer_id?: string
          seller_id?: string
          seller_reply?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      test_bidder_stats: {
        Row: {
          created_at: string | null
          id: string
          total_bids: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          total_bids?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          total_bids?: number | null
          user_id?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          accent_hue: number
          accent_lightness: number
          accent_saturation: number
          background_hue: number
          background_lightness: number
          background_saturation: number
          border_hue: number
          border_lightness: number
          border_saturation: number
          card_hue: number
          card_lightness: number
          card_saturation: number
          destructive_hue: number
          destructive_lightness: number
          destructive_saturation: number
          foreground_hue: number
          foreground_lightness: number
          foreground_saturation: number
          id: string
          is_active: boolean
          muted_hue: number
          muted_lightness: number
          muted_saturation: number
          primary_hue: number
          primary_lightness: number
          primary_saturation: number
          secondary_hue: number
          secondary_lightness: number
          secondary_saturation: number
          theme_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          accent_hue?: number
          accent_lightness?: number
          accent_saturation?: number
          background_hue?: number
          background_lightness?: number
          background_saturation?: number
          border_hue?: number
          border_lightness?: number
          border_saturation?: number
          card_hue?: number
          card_lightness?: number
          card_saturation?: number
          destructive_hue?: number
          destructive_lightness?: number
          destructive_saturation?: number
          foreground_hue?: number
          foreground_lightness?: number
          foreground_saturation?: number
          id?: string
          is_active?: boolean
          muted_hue?: number
          muted_lightness?: number
          muted_saturation?: number
          primary_hue?: number
          primary_lightness?: number
          primary_saturation?: number
          secondary_hue?: number
          secondary_lightness?: number
          secondary_saturation?: number
          theme_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          accent_hue?: number
          accent_lightness?: number
          accent_saturation?: number
          background_hue?: number
          background_lightness?: number
          background_saturation?: number
          border_hue?: number
          border_lightness?: number
          border_saturation?: number
          card_hue?: number
          card_lightness?: number
          card_saturation?: number
          destructive_hue?: number
          destructive_lightness?: number
          destructive_saturation?: number
          foreground_hue?: number
          foreground_lightness?: number
          foreground_saturation?: number
          id?: string
          is_active?: boolean
          muted_hue?: number
          muted_lightness?: number
          muted_saturation?: number
          primary_hue?: number
          primary_lightness?: number
          primary_saturation?: number
          secondary_hue?: number
          secondary_lightness?: number
          secondary_saturation?: number
          theme_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      top_bar_settings: {
        Row: {
          background_color: string | null
          cta_link: string
          cta_text: string
          delivery_text: string
          id: string
          is_active: boolean
          phone_number: string | null
          text_color: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          working_hours: string
        }
        Insert: {
          background_color?: string | null
          cta_link?: string
          cta_text?: string
          delivery_text?: string
          id?: string
          is_active?: boolean
          phone_number?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          working_hours?: string
        }
        Update: {
          background_color?: string | null
          cta_link?: string
          cta_text?: string
          delivery_text?: string
          id?: string
          is_active?: boolean
          phone_number?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          working_hours?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          times_earned: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          times_earned?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          times_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_auction_invitation: {
        Args: { _invitation_id: string }
        Returns: Json
      }
      add_points: {
        Args: {
          _points: number
          _reason: string
          _reference_id?: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_block_user: {
        Args: {
          _admin_id: string
          _duration_days?: number
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_delete_listing: {
        Args: { _admin_id: string; _listing_id: string; _reason: string }
        Returns: undefined
      }
      admin_unblock_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: undefined
      }
      approve_user: {
        Args: { _admin_id: string; _approve: boolean; _user_id: string }
        Returns: Json
      }
      calculate_auction_stats: {
        Args: { _days?: number; _user_id: string }
        Returns: Json
      }
      calculate_avg_response_time: {
        Args: { seller_uuid: string }
        Returns: number
      }
      calculate_completion_rate: {
        Args: { seller_uuid: string }
        Returns: number
      }
      calculate_response_rate: {
        Args: { seller_uuid: string }
        Returns: number
      }
      check_and_award_achievements: {
        Args: { _user_id: string }
        Returns: undefined
      }
      check_and_award_badges: { Args: { _user_id: string }; Returns: undefined }
      check_auction_alerts: { Args: never; Returns: undefined }
      decline_auction_invitation: {
        Args: { _invitation_id: string }
        Returns: Json
      }
      end_expired_auctions: { Args: never; Returns: undefined }
      get_admin_users_overview: {
        Args: never
        Returns: {
          avatar_url: string
          avg_rating: number
          created_at: string
          full_name: string
          id: string
          is_blocked: boolean
          level: number
          phone: string
          points: number
          reports_count: number
          total_listings: number
          total_reviews: number
          total_sales: number
        }[]
      }
      get_auction_timeline_data: {
        Args: { _days?: number; _user_id: string }
        Returns: {
          auctions_count: number
          bids_count: number
          date: string
          revenue: number
        }[]
      }
      get_revenue_by_period: {
        Args: { end_date: string; seller_uuid: string; start_date: string }
        Returns: {
          date: string
          revenue: number
        }[]
      }
      get_total_sales: { Args: { seller_uuid: string }; Returns: number }
      get_views_by_period: {
        Args: { end_date: string; seller_uuid: string; start_date: string }
        Returns: {
          date: string
          total_views: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_bid: {
        Args: { _auction_id: string; _bid_amount: number; _user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
