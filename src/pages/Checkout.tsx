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

  const { data: cartProducts } = useQuery({
    queryKey: ["cart-products-checkout", items.map(i => i.id).join(",")],
    queryFn: async () => {
      if (items.length === 0) return [];
      const { data } = await supabase.from("products").select("id, delivery_type, delivery_inside_dhaka, delivery_outside_dhaka, delivery_nationwide, payment_requirement").in("id", items.map(i => i.id));
      return data || [];
    },
    enabled: items.length > 0,
  });

  const globalInside = settings?.delivery_charge?.inside_dhaka ?? 60;
  const globalOutside = settings?.delivery_charge?.outside_dhaka ?? settings?.delivery_charge?.nationwide ?? 120;

  let insideCharge = Number(globalInside);
  let outsideCharge = Number(globalOutside);
  
  if (cartProducts && cartProducts.length > 0) {
    insideCharge = 0;
    outsideCharge = 0;
    cartProducts.forEach((p) => {
      let currIn = Number(globalInside);
      let currOut = Number(globalOutside);
      if (p.delivery_type === "custom") {
        currIn = Number(p.delivery_inside_dhaka ?? globalInside);
        currOut = Number(p.delivery_outside_dhaka ?? p.delivery_nationwide ?? globalOutside);
      }
      if (currIn > insideCharge) insideCharge = currIn;
      if (currOut > outsideCharge) outsideCharge = currOut;
    });
  }

  const deliveryCharge = city === "dhaka" ? insideCharge : outsideCharge;

  let reqAdvance = false;
  let reqFull = false;
  if (cartProducts) {
    cartProducts.forEach(p => {
      if (p.payment_requirement === "delivery_advance") reqAdvance = true;
      if (p.payment_requirement === "full_advance") reqFull = true;
    });
  }

  const grandTotal = Number(totalPrice) + Number(deliveryCharge);
  const isPaymentEnabled = settings?.payment_gateway?.enabled || false;
  const partialPercent = settings?.partial_payment_percent?.percent || 10;
  let partialAmount = paymentMethod === "partial" ? Math.ceil(Math.max(grandTotal * partialPercent / 100, deliveryCharge)) : 0;
  if (reqAdvance && paymentMethod === "partial") partialAmount = deliveryCharge;
  if (reqFull && paymentMethod === "partial") partialAmount = grandTotal;

  useEffect(() => {
    if (reqFull) setPaymentMethod("full");
    else if (reqAdvance && !isPaymentEnabled) setPaymentMethod("cod"); // fallback if gateway disabled
  }, [reqFull, reqAdvance, isPaymentEnabled]);

  // Save incomplete order data
  const saveIncompleteOrder = useCallback(async (currentForm: typeof form) => {

    const sessionId = getSessionId();
    const payload = {
      session_id: sessionId,
      customer_name: currentForm.name || null,
      customer_phone: currentForm.phone || null,
      shipping_address: currentForm.address || null,
      city: "বাংলাদেশ",
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
    const cleanName = form.name.trim();
    const cleanPhone = form.phone.replace(/[^\d+]/g, "").trim();
    const cleanAddress = form.address.trim();
    if (!cleanName || !cleanPhone || !cleanAddress) {
      toast.error("সকল প্রয়োজনীয় তথ্য পূরণ করুন");
      return;
    }
    if (cleanPhone.length < 11) {
      toast.error("সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)");
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
        customer_name: cleanName,
        customer_phone: cleanPhone,
        shipping_address: cleanAddress,
        city: "বাংলাদেশ",
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

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Mark incomplete order as converted (non-critical)
      if (incompleteIdRef.current) {
        try {
          await supabase.from("incomplete_orders").update({ is_converted: true }).eq("id", incompleteIdRef.current);
        } catch (e) { console.warn("incomplete update failed", e); }
      }

      // Send webhook (fire and forget, non-critical)
      try {
        if (settings?.order_webhook?.enabled && settings?.order_webhook?.url) {
          supabase.functions.invoke("order-webhook", {
            body: { order_id: order.id },
          }).catch((err) => console.error("Webhook failed:", err));
        }
      } catch (e) { console.warn("webhook invoke failed", e); }

      clearCart();
      sessionStorage.removeItem("checkout_session_id");
      // Facebook Pixel - Purchase (non-critical)
      try {
        window.fbq?.("track", "Purchase", {
          value: grandTotal,
          currency: "BDT",
          content_ids: items.map((i) => i.id),
          content_type: "product",
          num_items: items.length,
        });
      } catch (e) { console.warn("fbq failed", e); }
      toast.success("অর্ডার সফল হয়েছে!");
      navigate(`/order-success/${order.id}`);
    } catch (err: any) {
      let msg = err?.message || err?.error_description || err?.details || err?.hint;
      if (!msg) {
        try { msg = JSON.stringify(err); } catch { msg = "অজানা সমস্যা"; }
      }
      toast.error(`অর্ডার সমস্যা: ${msg}`, { duration: 10000 });
      console.error("Order error:", err);
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
                      <Input id="phone" type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" required />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="address">সম্পূর্ণ ঠিকানা *</Label>
                    <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="বাসা নং, রোড, এলাকা, জেলা" required rows={2} />
                  </div>
                </div>

                {/* Delivery Charge Info Card */}
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-4">ডেলিভারি এরিয়া</h3>
                  <RadioGroup value={city} onValueChange={setCity} className="space-y-3">
                    <div className="flex items-center gap-3 border rounded-lg p-3">
                      <RadioGroupItem value="dhaka" id="dhaka" />
                      <Label htmlFor="dhaka" className="cursor-pointer flex-1 flex justify-between items-center">
                        <span className="font-medium">ঢাকার ভেতর</span>
                        <span className="font-bold text-primary">৳{insideCharge}</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 border rounded-lg p-3">
                      <RadioGroupItem value="outside" id="outside" />
                      <Label htmlFor="outside" className="cursor-pointer flex-1 flex justify-between items-center">
                        <span className="font-medium">ঢাকার বাহিরে</span>
                        <span className="font-bold text-primary">৳{outsideCharge}</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment */}
                <div className="bg-card border rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-4">পেমেন্ট পদ্ধতি</h3>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    
                    {!reqFull && (
                      <div className="flex items-center gap-3 border rounded-lg p-3">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="cursor-pointer flex-1">
                          <span className="text-base font-bold text-foreground">{reqAdvance ? "ক্যাশ অন ডেলিভারি (অ্যাডভান্স প্রযোজ্য)" : "ক্যাশ অন ডেলিভারি (COD)"}</span>
                          <p className="text-sm text-muted-foreground mt-0.5">পণ্য হাতে পেয়ে, দেখে, বুঝে তারপরে পেমেন্ট করুন।</p>
                        </Label>
                      </div>
                    )}

                    {isPaymentEnabled && (
                      <div className="flex items-center gap-3 border rounded-lg p-3">
                        <RadioGroupItem value={reqFull ? "full" : "partial"} id="partial" />
                        <Label htmlFor="partial" className="cursor-pointer flex-1">
                          <span className="text-base font-bold text-foreground">{reqFull ? "সম্পূর্ণ টাকা অ্যাডভান্স (অনলাইন পেমেন্ট)" : reqAdvance ? "ডেলিভারি চার্জ অ্যাডভান্স করুন" : "আংশিক পেমেন্ট করে অর্ডার কনফার্ম করুন"}</span>
                          <p className="text-sm text-muted-foreground mt-0.5">বিকাশ, নগদ বা রকেটের মাধ্যমে নিরাপদে পেমেন্ট করুন।</p>
                        </Label>
                      </div>
                    )}
                    
                    {!isPaymentEnabled && reqFull && (
                       <div className="p-3 bg-primary/10 text-primary font-medium rounded-lg text-sm">
                         এই পণ্যের জন্য সম্পূর্ণ টাকা অ্যাডভান্স প্রযোজ্য। অর্ডার করার পর আমাদের প্রতিনিধি আপনাকে কল করে পেমেন্ট রিসিভ করবে।
                       </div>
                    )}
                    
                    {!isPaymentEnabled && reqAdvance && (
                       <div className="p-3 bg-primary/10 text-primary font-medium rounded-lg text-sm mt-2">
                         বিঃদ্রঃ এই অর্ডারের জন্য ডেলিভারি চার্জ অ্যাডভান্স প্রযোজ্য। অর্ডার করার পর আমাদের প্রতিনিধি আপনাকে কল করবে।
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
