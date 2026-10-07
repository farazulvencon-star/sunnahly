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

  const { data: gridSettings } = useQuery({
    queryKey: ["category-grid-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "category_grid").single();
      return data?.value || { desktop: 6, mobile: 3 };
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
        <style>{`
          .category-grid-custom {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(${gridSettings?.mobile || 3}, minmax(0, 1fr));
          }
          @media (min-width: 768px) {
            .category-grid-custom {
              gap: 1.5rem;
              grid-template-columns: repeat(${gridSettings?.desktop || 6}, minmax(0, 1fr));
            }
          }
        `}</style>
        <div className="category-grid-custom pb-2">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group block"
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
