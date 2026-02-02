import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, User } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { toast } from '@/hooks/use-toast';


interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface ProductReviewsProps {
  productId: string;
}

function StarRating({
  rating,
  onRatingChange,
  interactive = false,
  size = 'md',
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRatingChange?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= (hoverRating || rating)
                ? 'fill-warning text-warning'
                : 'text-muted-foreground/30'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, onSuccess }: { productId: string; onSuccess: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      if (rating === 0) throw new Error('Please select a rating');

      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title || null,
        comment: comment || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Review submitted!', description: 'Thank you for your feedback.' });
      setRating(0);
      setTitle('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!user) {
    return (
      <div className="bg-secondary/30 rounded-xl p-6 text-center">
        <p className="text-muted-foreground mb-4">Please sign in to leave a review</p>
        <Button asChild>
          <a href="/auth">Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitMutation.mutate();
      }}
      className="bg-card rounded-xl p-6 border space-y-4"
    >
      <h3 className="font-semibold text-lg">Write a Review</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Your Rating *</label>
        <StarRating rating={rating} onRatingChange={setRating} interactive size="lg" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Title (optional)</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Your Review (optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this product..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={submitMutation.isPending || rating === 0}>
        {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-card rounded-xl p-6 border animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {review.profiles?.full_name || 'Anonymous'}
            </p>
            <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
          </div>
        </div>
        {review.is_verified_purchase && (
          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
            Verified Purchase
          </span>
        )}
      </div>

      <StarRating rating={review.rating} size="sm" />

      {review.title && <h4 className="font-medium mt-3">{review.title}</h4>}
      {review.comment && (
        <p className="text-muted-foreground mt-2 text-sm">{review.comment}</p>
      )}
    </div>
  );
}

// Dummy reviews to show when no real reviews exist
const dummyReviews: Review[] = [
  {
    id: 'dummy-1',
    rating: 5,
    title: 'Excellent Power Sprayer!',
    comment: 'This sprayer is incredibly powerful and reliable. Used it for my entire coconut farm and it performed flawlessly. Highly recommend for agricultural use!',
    is_verified_purchase: true,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: { full_name: 'Govindaraj S.' },
  },
  {
    id: 'dummy-2',
    rating: 5,
    title: 'Best Quality Lubricant',
    comment: 'Using this engine oil for my tractor and the performance improvement is noticeable. Gounder & Co always delivers genuine products. Will definitely buy again!',
    is_verified_purchase: true,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: { full_name: 'Murugan K.' },
  },
  {
    id: 'dummy-3',
    rating: 4,
    title: 'Great Battery Backup',
    comment: 'The Exide battery I purchased works perfectly. Good value for money and the team helped me choose the right one for my vehicle.',
    is_verified_purchase: false,
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: { full_name: 'Selvaraj M.' },
  },
  {
    id: 'dummy-4',
    rating: 5,
    title: 'Worth Every Rupee',
    comment: 'Premium quality chainsaw at competitive price. You can really tell the difference from other sellers. The service team was also very helpful!',
    is_verified_purchase: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    profiles: { full_name: 'Rajan P.' },
  },
];

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      // Fetch profiles for reviewers
      const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profilesMap = new Map(
        profilesData?.map((p) => [p.user_id, p]) || []
      );

      // Combine reviews with profiles
      return reviewsData.map((review) => ({
        ...review,
        profiles: profilesMap.get(review.user_id) || null,
      })) as Review[];
    },
  });

  // Use dummy reviews if no real reviews exist
  const displayReviews = reviews.length > 0 ? reviews : dummyReviews;
  const isShowingDummy = reviews.length === 0 && !isLoading;

  const averageRating =
    displayReviews.length > 0
      ? displayReviews.reduce((sum, r) => sum + r.rating, 0) / displayReviews.length
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: displayReviews.filter((r) => r.rating === rating).length,
    percentage: displayReviews.length > 0
      ? (displayReviews.filter((r) => r.rating === rating).length / displayReviews.length) * 100
      : 0,
  }));

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-6 border sticky top-24">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              <StarRating rating={Math.round(averageRating)} size="md" />
              <p className="text-sm text-muted-foreground mt-2">
                Based on {displayReviews.length} review{displayReviews.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-2">
              {ratingCounts.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-6"
              variant={showForm ? 'outline' : 'default'}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : 'Write a Review'}
            </Button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          {showForm && (
            <ReviewForm productId={productId} onSuccess={() => setShowForm(false)} />
          )}

          {isShowingDummy && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground text-center">
                ⭐ Be the first to review this product and share your experience!
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-secondary/30 rounded-xl h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            displayReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </div>
      </div>
    </section>
  );
}
