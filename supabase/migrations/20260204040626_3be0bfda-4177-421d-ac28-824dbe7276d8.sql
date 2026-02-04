-- Create product_reviews table for customer ratings and reviews
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add display_section column to products for admin to control where products appear
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_section TEXT DEFAULT 'featured';

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews" 
ON public.product_reviews 
FOR SELECT 
USING (is_approved = true);

-- Users can insert their own reviews
CREATE POLICY "Users can insert reviews" 
ON public.product_reviews 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews" 
ON public.product_reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;

-- Add trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();