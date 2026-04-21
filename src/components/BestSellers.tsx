import ProductCard from "./ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BestSellers = () => {
  const { data: products } = useQuery({
    queryKey: ["bestseller-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_bestseller", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  if (!products?.length) return null;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">সবচেয়ে বিক্রিত পণ্য</h2>
          <p className="text-muted-foreground mt-2">গ্রাহকদের পছন্দের শীর্ষে যে পণ্যগুলো</p>
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
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
