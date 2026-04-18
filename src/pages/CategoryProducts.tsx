import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const CategoryProducts = () => {
  const { slug } = useParams();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("slug", slug!).single();
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["category-products", category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      const { data } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_active", true)
        .eq("category_id", category.id);
      return data || [];
    },
    enabled: !!category?.id,
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p: any) => p.name.toLowerCase().includes(s));
    }

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      result = result.filter((p: any) => {
        const price = Number(p.price);
        if (max) return price >= min && price <= max;
        return price >= min;
      });
    }

    switch (sortBy) {
      case "price-low": result.sort((a: any, b: any) => Number(a.price) - Number(b.price)); break;
      case "price-high": result.sort((a: any, b: any) => Number(b.price) - Number(a.price)); break;
      case "name": result.sort((a: any, b: any) => a.name.localeCompare(b.name)); break;
      default: result.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, search, sortBy, priceRange]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-6">
          <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" /> সকল পণ্য
          </Link>

          <div className="flex items-center gap-4 mb-6">
            {category?.image && (
              <img src={category.image} alt={category?.name} className="w-16 h-16 rounded-full object-cover border" />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{category?.name || "ক্যাটাগরি"}</h1>
              <p className="text-sm text-muted-foreground">{filtered.length}টি পণ্য</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="এই ক্যাটাগরিতে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" className="sm:hidden gap-2" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
            </Button>
            <div className={`flex flex-col sm:flex-row gap-3 ${showFilters ? "flex" : "hidden sm:flex"}`}>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="মূল্য" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল মূল্য</SelectItem>
                  <SelectItem value="0-500">৳০ - ৳৫০০</SelectItem>
                  <SelectItem value="500-1000">৳৫০০ - ৳১০০০</SelectItem>
                  <SelectItem value="1000-2000">৳১০০০ - ৳২০০০</SelectItem>
                  <SelectItem value="2000-99999">৳২০০০+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="সর্ট" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">নতুন আগে</SelectItem>
                  <SelectItem value="price-low">মূল্য: কম → বেশি</SelectItem>
                  <SelectItem value="price-high">মূল্য: বেশি → কম</SelectItem>
                  <SelectItem value="name">নাম অনুসারে</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((p: any) => (
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryProducts;
