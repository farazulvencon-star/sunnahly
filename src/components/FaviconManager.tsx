import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Convert "#RRGGBB" to "H S% L%" string consumable by hsl(var(--primary))
const hexToHsl = (hex: string): string | null => {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const FaviconManager = () => {
  const { data: faviconUrl } = useQuery({
    queryKey: ["site-favicon"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "site_favicon").single();
      return (data?.value || data?.setting_value as any)?.url || "";
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: siteTitle } = useQuery({
    queryKey: ["site-title"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "site_title").single();
      return (data?.value || data?.setting_value as any)?.title || "";
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: themeColor } = useQuery({
    queryKey: ["theme-color"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "theme_color").single();
      return (data?.value || data?.setting_value as any)?.primary_hex || "";
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!faviconUrl) return;
    // Remove all existing favicons
    document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());
    
    // Create new favicon link
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = faviconUrl;
    if (faviconUrl.endsWith(".svg")) link.type = "image/svg+xml";
    else if (faviconUrl.endsWith(".webp")) link.type = "image/webp";
    else if (faviconUrl.endsWith(".ico")) link.type = "image/x-icon";
    else link.type = "image/png"; // fallback
    document.head.appendChild(link);
  }, [faviconUrl]);

  useEffect(() => {
    if (!siteTitle) return;
    document.title = siteTitle;
    // Update OG title meta as well
    const ogTitle = document.querySelector("meta[property='og:title']") as HTMLMetaElement | null;
    if (ogTitle) ogTitle.content = siteTitle;
  }, [siteTitle]);

  useEffect(() => {
    if (!themeColor) return;
    const hsl = hexToHsl(themeColor);
    if (!hsl) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-ring", hsl);
    root.style.setProperty("--secondary-foreground", hsl);
    root.style.setProperty("--accent-foreground", hsl);
    root.style.setProperty("--sidebar-accent-foreground", hsl);
  }, [themeColor]);

  return null;
};

export default FaviconManager;
