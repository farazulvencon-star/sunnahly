ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'global';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_inside_dhaka NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_outside_dhaka NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_nationwide NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS payment_requirement TEXT DEFAULT 'cod';
