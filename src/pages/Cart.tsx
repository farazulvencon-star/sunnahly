import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 px-4 py-16">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
          <h1 className="text-xl font-bold text-foreground">আপনার কার্ট খালি</h1>
          <p className="text-muted-foreground">পণ্য যোগ করুন এবং কেনাকাটা শুরু করুন</p>
          <Link to="/"><Button>কেনাকাটা করুন</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">শপিং কার্ট ({items.length}টি পণ্য)</h1>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-card border rounded-xl p-3">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground line-clamp-2">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-primary">৳{item.price}</span>
                      {item.originalPrice && <span className="text-xs text-muted-foreground line-through">৳{item.originalPrice}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border rounded-lg">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card border rounded-xl p-5 h-fit sticky top-4">
              <h3 className="font-bold text-foreground mb-4">অর্ডার সারাংশ</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">সাবটোটাল</span>
                  <span>৳{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ডেলিভারি চার্জ</span>
                  <span className="text-muted-foreground">চেকআউটে</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>মোট</span>
                  <span className="text-primary">৳{totalPrice}</span>
                </div>
              </div>
              <Link to="/checkout">
                <Button className="w-full mt-4" size="lg">চেকআউটে যান</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full mt-2">কেনাকাটা চালিয়ে যান</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
