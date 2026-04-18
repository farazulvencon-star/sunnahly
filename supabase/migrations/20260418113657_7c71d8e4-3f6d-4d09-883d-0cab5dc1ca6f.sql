
-- =========================================================
-- 1. SITE_SETTINGS: lock down to admin-only, add safe public RPC
-- =========================================================

DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.site_settings;

-- Admin ALL policy already exists ("Only admins can manage settings"), keep it.

-- Helper: list of keys that are safe to expose publicly (sanitized values where needed)
CREATE OR REPLACE FUNCTION public.get_public_setting(_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw jsonb;
  result jsonb;
BEGIN
  SELECT value INTO raw FROM public.site_settings WHERE key = _key;
  IF raw IS NULL THEN
    RETURN NULL;
  END IF;

  -- Sanitize sensitive keys: only return non-secret fields
  IF _key = 'facebook_pixel' THEN
    result := jsonb_build_object(
      'enabled', COALESCE(raw->'enabled', 'false'::jsonb),
      'pixel_id', COALESCE(raw->'pixel_id', '""'::jsonb)
    );
  ELSIF _key = 'cloudinary' THEN
    -- cloud_name and unsigned upload_preset are safe (used client-side for uploads)
    result := jsonb_build_object(
      'cloud_name', COALESCE(raw->'cloud_name', '""'::jsonb),
      'upload_preset', COALESCE(raw->'upload_preset', '""'::jsonb)
    );
  ELSIF _key = 'payment_gateway' THEN
    result := jsonb_build_object(
      'enabled', COALESCE(raw->'enabled', 'false'::jsonb),
      'provider', COALESCE(raw->'provider', '""'::jsonb)
    );
  ELSIF _key IN (
    'site_logo','site_favicon','topbar_texts','footer_content','promo_banners',
    'social_media','whatsapp_number','delivery_charge','partial_payment_percent',
    'money_back_banner','hero_settings','key_points','why_us','customer_reviews_settings',
    'page_about','page_contact','page_privacy','page_terms','page_refund','page_shipping',
    'page_faq'
  ) THEN
    result := raw;
  ELSE
    -- Unknown / non-public key (e.g. order_webhook, steadfast): return null
    result := NULL;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_setting(text) TO anon, authenticated;

-- =========================================================
-- 2. CHAT: restrict by session_id sent via request header `x-session-id`
-- =========================================================

DROP POLICY IF EXISTS "Anyone can view own conversation by session" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can update own conversation" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can view messages of their conversation" ON public.chat_messages;

CREATE POLICY "Session owner can view own conversation"
ON public.chat_conversations FOR SELECT
USING (
  session_id = COALESCE(current_setting('request.headers', true)::jsonb->>'x-session-id', '')
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Session owner can update own conversation"
ON public.chat_conversations FOR UPDATE
USING (
  session_id = COALESCE(current_setting('request.headers', true)::jsonb->>'x-session-id', '')
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Session owner can view own messages"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND (
        c.session_id = COALESCE(current_setting('request.headers', true)::jsonb->>'x-session-id', '')
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
      )
  )
);

-- =========================================================
-- 3. STORAGE: prevent public listing of review-images bucket
--    (objects remain accessible by direct URL since bucket is public)
-- =========================================================

-- Drop any existing broad SELECT policies for review-images
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname ILIKE '%review-images%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.polname);
  END LOOP;
END $$;

-- Only admins can list/manage storage objects in this bucket via the API.
-- (Direct CDN URLs still work because the bucket is marked public.)
CREATE POLICY "Admins can manage review-images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'review-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
