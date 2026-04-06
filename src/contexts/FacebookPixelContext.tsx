import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PixelContextType {
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  pixelId: string | null;
}

const PixelContext = createContext<PixelContextType>({ trackEvent: () => {}, pixelId: null });

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const FacebookPixelProvider = ({ children }: { children: ReactNode }) => {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data: pixelSettings } = useQuery({
    queryKey: ["pixel-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", "facebook_pixel")
        .maybeSingle();
      return data?.value as { enabled?: boolean; pixel_id?: string; access_token?: string } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Initialize pixel
  useEffect(() => {
    if (!pixelSettings?.enabled || !pixelSettings?.pixel_id || initialized) return;

    const id = pixelSettings.pixel_id;
    setPixelId(id);

    // Load Facebook Pixel script
    const f = window;
    const b = document;
    if (f.fbq) return;

    const n: any = (f.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];

    const s = b.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = b.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(s, firstScript);

    window.fbq("init", id);
    window.fbq("track", "PageView");
    setInitialized(true);
  }, [pixelSettings, initialized]);

  // Track page views on route change
  useEffect(() => {
    if (!initialized) return;

    const handleRouteChange = () => {
      window.fbq?.("track", "PageView");
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [initialized]);

  // Time on page tracking (30 seconds)
  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => {
      window.fbq?.("trackCustom", "TimeOnPage", { seconds: 30 });
    }, 30000);
    return () => clearTimeout(timer);
  }, [initialized]);

  // Scroll depth tracking (50%)
  useEffect(() => {
    if (!initialized) return;
    let fired = false;
    const handleScroll = () => {
      if (fired) return;
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= 50) {
        window.fbq?.("trackCustom", "PageScroll", { percent: 50 });
        fired = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [initialized]);

  // Internal click tracking
  useEffect(() => {
    if (!initialized) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        window.fbq?.("trackCustom", "InternalClick", { url: anchor.href });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [initialized]);

  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, any>) => {
      if (!initialized) return;
      const standardEvents = [
        "AddToCart", "InitiateCheckout", "Purchase", "ViewContent",
        "Lead", "CompleteRegistration", "Search",
      ];
      if (standardEvents.includes(eventName)) {
        window.fbq?.("track", eventName, params);
      } else {
        window.fbq?.("trackCustom", eventName, params);
      }
    },
    [initialized]
  );

  return (
    <PixelContext.Provider value={{ trackEvent, pixelId }}>
      {children}
    </PixelContext.Provider>
  );
};

export const usePixel = () => useContext(PixelContext);
