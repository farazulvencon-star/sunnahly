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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '0 16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>পণ্যটি পাওয়া যায়নি</h1>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <Header />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#6b7280', marginBottom: '16px', textDecoration: 'none' }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} /> হোমপেজে ফিরে যান
          </Link>

          <div style={{ display: 'grid', gap: '24px' }} className="md:grid-cols-2">
            {/* Images */}
            <div style={{ width: '100%', minWidth: 0 }}>
              {/* Main image - fixed with inline styles to avoid Tailwind conflicts */}
              <div style={{ width: '100%', backgroundColor: 'white', borderRadius: '12px', marginBottom: '12px', padding: '12px', border: '1px solid #f3f4f6', boxSizing: 'border-box' }}>
                <img
                  src={images[selectedImage] || images[0] || "/placeholder.svg"}
                  alt={product.name}
                  loading="eager"
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', maxHeight: '350px' }}
                />
              </div>

              {/* Thumbnail images */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: selectedImage === i ? '2px solid #16a34a' : '2px solid transparent',
                        flexShrink: 0,
                        padding: 0,
                        cursor: 'pointer',
                        backgroundColor: '#f3f4f6',
                      }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              {product.categories?.name && (
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 500, backgroundColor: 'rgba(22, 163, 74, 0.1)', padding: '4px 8px', borderRadius: '9999px' }}>
                  {product.categories.name}
                </span>
              )}
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginTop: '12px', marginBottom: '12px' }}>{product.name}</h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>৳{Number(product.price)}</span>
                {product.original_price && (
                  <span style={{ fontSize: '18px', color: '#6b7280', textDecoration: 'line-through' }}>৳{Number(product.original_price)}</span>
                )}
                {product.original_price && (
                  <span style={{ fontSize: '14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '9999px', fontWeight: 500 }}>
                    {Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)}% ছাড়
                  </span>
                )}
              </div>

              {product.short_description && (
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                  {product.short_description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>পরিমাণ:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                  <Button variant="ghost" size="icon" style={{ height: '36px', width: '36px' }} onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus style={{ width: '16px', height: '16px' }} />
                  </Button>
                  <span style={{ width: '40px', textAlign: 'center', fontWeight: 500 }}>{quantity}</span>
                  <Button variant="ghost" size="icon" style={{ height: '36px', width: '36px' }} onClick={() => setQuantity(quantity + 1)}>
                    <Plus style={{ width: '16px', height: '16px' }} />
                  </Button>
                </div>
              </div>

              {/* Buttons - fully responsive */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="sm:flex-row">
                <Button size="lg" style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }} onClick={handleAddToCart}>
                  <ShoppingCart style={{ width: '16px', height: '16px' }} /> কার্টে যোগ করুন
                </Button>
                <Link to="/checkout" style={{ flex: 1 }}>
                  <Button size="lg" variant="outline" style={{ width: '100%' }} onClick={handleAddToCart}>
                    এখনই কিনুন
                  </Button>
                </Link>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                <p>
                  <span style={{ fontWeight: 500 }}>SKU:</span> {product.sku || "N/A"}
                </p>
                <p>
                  <span style={{ fontWeight: 500 }}>স্টক:</span> {product.stock > 0 ? <span style={{ color: '#16a34a', fontWeight: 500 }}>ইন স্টক ({product.stock})</span> : <span style={{ color: '#ef4444' }}>স্টক আউট</span>}
                </p>
              </div>

              {product.description && (
                <div style={{ marginTop: '32px' }}>
                  <h3 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                    বিস্তারিত বিবরণ
                  </h3>
                  <p style={{ color: '#6b7280', whiteSpace: 'pre-line' }}>
                    {product.description}
                  </p>
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