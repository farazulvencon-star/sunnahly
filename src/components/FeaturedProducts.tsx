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

  // Auto horizontal scroll (left to right visual = scroll content leftward)
  useEffect(() => {
    if (!products?.length || products.length < 3) return;
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    let paused = false;
    const speed = 0.6; // px per frame

    const tick = () => {
      if (!paused && el) {
        el.scrollLeft += speed;
        // Loop seamlessly when reached halfway (since we duplicate)
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchstart", onEnter, { passive: true });
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
  const displayItems = products.length >= 3 ? [...products, ...products] : products;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ফিচার্ড পণ্য</h2>
          <p className="text-muted-foreground mt-2">আমাদের সবচেয়ে জনপ্রিয় পণ্যগুলো</p>
        </div>
        <div
          ref={scrollRef}
          className="overflow-x-hidden overflow-y-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-4 md:gap-6 w-max">
            {displayItems.map((p: any, idx: number) => (
              <div
                key={`${p.id}-${idx}`}
                className="w-[160px] sm:w-[200px] md:w-[240px] lg:w-[260px] flex-shrink-0"
              >
                <ProductCard
                  id={p.id}
                  name={p.name}
                  price={Number(p.price)}
                  originalPrice={p.original_price ? Number(p.original_price) : undefined}
                  image={p.images?.[0] || "/placeholder.svg"}
                  badge={p.badge}
                  slug={p.slug}
                  categoryName={p.categories?.name}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
