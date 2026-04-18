import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FaviconManager = () => {
  const { data: faviconUrl } = useQuery({
    queryKey: ["site-favicon"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_setting", { _key: "site_favicon" });
      return (data as any)?.url || "";
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
    link.type = faviconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png";
  }, [faviconUrl]);

  return null;
};

export default FaviconManager;
