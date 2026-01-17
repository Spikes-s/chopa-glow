-- Fix the view to use security_invoker instead of security_definer
DROP VIEW IF EXISTS public.public_products;

CREATE VIEW public.public_products
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  description,
  category,
  subcategory,
  retail_price,
  wholesale_price,
  wholesale_min_qty,
  image_url,
  additional_images,
  in_stock,
  stock_quantity,
  barcode,
  variations,
  expiry_date,
  created_at,
  updated_at
FROM public.products;

-- Grant access to the view
GRANT SELECT ON public.public_products TO anon, authenticated;