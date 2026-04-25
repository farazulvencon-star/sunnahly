CREATE OR REPLACE FUNCTION public.get_public_setting(_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  raw jsonb;
  result jsonb;
BEGIN
  SELECT value INTO raw FROM public.site_settings WHERE key = _key;
  IF raw IS NULL THEN
    RETURN NULL;
  END IF;

  IF _key = 'facebook_pixel' THEN
    result := jsonb_build_object(
      'enabled', COALESCE(raw->'enabled', 'false'::jsonb),
      'pixel_id', COALESCE(raw->'pixel_id', '""'::jsonb),
      'test_event_code', COALESCE(raw->'test_event_code', '""'::jsonb)
    );
  ELSIF _key = 'cloudinary' THEN
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
    'site_logo','site_favicon','site_title','theme_color','topbar_texts','footer_content','promo_banners',
    'social_media','whatsapp_number','delivery_charge','partial_payment_percent',
    'money_back_banner','hero_settings','key_points','why_us','customer_reviews_settings',
    'page_about','page_contact','page_privacy','page_terms','page_refund','page_shipping',
    'page_faq','categories_enabled'
  ) THEN
    result := raw;
  ELSE
    result := NULL;
  END IF;

  RETURN result;
END;
$function$;
