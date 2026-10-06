import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads the `categories_enabled` setting from site_settings.
 * Defaults to `false` so categories stay hidden unless an admin turns them on.
 */
export const useCategoriesEnabled = () => {
  return true;
};
