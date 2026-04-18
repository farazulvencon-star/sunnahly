import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Minus, Plus } from "lucide-react";
import { useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 px-4">
          <h1 className="text-xl font-bold text-foreground">পণ্যটি পাওয়া যায়নি</h1>
          <Link to="/">
            <Button>হোমপেজে ফিরে যান</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ["/placeholder.svg"];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        originalPrice: product.original_price ? Number(product.original_price) : undefined,
        image: images[0],
      });
    }
    toast.success(`${product.name} কার্টে যোগ হয়েছে`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" /> হোমপেজে ফিরে যান
          </Link>

          <div className="grid md:grid-cols-2 gap-6 md:gap-10">
            {/* Images */}
            <div className="w-full min-w-0">
              <div className="w-full rounded-xl bg-gray-100 mb-3 md:aspect-square md:bg-secondary md:overflow-hidden">
                <img
                  src={images[selectedImage] || images[0] || "/placeholder.svg"}
                  alt={product.name}
                  loading="eager"
                  className="w-full object-contain md:w-full md:h-full md:object-cover"
                  style={{ height: "300px" }}
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${selectedImage === i ? "border-primary" : "border-transparent"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              {product.categories?.name && (
                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                  {product.categories.name}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-3 mb-3">{product.name}</h1>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-primary">৳{Number(product.price)}</span>
                {product.original_price && (
                  <span className="text-lg text-muted-foreground line-through">৳{Number(product.original_price)}</span>
                )}
                {product.original_price && (
                  <span className="text-sm bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                    {Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)}% ছাড়
                  </span>
                )}
              </div>

              {product.short_description && <p className="text-muted-foreground mb-4">{product.short_description}</p>}

              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm font-medium">পরিমাণ:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                  <ShoppingCart className="h-4 w-4" /> কার্টে যোগ করুন
                </Button>
                <Link to="/checkout" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full" onClick={handleAddToCart}>
                    এখনই কিনুন
                  </Button>
                </Link>
              </div>

              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p>SKU: {product.sku || "N/A"}</p>
                <p>
                  স্টক:{" "}
                  {product.stock > 0 ? (
                    <span className="text-success font-medium">ইন স্টক ({product.stock})</span>
                  ) : (
                    <span className="text-destructive">স্টক আউট</span>
                  )}
                </p>
              </div>

              {product.description && (
                <div className="mt-8">
                  <h3 className="font-bold text-foreground mb-2">বিস্তারিত বিবরণ</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
