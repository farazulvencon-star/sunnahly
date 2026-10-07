import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Minus, Plus, ShieldCheck, Truck, Clock, CheckCircle2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedProducts from "@/components/FeaturedProducts";
import AllProducts from "@/components/AllProducts";
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

  const rawImages: unknown = product.images;
  const images = (() => {
    if (Array.isArray(rawImages)) {
      const validImages = rawImages.filter((image): image is string => typeof image === "string" && image.trim().length > 0);
      return validImages.length > 0 ? validImages : ["/placeholder.svg"];
    }

    if (typeof rawImages === "string" && rawImages.trim() !== "") {
      try {
        const parsed: unknown = JSON.parse(rawImages);
        if (Array.isArray(parsed)) {
          const validImages = parsed.filter((image): image is string => typeof image === "string" && image.trim().length > 0);
          if (validImages.length > 0) return validImages;
        }
      } catch {
        return [rawImages];
      }

      return [rawImages];
    }

    return ["/placeholder.svg"];
  })();

  const safeSelectedImage = selectedImage < images.length ? selectedImage : 0;
  const currentImage = images[safeSelectedImage] ?? images[0] ?? "/placeholder.svg";

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
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" /> হোমপেজে ফিরে যান
          </Link>

          <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
            {/* Images */}
            <div className="w-full min-w-0 mx-auto max-w-full sm:max-w-[420px] md:max-w-[380px] lg:max-w-none lg:mx-0">
              <div className="mb-3 aspect-square w-full max-w-full overflow-hidden rounded-xl border border-border/60 bg-secondary/30 lg:bg-secondary">
                <img
                  key={currentImage}
                  src={currentImage}
                  alt={product.name}
                  loading="eager"
                  onError={(event) => {
                    event.currentTarget.src = "/placeholder.svg";
                  }}
                  className="block h-full w-full object-contain p-3 lg:object-cover lg:p-0"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-card flex-shrink-0 sm:h-20 sm:w-20 ${safeSelectedImage === i ? "border-primary" : "border-transparent"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full min-w-0 max-w-full mx-auto md:max-w-xl lg:max-w-none lg:mx-0">
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

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="flex-1 gap-2 h-12 text-base font-semibold sm:h-11 sm:text-sm" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5 sm:h-4 sm:w-4" /> কার্টে যোগ করুন
                </Button>
                <Link to="/checkout" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full h-12 text-base font-semibold sm:h-11 sm:text-sm" onClick={handleAddToCart}>
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

            </div>
          </div>

          {product.description && (
            <div className="mt-8 lg:mt-12 w-full max-w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-border/50">
              <h3 className="font-bold text-foreground mb-4 text-xl border-b pb-2 inline-block border-primary">বিস্তারিত বিবরণ</h3>
              {/<\/?[a-z][\s\S]*>/i.test(product.description) ? (
                <div 
                  className="text-muted-foreground break-words leading-relaxed text-base md:text-lg prose max-w-none prose-p:my-2 prose-headings:my-3 prose-a:text-primary prose-ul:my-2 prose-li:my-0.5"
                  dangerouslySetInnerHTML={{ __html: product.description.replace(/```(html)?/gi, '') }}
                />
              ) : (
                <div className="text-muted-foreground whitespace-pre-line break-words leading-relaxed text-base md:text-lg">
                  {product.description}
                </div>
              )}
            </div>
          )}

          {/* Landing Page Style Sections */}
          <div className="mt-12 space-y-12">
            {/* Why Choose Us */}
            <div className="bg-primary/5 rounded-3xl p-8 md:p-12 text-center border border-primary/10">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-foreground">কেন আমাদের পণ্যটি সেরা?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">১০০% আসল পণ্য</h3>
                  <p className="text-muted-foreground text-sm">আমরা সরাসরি প্রস্তুতকারক থেকে অরিজিনাল পণ্য সংগ্রহ করি, তাই কোয়ালিটি নিয়ে কোনো আপস নেই।</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">সুপার ফাস্ট ডেলিভারি</h3>
                  <p className="text-muted-foreground text-sm">অর্ডার করার পর যত দ্রুত সম্ভব আপনার ঠিকানায় পণ্য পৌঁছে দিতে আমরা বদ্ধপরিকর।</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">২৪/৭ কাস্টমার সাপোর্ট</h3>
                  <p className="text-muted-foreground text-sm">পণ্য সংক্রান্ত যেকোনো প্রয়োজনে আমাদের এক্সপার্ট টিম আপনাকে সাহায্য করতে প্রস্তুত।</p>
                </div>
              </div>
            </div>

            {/* How to order */}
            <div className="py-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-foreground">যেভাবে অর্ডার করবেন</h2>
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">১</div>
                  <p className="font-medium">নিচের <span className="text-primary font-bold">"এখনই কিনুন"</span> বাটনে ক্লিক করুন।</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">২</div>
                  <p className="font-medium">আপনার নাম, মোবাইল নাম্বার এবং সম্পূর্ণ ঠিকানা সঠিকভাবে লিখুন।</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">৩</div>
                  <p className="font-medium">"অর্ডার কনফার্ম করুন" বাটনে ক্লিক করে আপনার অর্ডারটি নিশ্চিত করুন।</p>
                </div>
              </div>
            </div>

            {/* Final CTA Banner */}
            <div className="bg-gradient-to-r from-primary/90 to-primary text-white rounded-3xl p-8 md:p-12 text-center shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold mb-4">আর দেরি কেন?</h2>
                <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">স্টক ফুরিয়ে যাওয়ার আগেই আপনার প্রয়োজনীয় পণ্যটি আজই অর্ডার করুন এবং উপভোগ করুন সেরা শপিং অভিজ্ঞতা।</p>
                <Link to="/checkout" onClick={handleAddToCart} className="inline-block bg-white text-primary font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-gray-50 transition-transform hover:scale-105">
                  এখনই অর্ডার করুন
                </Link>
                <p className="mt-4 text-sm opacity-80 flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" /> ১০০% নিরাপদ শপিং
                </p>
              </div>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
        <FeaturedProducts />
        <AllProducts />
      </main>
      
      {/* Sticky Mobile Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 sm:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-full duration-300">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">সর্বমোট মূল্য</span>
          <span className="font-bold text-primary text-lg">৳{Number(product.price) * quantity}</span>
        </div>
        <Link to="/checkout" className="flex-1" onClick={handleAddToCart}>
          <Button size="lg" className="w-full font-bold h-12 rounded-full shadow-md animate-pulse-slow">
            অর্ডার করুন
          </Button>
        </Link>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
