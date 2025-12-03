import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, ThumbsUp, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Review {
  id: string;
  reviewer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
  seller_reply: string | null;
  replied_at: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface UserReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  isOwnProfile: boolean;
  onReplyClick?: (review: Review) => void;
}

export const UserReviewsSection = ({
  reviews,
  averageRating,
  isOwnProfile,
  onReplyClick,
}: UserReviewsSectionProps) => {
  const [showAll, setShowAll] = useState(false);
  
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating - 1]++;
      }
    });
    return distribution.reverse(); // 5 stars first
  };

  const distribution = getRatingDistribution();

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <Card className="p-6 shadow-lg border-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          التقييمات والمراجعات
        </h2>
        <Badge variant="secondary" className="text-sm">
          {reviews.length} تقييم
        </Badge>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">لا توجد تقييمات بعد</p>
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="flex items-start gap-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{averageRating.toFixed(1)}</div>
              <div className="mt-1">{renderStars(Math.round(averageRating))}</div>
              <p className="text-sm text-muted-foreground mt-1">{reviews.length} تقييم</p>
            </div>
            
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars, index) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm w-6">{stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{
                        width: `${reviews.length > 0 ? (distribution[index] / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">
                    {distribution[index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <Link to={`/profile/${review.reviewer_id}`}>
                    <Avatar className="h-12 w-12 border-2 border-muted hover:border-primary transition-colors">
                      <AvatarImage src={review.profiles.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(review.profiles.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Link 
                          to={`/profile/${review.reviewer_id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {review.profiles.full_name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), {
                              addSuffix: true,
                              locale: ar,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {/* Seller Reply */}
                    {review.seller_reply && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50 border-r-2 border-primary">
                        <div className="flex items-center gap-2 mb-1">
                          <Reply className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">رد البائع</span>
                          {review.replied_at && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(review.replied_at), {
                                addSuffix: true,
                                locale: ar,
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.seller_reply}
                        </p>
                      </div>
                    )}

                    {/* Reply Button for Owner */}
                    {isOwnProfile && !review.seller_reply && onReplyClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => onReplyClick(review)}
                      >
                        <Reply className="h-4 w-4 ml-2" />
                        الرد على التقييم
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {reviews.length > 3 && (
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 ml-2" />
                  عرض أقل
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 ml-2" />
                  عرض المزيد ({reviews.length - 3} تقييم آخر)
                </>
              )}
            </Button>
          )}
        </>
      )}
    </Card>
  );
};
