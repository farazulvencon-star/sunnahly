import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads the `categories_enabled` setting from site_settings.
 * Defaults to `false` so categories stay hidden unless an admin turns them on.
 */
export const useCategoriesEnabled = () => {
  const { data } = useQuery({
    queryKey: ["categories-enabled"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_setting", { _key: "categories_enabled" });
      const v = data as any;
      if (v === null || v === undefined) return false;
      if (typeof v === "boolean") return v;
      if (typeof v === "object" && "enabled" in v) return !!v.enabled;
      return false;
    },
    staleTime: 1000 * 60 * 5,
  });
  return data ?? false;
};
