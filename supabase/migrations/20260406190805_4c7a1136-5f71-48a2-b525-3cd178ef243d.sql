
CREATE TABLE public.incomplete_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  shipping_address TEXT,
  city TEXT,
  area TEXT,
  cart_items JSONB DEFAULT '[]',
  cart_total NUMERIC(10,2) DEFAULT 0,
  is_converted BOOLEAN DEFAULT false,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

-- Anyone can insert/update (guest checkout support)
CREATE POLICY "Anyone can create incomplete orders" ON public.incomplete_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own incomplete order by session" ON public.incomplete_orders FOR UPDATE USING (true);

-- Only admins can view all
CREATE POLICY "Admins can manage incomplete orders" ON public.incomplete_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Index for session lookup
CREATE INDEX idx_incomplete_orders_session ON public.incomplete_orders(session_id);
CREATE INDEX idx_incomplete_orders_converted ON public.incomplete_orders(is_converted, last_activity DESC);

-- Updated at trigger
CREATE TRIGGER update_incomplete_orders_updated_at BEFORE UPDATE ON public.incomplete_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.incomplete_orders;
