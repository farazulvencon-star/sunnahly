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
      const raw = data?.value;
      if (!raw) return { desktop: 6, mobile: 3, title: "Featured Categories" };
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return { desktop: 6, mobile: 3, title: "Featured Categories", ...parsed };
    },
  });

  if (!categories?.length) return null;

  const sectionTitle = gridSettings?.title || "Featured Categories";

  return (
    <section className="py-6 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
            {sectionTitle}
          </h2>
          {gridSettings?.subtitle && (
            <p className="text-muted-foreground text-sm mt-1.5">{gridSettings.subtitle}</p>
          )}
        </div>
        <style>{`
          .category-grid-custom {
            display: grid;
            gap: 0.75rem;
            grid-template-columns: repeat(${gridSettings?.mobile || 3}, minmax(0, 1fr));
          }
          @media (min-width: 640px) {
            .category-grid-custom {
              gap: 1rem;
            }
          }
          @media (min-width: 768px) {
            .category-grid-custom {
              gap: 1.25rem;
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
              <div className="bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="w-full aspect-[4/3] sm:aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden p-2.5 sm:p-3">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <Leaf className="h-10 w-10 text-primary/40" />
                  )}
                </div>
                <div className="p-2 sm:p-2.5 text-center">
                  <h3 className="font-medium text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
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
