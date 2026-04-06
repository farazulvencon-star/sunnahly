ALTER TABLE public.orders ADD COLUMN is_trashed BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_orders_trashed ON public.orders(is_trashed) WHERE is_trashed = true;