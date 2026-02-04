import { Star } from 'lucide-react';

interface ProductRatingProps {
  rating: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const ProductRating = ({ 
  rating, 
  totalReviews = 0, 
  size = 'md',
  showCount = true 
}: ProductRatingProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      {showCount && totalReviews > 0 && (
        <span className={`${textClasses[size]} text-muted-foreground ml-1`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

export default ProductRating;
