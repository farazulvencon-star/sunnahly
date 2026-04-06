import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, User, LogOut } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "পেন্ডিং", color: "bg-warning/10 text-warning" },
  confirmed: { label: "কনফার্মড", color: "bg-primary/10 text-primary" },
  processing: { label: "প্রসেসিং", color: "bg-accent text-accent-foreground" },
  shipped: { label: "শিপড", color: "bg-primary/10 text-primary" },
  delivered: { label: "ডেলিভারড", color: "bg-success/10 text-success" },
  cancelled: { label: "বাতিল", color: "bg-destructive/10 text-destructive" },
};

const Dashboard = () => {
  const { user, loading, signOut, isAdmin } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>
            <div className="flex gap-2">
              {isAdmin && (
                <Link to="/admin"><Button variant="outline" size="sm">অ্যাডমিন প্যানেল</Button></Link>
              )}
              <Button variant="outline" size="sm" onClick={signOut} className="gap-1">
                <LogOut className="h-4 w-4" /> লগআউট
              </Button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-card border rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{profile?.full_name || "ইউজার"}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
              </div>
            </div>
          </div>

          {/* Orders */}
          <h2 className="text-lg font-bold text-foreground mb-4">আমার অর্ডারসমূহ</h2>
          {orders?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>কোনো অর্ডার নেই</p>
              <Link to="/"><Button className="mt-3">কেনাকাটা করুন</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders?.map((order: any) => {
                const s = statusMap[order.order_status] || statusMap.pending;
                return (
                  <div key={order.id} className="bg-card border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-primary text-sm">{order.order_number}</span>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("bn-BD")}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      {order.order_items?.map((item: any) => (
                        <p key={item.id} className="text-muted-foreground">{item.product_name} x{item.quantity}</p>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t">
                      <span className="font-bold">৳{Number(order.total)}</span>
                      <Link to={`/order-success/${order.id}`}>
                        <Button variant="outline" size="sm">বিস্তারিত</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
