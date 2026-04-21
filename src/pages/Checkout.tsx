import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingCart } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const getSessionId = () => {
  let id = sessionStorage.getItem("checkout_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("checkout_session_id", id);
  }
  return id;
};

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("dhaka");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const incompleteIdRef = useRef<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async () => {
      const keys = ["delivery_charge", "payment_gateway", "partial_payment_percent"];
      const map: Record<string, any> = {};
      await Promise.all(
        keys.map(async (k) => {
          const { data } = await supabase.rpc("get_public_setting", { _key: k });
          map[k] = data;
        })
      );
      return map;
    },
  });

  const deliveryCharge = settings?.delivery_charge?.nationwide
    ?? settings?.delivery_charge?.inside_dhaka
    ?? 60;

  const grandTotal = totalPrice + deliveryCharge;
  const isPaymentEnabled = settings?.payment_gateway?.enabled || false;
  const partialPercent = settings?.partial_payment_percent?.percent || 10;
  const partialAmount = paymentMethod === "partial" ? Math.ceil(Math.max(grandTotal * partialPercent / 100, deliveryCharge)) : 0;

  // Save incomplete order data
  const saveIncompleteOrder = useCallback(async (currentForm: typeof form) => {

    const sessionId = getSessionId();
    const payload = {
      session_id: sessionId,
      customer_name: currentForm.name || null,
      customer_phone: currentForm.phone || null,
      shipping_address: currentForm.address || null,
      city: city === "dhaka" ? "ঢাকা" : "ঢাকার বাইরে",
      cart_items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      cart_total: totalPrice,
      last_activity: new Date().toISOString(),
    };

    try {
      if (incompleteIdRef.current) {
        await supabase.from("incomplete_orders").update(payload).eq("id", incompleteIdRef.current);
      } else {
        const { data } = await supabase.from("incomplete_orders").insert(payload).select("id").single();
        if (data) incompleteIdRef.current = data.id;
      }
    } catch (err) {
      console.error("Failed to save incomplete order:", err);
    }
  }, [items, totalPrice, city]);

  // Save immediately on first load
  const initialSaveRef = useRef(false);
  useEffect(() => {
    if (items.length === 0 || initialSaveRef.current) return;
    initialSaveRef.current = true;
    saveIncompleteOrder(form);
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save on form change
  useEffect(() => {
    if (items.length === 0) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveIncompleteOrder(form);
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form, city, items, saveIncompleteOrder]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar /><Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4 px-4 py-16">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
          <h1 className="text-xl font-bold text-foreground">কার্ট খালি</h1>
          <Link to="/"><Button>কেনাকাটা করুন</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      toast.error("সকল প্রয়োজনীয় তথ্য পূরণ করুন");
      return;
    }
    // Facebook Pixel - InitiateCheckout
    window.fbq?.("track", "InitiateCheckout", {
      value: grandTotal,
      currency: "BDT",
      num_items: items.length,
    });
    setLoading(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user?.id || null,
        customer_name: form.name,
        customer_phone: form.phone,
        shipping_address: form.address,
        city: city === "dhaka" ? "ঢাকা" : "ঢাকার বাইরে",
        subtotal: totalPrice,
        delivery_charge: deliveryCharge,
        total: grandTotal,
        partial_payment: partialAmount,
        due_amount: grandTotal - partialAmount,
        payment_method: paymentMethod,
      }).select().single();

      if (error) throw error;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }));

      await supabase.from("order_items").insert(orderItems);

      // Mark incomplete order as converted
      if (incompleteIdRef.current) {
        await supabase.from("incomplete_orders").update({ is_converted: true }).eq("id", incompleteIdRef.current);
      }

      // Send webhook (fire and forget)
      if (settings?.order_webhook?.enabled && settings?.order_webhook?.url) {
        supabase.functions.invoke("order-webhook", {
          body: { order_id: order.id },
        }).catch((err) => console.error("Webhook failed:", err));
      }

      clearCart();
      sessionStorage.removeItem("checkout_session_id");
      // Facebook Pixel - Purchase
      window.fbq?.("track", "Purchase", {
        value: grandTotal,
        currency: "BDT",
        content_ids: items.map((i) => i.id),
        content_type: "product",
        num_items: items.length,
      });
      toast.success("অর্ডার সফল হয়েছে!");
      navigate(`/order-success/${order.id}`);
    } catch (err: any) {
      toast.error("অর্ডার প্লেস করতে সমস্যা হয়েছে");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">চেকআউট</h1>
          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Info */}
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-4">ডেলিভারি তথ্য</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">নাম *</Label>
                      <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" required />
                    </div>
                    <div>
                      <Label htmlFor="phone">মোবাইল নম্বর *</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" required />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="address">সম্পূর্ণ ঠিকানা *</Label>
                    <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="বাসা নং, রোড, এলাকা, জেলা" required />
                    <p className="text-xs text-muted-foreground mt-1">সারা দেশে ডেলিভারি চার্জ ৳{deliveryCharge}</p>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-4">পেমেন্ট পদ্ধতি</h3>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div className="flex items-center gap-3 border rounded-lg p-3">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="cursor-pointer flex-1">
                        <span className="font-medium">ক্যাশ অন ডেলিভারি (COD)</span>
                        <p className="text-xs text-muted-foreground">পণ্য হাতে পেয়ে পেমেন্ট করুন</p>
                      </Label>
                    </div>
                    {isPaymentEnabled && (
                      <div className="flex items-center gap-3 border rounded-lg p-3">
                        <RadioGroupItem value="partial" id="partial" />
                        <Label htmlFor="partial" className="cursor-pointer flex-1">
                          <span className="font-medium">আংশিক অনলাইন পেমেন্ট</span>
                          <p className="text-xs text-muted-foreground">মোটের {partialPercent}% বা ডেলিভারি চার্জ (যেটি বেশি) এখনই পে করুন</p>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-card border rounded-xl p-5 h-fit sticky top-4">
                <h3 className="font-bold text-foreground mb-4">অর্ডার সারাংশ</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-2 text-sm">
                      <img src={item.image} alt="" className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-1 text-foreground">{item.name}</p>
                        <p className="text-muted-foreground">৳{item.price} x {item.quantity}</p>
                      </div>
                      <span className="font-medium">৳{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>৳{totalPrice}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি চার্জ</span><span>৳{deliveryCharge}</span></div>
                  {paymentMethod === "partial" && (
                    <div className="flex justify-between text-primary"><span>আংশিক পেমেন্ট</span><span>৳{partialAmount}</span></div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-base">
                    <span>মোট</span><span className="text-primary">৳{grandTotal}</span>
                  </div>
                  {paymentMethod === "partial" && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>বাকি (COD)</span><span>৳{grandTotal - partialAmount}</span>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
                  {loading ? "প্রসেস হচ্ছে..." : "অর্ডার কনফার্ম করুন"}
                </Button>
                {!user && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    একাউন্ট আছে? <Link to="/auth" className="text-primary underline">লগইন করুন</Link>
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
