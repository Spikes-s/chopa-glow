import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import type { Product } from '@/data/products';

interface ProductBeltProps {
  products: Product[];
  isLoading?: boolean;
  /** Pixels per second the belt travels. */
  speed?: number;
  /** Reverse direction (right → left vs left → right). */
  reverse?: boolean;
  onQuickView?: (product: Product) => void;
}

/**
 * Infinite horizontal "belt" of product cards.
 * Auto-scrolls continuously, seamlessly loops, pauses on hover/touch,
 * and supports native drag / swipe plus arrow navigation.
 */
const ProductBelt = ({
  products,
  isLoading = false,
  speed = 32,
  reverse = false,
  onQuickView,
}: ProductBeltProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const pause = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    pausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback((delay = 1200) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
      setIsPaused(false);
    }, delay);
  }, []);

  // Continuous auto-scroll with seamless wrap-around.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || products.length === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let raf = 0;
    let last = performance.now();

    // Start mid-track when reversing so there is room to travel backwards.
    if (reverse) el.scrollLeft = el.scrollWidth / 2;

    const step = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const half = el.scrollWidth / 2;

      if (!pausedRef.current && half > 0) {
        el.scrollLeft += (reverse ? -1 : 1) * (speed * dt) / 1000;
      }

      // Seamless loop: the track holds two copies of the list.
      if (half > 0) {
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        else if (el.scrollLeft <= 0) el.scrollLeft += half;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [products.length, speed, reverse]);

  const nudge = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    pause();
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: 'smooth' });
    resume(2500);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[220px] sm:w-[250px] flex-shrink-0">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  // Duplicate the list so the belt can wrap without a visible seam.
  const loop = [...products, ...products];

  return (
    <div className="relative group/belt">
      {/* Edge fades */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 md:w-16 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 md:w-16 z-10 bg-gradient-to-l from-background to-transparent" />

      <Button
        variant="glass"
        size="icon"
        aria-label="Scroll products left"
        onClick={() => nudge(-1)}
        className="absolute left-1 top-1/2 -translate-y-1/2 z-20 rounded-full opacity-0 group-hover/belt:opacity-100 focus-visible:opacity-100 transition-opacity hidden md:flex"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="glass"
        size="icon"
        aria-label="Scroll products right"
        onClick={() => nudge(1)}
        className="absolute right-1 top-1/2 -translate-y-1/2 z-20 rounded-full opacity-0 group-hover/belt:opacity-100 focus-visible:opacity-100 transition-opacity hidden md:flex"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <div
        ref={trackRef}
        role="list"
        aria-label="Product carousel"
        onMouseEnter={pause}
        onMouseLeave={() => resume(400)}
        onFocusCapture={pause}
        onBlurCapture={() => resume(800)}
        onTouchStart={pause}
        onTouchEnd={() => resume(2500)}
        onWheel={() => { pause(); resume(2000); }}
        className="flex gap-4 md:gap-6 overflow-x-auto overflow-y-hidden scrollbar-none py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: isPaused ? 'x proximity' : 'none' }}
      >
        {loop.map((product, i) => (
          <div
            key={`${product.id}-${i}`}
            role="listitem"
            aria-hidden={i >= products.length}
            className="w-[190px] sm:w-[230px] md:w-[250px] flex-shrink-0"
          >
            <ProductCard product={product} onQuickView={onQuickView} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductBelt;
