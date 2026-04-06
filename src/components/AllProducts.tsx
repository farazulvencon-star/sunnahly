import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AllProducts = () => {
  const { data: products } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  if (!products?.length) return null;

  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">সকল পণ্য</h2>
          <p className="text-muted-foreground mt-2">আমাদের সম্পূর্ণ পণ্যের তালিকা</p>
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
          <div className="text-center mt-8">
            <Link to="/products">
              <Button variant="outline" size="lg">সকল পণ্য দেখুন →</Button>
            </Link>
          </div>
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
      </div>
    </section>
  );
};

export default AllProducts;
