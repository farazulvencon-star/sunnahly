CREATE TABLE public.shefa_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shefa_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are viewable by everyone"
ON public.shefa_videos FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage videos"
ON public.shefa_videos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_shefa_videos_active_sort ON public.shefa_videos(is_active, sort_order);