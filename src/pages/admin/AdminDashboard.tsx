import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, profiles] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, order_status"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const totalRevenue = orders.data?.reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0;
      const pendingOrders = orders.data?.filter((o: any) => o.order_status === "pending").length || 0;
      return {
        products: products.count || 0,
        orders: orders.data?.length || 0,
        customers: profiles.count || 0,
        revenue: totalRevenue,
        pendingOrders,
      };
    },
  });

  const cards = [
    { label: "মোট পণ্য", value: stats?.products || 0, icon: Package, color: "text-primary" },
    { label: "মোট অর্ডার", value: stats?.orders || 0, icon: ShoppingCart, color: "text-primary" },
    { label: "মোট কাস্টমার", value: stats?.customers || 0, icon: Users, color: "text-primary" },
    { label: "মোট আয়", value: `৳${stats?.revenue || 0}`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">ড্যাশবোর্ড</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border rounded-xl p-4">
            <card.icon className={`h-8 w-8 ${card.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>
      {stats?.pendingOrders ? (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
          <p className="font-medium text-foreground">{stats.pendingOrders}টি পেন্ডিং অর্ডার আছে</p>
          <p className="text-sm text-muted-foreground">অর্ডারসমূহ পেজ থেকে ম্যানেজ করুন</p>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
