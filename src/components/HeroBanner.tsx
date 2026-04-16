import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  const { data: slides } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  const total = slides?.length || 0;

  const next = useCallback(() => {
    if (total > 0) setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    if (total > 0) setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, total]);

  if (!total) {
    return (
      <section className="relative bg-secondary overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-20 lg:py-28 text-center">
          <p className="text-muted-foreground">অ্যাডমিন প্যানেল থেকে হিরো স্লাইড যোগ করুন</p>
          <p className="text-xs text-muted-foreground mt-2">
            ডেস্কটপ: 1400×500px | ট্যাবলেট: 800×400px | মোবাইল: 600×400px (16:9 বা 3:1 রেশিও)
          </p>
        </div>
      </section>
    );
  }

  const slide = slides![current];

  const content = (
    <div className="relative w-full overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: "1400/500" }}>
        <img
          src={slide.image_url}
          alt={slide.title || "Banner"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 rounded-full p-1.5 md:p-2 transition-colors z-10"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 rounded-full p-1.5 md:p-2 transition-colors z-10"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides!.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
              className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-background/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (slide.link_url) {
    const isExternal = slide.link_url.startsWith("http");
    if (isExternal) {
      return <a href={slide.link_url} target="_blank" rel="noopener noreferrer">{content}</a>;
    }
    return <Link to={slide.link_url}>{content}</Link>;
  }

  return content;
};

export default HeroBanner;
