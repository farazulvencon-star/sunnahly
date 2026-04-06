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
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="w-36 md:w-44 group"
            >
              <div className="bg-secondary rounded-2xl p-6 flex flex-col items-center gap-3 transition-all group-hover:bg-primary group-hover:shadow-lg">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <Leaf className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  )}
                </div>
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary-foreground transition-colors text-center">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          ক্যাটাগরি ছবির রেকমেন্ডেড সাইজ: <strong>200×200px</strong> (1:1 স্কয়ার)
        </p>
      </div>
    </section>
  );
};

export default CategorySlider;
