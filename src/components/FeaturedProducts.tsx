import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
        .limit(4);
      return data || [];
    },
  });

  if (!products?.length) return null;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">ফিচার্ড পণ্য</h2>
            <p className="text-muted-foreground mt-1">আমাদের সবচেয়ে জনপ্রিয় পণ্যগুলো</p>
          </div>
          <Button variant="outline" className="hidden sm:flex gap-2">
            সবগুলো দেখুন <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p: any) => (
            <ProductCard
              key={p.id}
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
        <p className="text-center text-xs text-muted-foreground mt-6">
          প্রোডাক্ট ছবির রেকমেন্ডেড সাইজ: <strong>600×600px</strong> (1:1 স্কয়ার)
        </p>
      </div>
    </section>
  );
};

export default FeaturedProducts;
