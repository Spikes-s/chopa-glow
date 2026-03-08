import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductRating from './ProductRating';
import ReviewForm from './ReviewForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  customer_name: string | null;
  rating: number;
  review_text: string | null;
  review_images: string[] | null;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, customer_name, rating, review_text, review_images, created_at')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`reviews-${productId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'product_reviews',
        filter: `product_id=eq.${productId}`
      }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <Card variant="glass" className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Customer Reviews</span>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <ProductRating rating={Math.round(averageRating)} size="lg" showCount={false} />
              <span className="text-lg font-semibold">{averageRating}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Form */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold mb-3">Write a Review</h4>
          <ReviewForm productId={productId} onReviewSubmitted={fetchReviews} />
        </div>

        <Separator />

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-muted/20 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.customer_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <ProductRating rating={review.rating} size="sm" showCount={false} />
                </div>
                {review.review_text && (
                  <p className="text-sm text-muted-foreground mt-2">{review.review_text}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductReviews;
