import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
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
  const testCodeRef = useRef<string>("");

  const { data: pixelSettings } = useQuery({
    queryKey: ["pixel-settings"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_setting", { _key: "facebook_pixel" });
      return data as { enabled?: boolean; pixel_id?: string; test_event_code?: string } | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Keep latest test_event_code available to all trackers
  useEffect(() => {
    testCodeRef.current = pixelSettings?.test_event_code || "";
  }, [pixelSettings?.test_event_code]);

  // Helper that sends events with optional test_event_code
  const sendEvent = useCallback((type: "track" | "trackCustom", eventName: string, params?: Record<string, any>) => {
    if (!window.fbq) return;
    const code = testCodeRef.current;
    if (code) {
      // Facebook Pixel browser SDK accepts test_event_code via the 4th argument options bag
      window.fbq(type, eventName, params || {}, { test_event_code: code });
    } else {
      window.fbq(type, eventName, params || {});
    }
  }, []);

  // Initialize pixel
  useEffect(() => {
    if (!pixelSettings?.enabled || !pixelSettings?.pixel_id || initialized) return;

    const id = pixelSettings.pixel_id;
    setPixelId(id);

    // Load Facebook Pixel script
    const f = window;
    const b = document;
    if (!f.fbq) {
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
    }

    window.fbq("init", id);
    sendEvent("track", "PageView");
    setInitialized(true);
  }, [pixelSettings, initialized, sendEvent]);

  // Track page views on route change
  useEffect(() => {
    if (!initialized) return;
    const handleRouteChange = () => sendEvent("track", "PageView");
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [initialized, sendEvent]);

  // Time on page tracking (30 seconds)
  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => {
      sendEvent("trackCustom", "TimeOnPage", { seconds: 30 });
    }, 30000);
    return () => clearTimeout(timer);
  }, [initialized, sendEvent]);

  // Scroll depth tracking (50%)
  useEffect(() => {
    if (!initialized) return;
    let fired = false;
    const handleScroll = () => {
      if (fired) return;
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= 50) {
        sendEvent("trackCustom", "PageScroll", { percent: 50 });
        fired = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [initialized, sendEvent]);

  // Internal click tracking
  useEffect(() => {
    if (!initialized) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        sendEvent("trackCustom", "InternalClick", { url: anchor.href });
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [initialized, sendEvent]);

  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, any>) => {
      if (!initialized) return;
      const standardEvents = [
        "AddToCart", "InitiateCheckout", "Purchase", "ViewContent",
        "Lead", "CompleteRegistration", "Search",
      ];
      sendEvent(standardEvents.includes(eventName) ? "track" : "trackCustom", eventName, params);
    },
    [initialized, sendEvent]
  );

  return (
    <PixelContext.Provider value={{ trackEvent, pixelId }}>
      {children}
    </PixelContext.Provider>
  );
};

export const usePixel = () => useContext(PixelContext);
