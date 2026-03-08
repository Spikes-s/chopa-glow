
-- Bundle deals table
CREATE TABLE public.bundle_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  bundle_type text NOT NULL DEFAULT 'buy_x_get_y', -- buy_x_get_y, combo_discount
  buy_quantity integer DEFAULT 3,
  get_quantity integer DEFAULT 1,
  discount_percent numeric DEFAULT 0,
  product_ids uuid[] DEFAULT '{}',
  category_filter text,
  is_active boolean DEFAULT true,
  starts_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.bundle_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bundle deals" ON public.bundle_deals
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active bundle deals" ON public.bundle_deals
FOR SELECT TO authenticated, anon
USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));

-- Customer wallet table
CREATE TABLE public.customer_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.customer_wallets
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage wallets" ON public.customer_wallets
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL, -- cashback, refund, spend, topup
  description text,
  order_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions" ON public.wallet_transactions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add review_images column to product_reviews
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_images text[] DEFAULT '{}';
