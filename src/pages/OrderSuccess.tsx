import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Package } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const OrderSuccess = () => {
  const { orderId } = useParams();

  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handleDownloadInvoice = () => {
    if (!order) return;
    const invoiceContent = `
    ═══════════════════════════════════
         Natural Shefa - ইনভয়েস
    ═══════════════════════════════════
    অর্ডার নম্বর: ${order.order_number}
    তারিখ: ${new Date(order.created_at).toLocaleDateString("bn-BD")}
    
    কাস্টমার: ${order.customer_name}
    ফোন: ${order.customer_phone}
    ঠিকানা: ${order.shipping_address}, ${order.city}
    
    ─────────────────────────────────
    পণ্যসমূহ:
    ${order.order_items?.map((item: any) => `  ${item.product_name} x${item.quantity} = ৳${item.total}`).join("\n") || ""}
    ─────────────────────────────────
    সাবটোটাল: ৳${order.subtotal}
    ডেলিভারি: ৳${order.delivery_charge}
    মোট: ৳${order.total}
    পেমেন্ট: ${order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : "আংশিক পেমেন্ট"}
    ═══════════════════════════════════
    `;
    const blob = new Blob([invoiceContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.order_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">অর্ডার সফল হয়েছে!</h1>
          <p className="text-muted-foreground mb-2">আপনার অর্ডারটি সফলভাবে প্লেস হয়েছে।</p>
          {order && (
            <div className="bg-card border rounded-xl p-5 text-left mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">অর্ডার নম্বর</span>
                <span className="font-bold text-primary">{order.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">মোট</span>
                <span className="font-bold">৳{Number(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">পেমেন্ট</span>
                <span>{order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : "আংশিক অনলাইন"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">স্ট্যাটাস</span>
                <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-full text-xs font-medium">পেন্ডিং</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2 mt-6">
            <Button variant="outline" className="gap-2" onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4" /> ইনভয়েস ডাউনলোড
            </Button>
            <Link to="/track-order">
              <Button variant="outline" className="gap-2 w-full">
                <Package className="h-4 w-4" /> অর্ডার ট্র্যাক করুন
              </Button>
            </Link>
            <Link to="/"><Button className="w-full">হোমপেজে ফিরে যান</Button></Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
