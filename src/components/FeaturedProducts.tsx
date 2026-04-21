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

  // Step-by-step auto scroll: pause 2s, slide to next card smoothly
  useEffect(() => {
    if (!products?.length || products.length < 3) return;
    const el = scrollRef.current;
    if (!el) return;

    let paused = false;
    let timer: number | undefined;
    let resumeTimer: number | undefined;

    const step = () => {
      if (paused || !el) {
        timer = window.setTimeout(step, 2000);
        return;
      }
      const firstCard = el.querySelector<HTMLElement>("[data-card]");
      const gap = 16; // matches gap-4
      const cardWidth = (firstCard?.offsetWidth || 200) + gap;
      let target = el.scrollLeft + cardWidth;
      // Loop seamlessly when reached halfway
      if (target >= el.scrollWidth / 2) {
        target = 0;
        el.scrollTo({ left: 0, behavior: "auto" });
      } else {
        el.scrollTo({ left: target, behavior: "smooth" });
      }
      timer = window.setTimeout(step, 2000);
    };

    timer = window.setTimeout(step, 2000);

    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    // Pause briefly on manual interaction (wheel/touch/drag), then resume
    const pauseTemporarily = () => {
      paused = true;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => { paused = false; }, 3000);
    };

    // Drag-to-scroll with mouse (left-click press + drag)
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let moved = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.pointerType !== "mouse") return; // touch already scrolls natively
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      paused = true;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) {
        moved = true;
        try { el.setPointerCapture(e.pointerId); } catch {}
      }
      el.scrollLeft = startScrollLeft - dx;
    };
    const endDrag = (e?: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = "";
      el.style.userSelect = "";
      if (e) {
        try { el.releasePointerCapture(e.pointerId); } catch {}
      }
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => { paused = false; }, 3000);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchstart", onEnter, { passive: true });
    el.addEventListener("touchend", onLeave);
    el.addEventListener("wheel", pauseTemporarily, { passive: true });
    el.addEventListener("scroll", pauseTemporarily, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("pointerleave", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      if (timer) clearTimeout(timer);
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchstart", onEnter);
      el.removeEventListener("touchend", onLeave);
      el.removeEventListener("wheel", pauseTemporarily);
      el.removeEventListener("scroll", pauseTemporarily);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("pointerleave", endDrag);
      el.removeEventListener("click", onClickCapture, true);
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
          className="overflow-x-auto overflow-y-hidden scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-4 md:gap-6 w-max">
            {displayItems.map((p: any, idx: number) => (
              <div
                key={`${p.id}-${idx}`}
                data-card
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
