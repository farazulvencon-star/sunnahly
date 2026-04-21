import { useEffect, useRef } from "react";
import ProductCard from "./ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FeaturedProducts = () => {
  const { data: products } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto vertical scroll
  useEffect(() => {
    if (!products?.length || products.length < 5) return;
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    let paused = false;
    const speed = 0.5; // px per frame

    const tick = () => {
      if (!paused && el) {
        el.scrollTop += speed;
        // Reset to top when reached halfway (since we duplicate)
        if (el.scrollTop >= el.scrollHeight / 2) {
          el.scrollTop = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchstart", onEnter);
    el.addEventListener("touchend", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchstart", onEnter);
      el.removeEventListener("touchend", onLeave);
    };
  }, [products]);

  if (!products?.length) return null;

  // Duplicate items for seamless infinite scroll
  const displayItems = products.length >= 5 ? [...products, ...products] : products;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ফিচার্ড পণ্য</h2>
          <p className="text-muted-foreground mt-2">আমাদের সবচেয়ে জনপ্রিয় পণ্যগুলো</p>
        </div>
        <div
          ref={scrollRef}
          className="overflow-hidden scrollbar-hide"
          style={{
            maxHeight: "640px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayItems.map((p: any, idx: number) => (
              <ProductCard
                key={`${p.id}-${idx}`}
                id={p.id}
                name={p.name}
                price={Number(p.price)}
                originalPrice={p.original_price ? Number(p.original_price) : undefined}
                image={p.images?.[0] || "/placeholder.svg"}
                badge={p.badge}
                slug={p.slug}
                categoryName={p.categories?.name}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
