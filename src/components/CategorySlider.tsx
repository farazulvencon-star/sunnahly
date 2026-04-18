import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const CategorySlider = () => {
  const { data: categories } = useQuery({
    queryKey: ["storefront-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  if (!categories?.length) return null;

  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ক্যাটাগরি সমূহ</h2>
          <p className="text-muted-foreground mt-2">আপনার প্রয়োজন অনুযায়ী পণ্য বেছে নিন</p>
        </div>
        <div className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="shrink-0 w-[150px] md:w-[200px] snap-start group"
            >
              <div className="bg-secondary rounded-2xl overflow-hidden transition-all group-hover:shadow-lg group-hover:scale-[1.03]">
                <div className="w-full aspect-[300/350] bg-primary/5 flex items-center justify-center overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <Leaf className="h-12 w-12 text-primary/40" />
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;
