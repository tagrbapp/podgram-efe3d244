import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrivateAuctionInviteProps {
  auctionId: string;
}

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export const PrivateAuctionInvite = ({ auctionId }: PrivateAuctionInviteProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchInvitedUsers();
  }, [auctionId]);

  const searchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${searchQuery}%`)
        .limit(5);

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const fetchInvitedUsers = async () => {
    try {
      const { data } = await supabase
        .from('auction_invitations' as any)
        .select('invitee_id, profiles(id, full_name, avatar_url)')
        .eq('auction_id', auctionId);

      if (data) {
        setInvitedUsers(data.map((inv: any) => ({
          id: inv.profiles.id,
          full_name: inv.profiles.full_name,
          avatar_url: inv.profiles.avatar_url
        })));
      }
    } catch (error) {
      console.error('Error fetching invited users:', error);
    }
  };

  const handleInvite = async (user: User) => {
    setIsLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { error } = await supabase
        .from('auction_invitations' as any)
        .insert({
          auction_id: auctionId,
          inviter_id: currentUser.id,
          invitee_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'دعوة لمزاد خاص',
          message: 'تمت دعوتك للمشاركة في مزاد خاص',
          type: 'auction_invitation'
        });

      toast.success(`تم إرسال الدعوة إلى ${user.full_name}`);
      setInvitedUsers(prev => [...prev, user]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('فشل إرسال الدعوة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveInvite = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('auction_invitations' as any)
        .delete()
        .eq('auction_id', auctionId)
        .eq('invitee_id', userId);

      if (error) throw error;

      setInvitedUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('تم إلغاء الدعوة');
    } catch (error) {
      console.error('Error removing invitation:', error);
      toast.error('فشل إلغاء الدعوة');
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">دعوة مزايدين للمزاد الخاص</h3>

      {/* البحث */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن مستخدمين..."
          className="pr-10"
          dir="rtl"
        />

        {searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-card border rounded-lg shadow-lg z-10">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 hover:bg-secondary cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.full_name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleInvite(user)}
                  disabled={isLoading || invitedUsers.some(u => u.id === user.id)}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* المدعوون */}
      <div>
        <h4 className="text-sm font-semibold mb-3">
          المدعوون ({invitedUsers.length})
        </h4>
        <div className="space-y-2">
          {invitedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لم يتم دعوة أي مستخدمين بعد
            </p>
          ) : (
            invitedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.full_name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveInvite(user.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};