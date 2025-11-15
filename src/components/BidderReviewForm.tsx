import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BidderReviewFormProps {
  auctionId: string;
  bidderId: string;
  bidderName: string;
  onSubmit?: () => void;
}

export const BidderReviewForm = ({ auctionId, bidderId, bidderName, onSubmit }: BidderReviewFormProps) => {
  const [ratings, setRatings] = useState({
    payment_speed: 0,
    communication: 0,
    reliability: 0
  });
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (type: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [type]: value }));
  };

  const handleSubmit = async () => {
    if (!ratings.payment_speed || !ratings.communication || !ratings.reliability) {
      toast.error('الرجاء تقييم جميع النقاط');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      const reviews = [
        { review_type: 'payment_speed', rating: ratings.payment_speed },
        { review_type: 'communication', rating: ratings.communication },
        { review_type: 'reliability', rating: ratings.reliability }
      ];

      for (const review of reviews) {
    const { error } = await supabase
      .from('bidder_reviews')
      .insert({
            auction_id: auctionId,
            reviewer_id: user.id,
            bidder_id: bidderId,
            rating: review.rating,
            review_type: review.review_type,
            comment: review.review_type === 'reliability' ? comment : null
          });

        if (error) throw error;
      }

      toast.success('تم إرسال التقييم بنجاح');
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('فشل إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({ type, label }: { type: keyof typeof ratings; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleStarClick(type, value)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                value <= ratings[type] ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">تقييم المزايد: {bidderName}</h3>
          <p className="text-sm text-muted-foreground">
            ساعد الآخرين بتقييم تجربتك مع هذا المزايد
          </p>
        </div>

        <div className="space-y-4">
          <RatingStars type="payment_speed" label="سرعة الدفع" />
          <RatingStars type="communication" label="التواصل" />
          <RatingStars type="reliability" label="الموثوقية" />
        </div>

        <div className="space-y-2">
          <Label>تعليق (اختياري)</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شارك تجربتك مع هذا المزايد..."
            className="min-h-[100px]"
            dir="rtl"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
        </Button>
      </div>
    </Card>
  );
};