import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "পেন্ডিং", color: "bg-warning/10 text-warning" },
  confirmed: { label: "কনফার্মড", color: "bg-primary/10 text-primary" },
  processing: { label: "প্রসেসিং", color: "bg-accent text-accent-foreground" },
  shipped: { label: "শিপ করা হয়েছে", color: "bg-primary/10 text-primary" },
  delivered: { label: "ডেলিভারি সম্পন্ন", color: "bg-success/10 text-success" },
  cancelled: { label: "বাতিল", color: "bg-destructive/10 text-destructive" },
};

const TrackOrder = () => {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .or(`order_number.eq.${query.trim()},customer_phone.eq.${query.trim()}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setOrder(data);
    if (!data) setNotFound(true);
    setLoading(false);
  };

  const status = order ? (statusMap[order.order_status] || statusMap.pending) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center mb-8">
            <Package className="h-12 w-12 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-foreground">অর্ডার ট্র্যাক করুন</h1>
            <p className="text-muted-foreground mt-1">অর্ডার নম্বর বা মোবাইল নম্বর দিয়ে খুঁজুন</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="NS-XXXXXXXX-XXXX বা 01XXXXXXXXX" />
            <Button type="submit" disabled={loading}><Search className="h-4 w-4" /></Button>
          </form>

          {notFound && <p className="text-center text-muted-foreground">অর্ডার পাওয়া যায়নি</p>}

          {order && (
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{order.order_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>{status?.label}</span>
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>তারিখ: {new Date(order.created_at).toLocaleDateString("bn-BD")}</p>
                <p>কাস্টমার: {order.customer_name}</p>
                <p>মোট: ৳{Number(order.total)}</p>
              </div>
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">পণ্যসমূহ:</h4>
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>৳{Number(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
