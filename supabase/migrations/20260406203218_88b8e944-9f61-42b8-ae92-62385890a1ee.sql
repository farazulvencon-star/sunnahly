
CREATE TABLE public.code_snippets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  code text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'javascript',
  placement text NOT NULL DEFAULT 'body_end',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active snippets"
ON public.code_snippets FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage snippets"
ON public.code_snippets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_code_snippets_updated_at
BEFORE UPDATE ON public.code_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
