import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { MessageCircle, Send, User, Search, MoreVertical, Image as ImageIcon, Paperclip, Smile, Check, CheckCheck } from "lucide-react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!selectedConversation) return;

    // Subscribe to realtime messages
    const messagesChannel = supabase
      .channel(`messages:${selectedConversation.id}`)
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
        }
      )
      .subscribe();

    setChannel(messagesChannel);

    return () => {
      messagesChannel.unsubscribe();
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

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

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherUser = getOtherUserProfile(conv);
    return otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.listings.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <div className="flex-1 order-2">
            <div className="min-h-screen flex items-center justify-center">
              <p className="text-lg">جاري التحميل...</p>
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
          <header className="h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10 flex items-center px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">الرسائل</h1>
                  <p className="text-sm text-muted-foreground">تواصل مع المشترين والبائعين</p>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6">
            <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
              {/* Conversations List */}
              <Card className="md:col-span-4 border-0 shadow-lg">
                <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث في المحادثات..."
                      className="pr-10 bg-background/50 border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[calc(100%-5rem)]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        {searchQuery ? "لا توجد نتائج" : "لا توجد محادثات"}
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        {searchQuery ? "جرب البحث بكلمات أخرى" : "ابدأ محادثة من صفحة الإعلان"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {filteredConversations.map((conv) => {
                        const otherUser = getOtherUserProfile(conv);
                        const isSelected = selectedConversation?.id === conv.id;
                        return (
                          <button
                            key={conv.id}
                            onClick={() => setSelectedConversation(conv)}
                            className={`w-full p-4 text-right hover:bg-accent/50 transition-all duration-200 ${
                              isSelected ? "bg-primary/10 border-r-4 border-primary" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                  <AvatarImage src={otherUser.avatar_url || undefined} />
                                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                                    {otherUser.full_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {conv.unread_count! > 0 && (
                                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                                    <span className="text-[10px] text-white font-bold">{conv.unread_count}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold truncate text-foreground">{otherUser.full_name}</p>
                                  {conv.last_message && (
                                    <span className="text-xs text-muted-foreground mr-2 flex-shrink-0">
                                      {formatMessageTime(conv.last_message.created_at)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground/80 truncate mb-1 flex items-center gap-1">
                                  <span className="text-primary">•</span>
                                  {conv.listings.title}
                                </p>
                                {conv.last_message && (
                                  <p className={`text-sm truncate ${conv.unread_count! > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                                    {conv.last_message.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </Card>

              {/* Messages Area */}
              <Card className="md:col-span-8 flex flex-col border-0 shadow-lg overflow-hidden">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-gradient-to-r from-card to-card/80 backdrop-blur-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border-2 border-primary/20 shadow-md">
                          <AvatarImage src={getOtherUserProfile(selectedConversation).avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                            {getOtherUserProfile(selectedConversation).full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{getOtherUserProfile(selectedConversation).full_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="text-primary">•</span>
                            {selectedConversation.listings.title}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-muted/20 to-background">
                      <div className="space-y-4">
                        {messages.map((msg, index) => {
                          const isSentByMe = msg.sender_id === user?.id;
                          const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
                          
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isSentByMe ? "justify-end" : "justify-start"} items-end gap-2`}
                            >
                              {!isSentByMe && (
                                <Avatar className={`h-7 w-7 ${showAvatar ? "" : "invisible"}`}>
                                  <AvatarImage src={getOtherUserProfile(selectedConversation).avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getOtherUserProfile(selectedConversation).full_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              <div className={`flex flex-col ${isSentByMe ? "items-end" : "items-start"} max-w-[70%]`}>
                                <div
                                  className={`rounded-2xl px-4 py-2 shadow-md ${
                                    isSentByMe
                                      ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                                      : "bg-card border border-border rounded-bl-sm"
                                  }`}
                                >
                                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                </div>
                                <div className="flex items-center gap-1 mt-1 px-1">
                                  <span className={`text-[11px] ${isSentByMe ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                                    {new Date(msg.created_at).toLocaleTimeString('ar-SA', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                  {isSentByMe && (
                                    msg.is_read ? (
                                      <CheckCheck className="h-3 w-3 text-primary" />
                                    ) : (
                                      <Check className="h-3 w-3 text-muted-foreground" />
                                    )
                                  )}
                                </div>
                              </div>

                              {isSentByMe && (
                                <Avatar className={`h-7 w-7 ${showAvatar ? "" : "invisible"}`}>
                                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                                    أنا
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
                      <div className="flex gap-2 items-end">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <div className="flex-1 relative">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            placeholder="اكتب رسالتك هنا..."
                            className="pr-12 pl-4 py-6 rounded-full bg-background border-primary/20 focus:border-primary resize-none"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
                          >
                            <Smile className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <Button 
                          onClick={sendMessage} 
                          disabled={!newMessage.trim()}
                          className="rounded-full h-12 w-12 bg-gradient-primary hover:opacity-90 shadow-lg"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/20 to-background">
                    <div className="text-center max-w-sm">
                      <div className="w-24 h-24 rounded-full bg-gradient-primary/10 flex items-center justify-center mx-auto mb-6">
                        <MessageCircle className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">مرحباً بك في الرسائل</h3>
                      <p className="text-muted-foreground">اختر محادثة من القائمة للبدء في المراسلة</p>
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
