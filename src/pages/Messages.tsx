import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { getSession, onAuthStateChange } from "@/lib/auth";
import { toast } from "sonner";
import { MessageCircle, Send, User, Search, MoreVertical, Image as ImageIcon, Paperclip, Smile, Check, CheckCheck, Pin, Archive, ArchiveRestore } from "lucide-react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  is_pinned_by_buyer: boolean;
  is_pinned_by_seller: boolean;
  is_archived_by_buyer: boolean;
  is_archived_by_seller: boolean;
  listings: {
    title: string;
    images: string[] | null;
  };
  buyer_profile: {
    full_name: string;
    avatar_url: string | null;
  };
  seller_profile: {
    full_name: string;
    avatar_url: string | null;
  };
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const subscription = onAuthStateChange((session, user) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadConversations(user.id);
      }
    });

    getSession().then(({ session, user }) => {
      setSession(session);
      setUser(user);
      
      if (!session || !user) {
        navigate("/auth");
      } else {
        loadConversations(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
      scrollToBottom();
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation || !user) return;

    // Subscribe to realtime messages and typing status
    const messagesChannel = supabase
      .channel(`conversation:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Mark as read if not sent by current user
          if (newMsg.sender_id !== user?.id) {
            markMessagesAsRead(selectedConversation.id);
          }
          
          // Clear typing indicator when message is sent
          setIsOtherUserTyping(false);
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = messagesChannel.presenceState();
        // Check if other user is typing
        const otherUserId = user.id === selectedConversation.buyer_id 
          ? selectedConversation.seller_id 
          : selectedConversation.buyer_id;
        
        const otherUserPresence = state[otherUserId] as any;
        
        if (otherUserPresence && otherUserPresence.length > 0) {
          const isTyping = otherUserPresence[0]?.typing === true;
          setIsOtherUserTyping(isTyping);
        } else {
          setIsOtherUserTyping(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial presence
          await messagesChannel.track({
            user_id: user.id,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(messagesChannel);

    return () => {
      messagesChannel.unsubscribe();
      setIsOtherUserTyping(false);
    };
  }, [selectedConversation, user]);

  const loadConversations = async (userId: string) => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        created_at,
        updated_at,
        is_pinned_by_buyer,
        is_pinned_by_seller,
        is_archived_by_buyer,
        is_archived_by_seller,
        listings (
          title,
          images
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("خطأ في جلب المحادثات");
      setIsLoading(false);
      return;
    }

    // Get profiles and last messages for each conversation
    const conversationsWithDetails = await Promise.all(
      (data || []).map(async (conv) => {
        // Get buyer profile
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", conv.buyer_id)
          .single();

        // Get seller profile
        const { data: sellerProfile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", conv.seller_id)
          .single();

        // Get unread count
        const { count } = await supabase
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          buyer_profile: buyerProfile || { full_name: "مستخدم", avatar_url: null },
          seller_profile: sellerProfile || { full_name: "مستخدم", avatar_url: null },
          unread_count: count || 0,
          last_message: lastMsg,
        };
      })
    );

    setConversations(conversationsWithDetails);
    setIsLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("خطأ في جلب الرسائل");
      return;
    }

    setMessages(data || []);
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    // Update unread count locally
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  };

  const handleTyping = async () => {
    if (!channel || !user) return;

    // Send typing indicator
    await channel.track({
      user_id: user.id,
      typing: true,
      online_at: new Date().toISOString(),
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      await channel.track({
        user_id: user.id,
        typing: false,
        online_at: new Date().toISOString(),
      });
    }, 3000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    // Stop typing indicator immediately
    if (channel) {
      await channel.track({
        user_id: user.id,
        typing: false,
        online_at: new Date().toISOString(),
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

    if (error) {
      toast.error("خطأ في إرسال الرسالة");
      return;
    }

    // Update conversation updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", selectedConversation.id);

    setNewMessage("");
  };

  const getOtherUserProfile = (conv: Conversation) => {
    return user?.id === conv.buyer_id ? conv.seller_profile : conv.buyer_profile;
  };

  const togglePin = async (conversationId: string) => {
    if (!user) return;
    
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    
    const isBuyer = user.id === conv.buyer_id;
    const currentPinStatus = isBuyer ? conv.is_pinned_by_buyer : conv.is_pinned_by_seller;
    
    const { error } = await supabase
      .from("conversations")
      .update({
        [isBuyer ? 'is_pinned_by_buyer' : 'is_pinned_by_seller']: !currentPinStatus
      })
      .eq("id", conversationId);
    
    if (error) {
      toast.error("خطأ في تثبيت المحادثة");
      return;
    }
    
    setConversations(prev => 
      prev.map(c => 
        c.id === conversationId 
          ? { ...c, [isBuyer ? 'is_pinned_by_buyer' : 'is_pinned_by_seller']: !currentPinStatus }
          : c
      )
    );
    
    toast.success(currentPinStatus ? "تم إلغاء التثبيت" : "تم التثبيت");
  };

  const toggleArchive = async (conversationId: string) => {
    if (!user) return;
    
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    
    const isBuyer = user.id === conv.buyer_id;
    const currentArchiveStatus = isBuyer ? conv.is_archived_by_buyer : conv.is_archived_by_seller;
    
    const { error } = await supabase
      .from("conversations")
      .update({
        [isBuyer ? 'is_archived_by_buyer' : 'is_archived_by_seller']: !currentArchiveStatus
      })
      .eq("id", conversationId);
    
    if (error) {
      toast.error("خطأ في أرشفة المحادثة");
      return;
    }
    
    setConversations(prev => 
      prev.map(c => 
        c.id === conversationId 
          ? { ...c, [isBuyer ? 'is_archived_by_buyer' : 'is_archived_by_seller']: !currentArchiveStatus }
          : c
      )
    );
    
    toast.success(currentArchiveStatus ? "تم إلغاء الأرشفة" : "تم الأرشفة");
    
    if (!currentArchiveStatus) {
      setSelectedConversation(null);
    }
  };

  const isPinned = (conv: Conversation) => {
    if (!user) return false;
    return user.id === conv.buyer_id ? conv.is_pinned_by_buyer : conv.is_pinned_by_seller;
  };

  const isArchived = (conv: Conversation) => {
    if (!user) return false;
    return user.id === conv.buyer_id ? conv.is_archived_by_buyer : conv.is_archived_by_seller;
  };

  const filteredConversations = conversations
    .filter(conv => {
      // Filter by archive status
      if (isArchived(conv) !== showArchived) return false;
      
      // Filter by search query
      if (!searchQuery) return true;
      const otherUser = getOtherUserProfile(conv);
      return otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             conv.listings.title.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sort pinned conversations first
      const aPinned = isPinned(a);
      const bPinned = isPinned(b);
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // Then sort by updated_at
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <div className="flex-1 order-2">
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-fade-in text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-foreground font-medium">جاري تحميل المحادثات...</p>
              </div>
            </div>
          </div>
          <div className="order-1">
            <AppSidebar />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <div className="flex-1 order-2">
          <header className="h-20 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 flex items-center px-6 shadow-sm">
            <div className="flex items-center gap-4 animate-fade-in">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                  <MessageCircle className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">الرسائل</h1>
                  <p className="text-sm text-muted-foreground">تواصل مع المشترين والبائعين</p>
                </div>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6 animate-fade-in">
            <div className="grid lg:grid-cols-12 gap-4 md:gap-6 h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
              {/* Conversations List */}
              <Card className="lg:col-span-4 border-0 shadow-xl rounded-2xl overflow-hidden bg-card/95 backdrop-blur">
                <div className="p-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-3">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث في المحادثات..."
                      className="pr-11 h-11 rounded-full bg-background/80 border-primary/20 focus:border-primary shadow-sm transition-all"
                    />
                  </div>
                  <Button
                    variant={showArchived ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowArchived(!showArchived)}
                    className="w-full rounded-full"
                  >
                    {showArchived ? (
                      <>
                        <ArchiveRestore className="h-4 w-4 ml-2" />
                        عرض المحادثات النشطة
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 ml-2" />
                        عرض الأرشيف
                      </>
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100%-5rem)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-12 text-center animate-fade-in">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <MessageCircle className="h-12 w-12 text-primary/70" />
                      </div>
                      <p className="text-foreground font-semibold text-lg mb-2">
                        {searchQuery ? "لا توجد نتائج" : "لا توجد محادثات"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? "جرب البحث بكلمات أخرى" : "ابدأ محادثة من صفحة الإعلان"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {filteredConversations.map((conv, index) => {
                        const otherUser = getOtherUserProfile(conv);
                        const isSelected = selectedConversation?.id === conv.id;
                        const pinned = isPinned(conv);
                        const archived = isArchived(conv);
                        
                        return (
                          <div
                            key={conv.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="relative animate-fade-in group"
                          >
                            <button
                              onClick={() => setSelectedConversation(conv)}
                              className={`w-full p-4 text-right transition-all duration-300 ${
                                isSelected 
                                  ? "bg-gradient-to-l from-primary/15 to-primary/5 border-r-4 border-primary shadow-sm" 
                                  : "hover:bg-accent/30"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative">
                                  <Avatar className="h-13 w-13 border-2 border-border shadow-lg transition-transform group-hover:scale-105">
                                    <AvatarImage src={otherUser.avatar_url || undefined} />
                                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                                      {otherUser.full_name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  {conv.unread_count! > 0 && (
                                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-md animate-pulse">
                                      <span className="text-[11px] text-destructive-foreground font-bold">
                                        {conv.unread_count!.toLocaleString('en-US')}
                                      </span>
                                    </div>
                                  )}
                                  {pinned && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                                      <Pin className="h-3 w-3 text-primary-foreground fill-current" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold truncate text-foreground text-base">{otherUser.full_name}</p>
                                      {pinned && (
                                        <Pin className="h-3.5 w-3.5 text-primary fill-current flex-shrink-0" />
                                      )}
                                    </div>
                                    {conv.last_message && (
                                      <span className="text-xs text-muted-foreground mr-2 flex-shrink-0 font-medium">
                                        {formatMessageTime(conv.last_message.created_at)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-primary/80 truncate mb-1.5 flex items-center gap-1.5 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    {conv.listings.title}
                                  </p>
                                  {conv.last_message && (
                                    <p className={`text-sm truncate leading-snug ${
                                      conv.unread_count! > 0 
                                        ? "font-semibold text-foreground" 
                                        : "text-muted-foreground"
                                    }`}>
                                      {conv.last_message.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                            
                            {/* Action buttons */}
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(conv.id);
                                }}
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur hover:bg-primary/10"
                              >
                                <Pin className={`h-4 w-4 ${pinned ? 'text-primary fill-current' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleArchive(conv.id);
                                }}
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur hover:bg-destructive/10"
                              >
                                {archived ? (
                                  <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Archive className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </Card>

              {/* Messages Area */}
              <Card className="lg:col-span-8 flex flex-col border-0 shadow-xl rounded-2xl overflow-hidden bg-card/95 backdrop-blur">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-gradient-to-r from-card via-card/90 to-card/80 backdrop-blur-sm flex items-center justify-between shadow-sm animate-fade-in">
                      <Link 
                        to={`/profile/${user?.id === selectedConversation.buyer_id ? selectedConversation.seller_id : selectedConversation.buyer_id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-all group"
                      >
                        <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-lg transition-transform group-hover:scale-105">
                          <AvatarImage src={getOtherUserProfile(selectedConversation).avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                            {getOtherUserProfile(selectedConversation).full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground text-base">{getOtherUserProfile(selectedConversation).full_name}</p>
                          <p className="text-xs text-primary/80 flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            {selectedConversation.listings.title}
                          </p>
                        </div>
                      </Link>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent transition-all">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 md:p-6 bg-gradient-to-b from-muted/10 via-background to-background">
                      <div className="space-y-3">
                        {messages.map((msg, index) => {
                          const isSentByMe = msg.sender_id === user?.id;
                          const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
                          
                          return (
                            <div
                              key={msg.id}
                              style={{ animationDelay: `${index * 30}ms` }}
                              className={`flex ${isSentByMe ? "justify-end" : "justify-start"} items-end gap-2 animate-fade-in`}
                            >
                              {!isSentByMe && (
                                <Avatar className={`h-8 w-8 shadow-md transition-all ${showAvatar ? "" : "invisible"}`}>
                                  <AvatarImage src={getOtherUserProfile(selectedConversation).avatar_url || undefined} />
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-muted to-muted/70">
                                    {getOtherUserProfile(selectedConversation).full_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              <div className={`flex flex-col ${isSentByMe ? "items-end" : "items-start"} max-w-[75%] md:max-w-[70%]`}>
                                <div
                                  className={`rounded-2xl px-4 py-3 shadow-lg transition-all hover:shadow-xl ${
                                    isSentByMe
                                      ? "bg-gradient-primary text-primary-foreground rounded-br-md"
                                      : "bg-card border border-border/50 rounded-bl-md hover:border-border"
                                  }`}
                                >
                                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                  <span className={`text-[11px] font-medium ${
                                    isSentByMe ? "text-muted-foreground" : "text-muted-foreground/70"
                                  }`}>
                                    {new Date(msg.created_at).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                  {isSentByMe && (
                                    msg.is_read ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                    )
                                  )}
                                </div>
                              </div>

                              {isSentByMe && (
                                <Avatar className={`h-8 w-8 shadow-md transition-all ${showAvatar ? "" : "invisible"}`}>
                                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                                    أنا
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Typing Indicator */}
                        {isOtherUserTyping && (
                          <div className="flex justify-start items-end gap-2 animate-fade-in">
                            <Avatar className="h-8 w-8 shadow-md">
                              <AvatarImage src={getOtherUserProfile(selectedConversation).avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-muted to-muted/70">
                                {getOtherUserProfile(selectedConversation).full_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border/50 shadow-lg">
                              <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-sm shadow-lg">
                      <div className="flex gap-2 items-end">
                        <div className="hidden sm:flex gap-1">
                          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-accent transition-all">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-accent transition-all">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <div className="flex-1 relative">
                          <Input
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              handleTyping();
                            }}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            placeholder="اكتب رسالتك هنا..."
                            className="pr-12 pl-4 py-6 rounded-full bg-background/80 border-primary/20 focus:border-primary shadow-sm transition-all focus:shadow-md resize-none"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 hover:bg-accent transition-all"
                          >
                            <Smile className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <Button 
                          onClick={sendMessage} 
                          disabled={!newMessage.trim()}
                          className="rounded-full h-12 w-12 bg-gradient-primary hover:opacity-90 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/10 via-background to-muted/5 animate-fade-in">
                    <div className="text-center max-w-md px-6">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-8 shadow-xl animate-scale-in">
                        <MessageCircle className="h-16 w-16 text-primary" />
                      </div>
                      <h3 className="text-3xl font-bold mb-3 text-foreground">مرحباً بك في الرسائل</h3>
                      <p className="text-muted-foreground text-lg">اختر محادثة من القائمة للبدء في المراسلة</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
        
        <div className="order-1">
          <AppSidebar />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Messages;
