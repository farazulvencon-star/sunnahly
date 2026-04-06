import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AllProducts = () => {
  const { data: products } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const displayProducts = products?.length ? products.map((p: any) => ({
    id: p.id, name: p.name, price: Number(p.price), originalPrice: p.original_price ? Number(p.original_price) : undefined,
    image: p.images?.[0] || "/placeholder.svg", badge: p.badge, slug: p.slug,
  })) : [
    { name: "অর্গানিক নারকেল তেল", price: 420, originalPrice: 500, image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop" },
    { name: "ভেষজ হেয়ার অয়েল", price: 380, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop" },
    { name: "প্রাকৃতিক লিপ বাম", price: 180, originalPrice: 220, image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop", badge: "ছাড়" },
    { name: "অর্গানিক হলুদ গুঁড়া", price: 250, image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&h=400&fit=crop" },
  ];

  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">সকল পণ্য</h2>
          <p className="text-muted-foreground mt-2">আমাদের সম্পূর্ণ পণ্যের তালিকা</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {displayProducts.map((product: any, i: number) => (
            <ProductCard key={product.id || i} {...product} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" size="lg">আরও পণ্য দেখুন</Button>
        </div>
      </div>
    </section>
  );
};

export default AllProducts;
