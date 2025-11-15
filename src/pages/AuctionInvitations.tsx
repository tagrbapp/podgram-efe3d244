import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, MailOpen, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Invitation {
  id: string;
  auction_id: string;
  status: string;
  sent_at: string;
  listing?: {
    id: string;
    title: string;
    images: string[];
  };
  inviter?: {
    full_name: string;
  };
  invitee?: {
    full_name: string;
  };
}

export default function AuctionInvitations() {
  const [incoming, setIncoming] = useState<Invitation[]>([]);
  const [sent, setSent] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: incomingData } = await supabase
        .from('auction_invitations' as any)
        .select(`
          *,
          auctions(listing_id, listings(id, title, images)),
          profiles(full_name)
        `)
        .eq('invitee_id', user.id)
        .order('sent_at', { ascending: false });

      const { data: sentData } = await supabase
        .from('auction_invitations' as any)
        .select(`
          *,
          auctions(listing_id, listings(id, title, images)),
          profiles(full_name)
        `)
        .eq('inviter_id', user.id)
        .order('sent_at', { ascending: false });

      setIncoming((incomingData as any) || []);
      setSent((sentData as any) || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_auction_invitation', {
        _invitation_id: invitationId
      });

      if (error) throw error;
      if ((data as any)?.success) {
        toast.success('تم قبول الدعوة');
        fetchInvitations();
      } else {
        toast.error((data as any)?.error || 'فشل قبول الدعوة');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('فشل قبول الدعوة');
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.rpc('decline_auction_invitation', {
        _invitation_id: invitationId
      });

      if (error) throw error;
      if ((data as any)?.success) {
        toast.success('تم رفض الدعوة');
        fetchInvitations();
      } else {
        toast.error((data as any)?.error || 'فشل رفض الدعوة');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('فشل رفض الدعوة');
    }
  };

  const InvitationCard = ({ invitation, type }: { invitation: any; type: 'incoming' | 'sent' }) => {
    const listing = invitation.auctions?.listings;
    const otherUser = type === 'incoming' ? invitation.profiles : invitation.profiles;

    return (
      <Card className="p-4">
        <div className="flex gap-4">
          {listing?.images?.[0] && (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h4 className="font-bold mb-1">{listing?.title || 'مزاد'}</h4>
            <p className="text-sm text-muted-foreground mb-2">
              {type === 'incoming' ? 'من' : 'إلى'}: {otherUser?.full_name || 'مستخدم'}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={
                invitation.status === 'accepted' ? 'default' :
                invitation.status === 'declined' ? 'destructive' : 'secondary'
              }>
                {invitation.status === 'pending' ? 'قيد الانتظار' :
                 invitation.status === 'accepted' ? 'مقبولة' : 'مرفوضة'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(invitation.sent_at), { addSuffix: true, locale: ar })}
              </span>
            </div>

            {type === 'incoming' && invitation.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(invitation.id)}
                  className="gap-1"
                >
                  <Check className="w-4 h-4" />
                  قبول
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(invitation.id)}
                  className="gap-1"
                >
                  <X className="w-4 h-4" />
                  رفض
                </Button>
              </div>
            )}

            {listing && (
              <Button
                size="sm"
                variant="link"
                className="mt-2 p-0 h-auto"
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                عرض المزاد
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">جاري التحميل...</Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">دعوات المزادات</h1>
      </div>

      <Tabs defaultValue="incoming" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <MailOpen className="w-4 h-4" />
            الواردة ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Mail className="w-4 h-4" />
            المرسلة ({sent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4 mt-6">
          {incoming.length === 0 ? (
            <Card className="p-12 text-center">
              <MailOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد دعوات واردة</p>
            </Card>
          ) : (
            incoming.map(inv => <InvitationCard key={inv.id} invitation={inv} type="incoming" />)
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {sent.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">لم ترسل أي دعوات بعد</p>
            </Card>
          ) : (
            sent.map(inv => <InvitationCard key={inv.id} invitation={inv} type="sent" />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}