import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, ShoppingCart, Users, TrendingUp, AlertTriangle, BarChart3, RefreshCw, Lock, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Basic stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, profiles, categories, incompleteOrders] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, order_status, payment_status, created_at, is_trashed").eq("is_trashed", false),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("incomplete_orders").select("id", { count: "exact", head: true }),
      ]);
      const orderData = orders.data || [];
      const totalRevenue = orderData.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const pendingOrders = orderData.filter((o: any) => o.order_status === "pending").length;
      const deliveredOrders = orderData.filter((o: any) => o.order_status === "delivered").length;
      const cancelledOrders = orderData.filter((o: any) => o.order_status === "cancelled").length;
      const paidOrders = orderData.filter((o: any) => o.payment_status === "paid").length;

      return {
        products: products.count || 0,
        orders: orderData.length,
        customers: profiles.count || 0,
        categories: categories.count || 0,
        revenue: totalRevenue,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        paidOrders,
        incompleteOrders: incompleteOrders.count || 0,
        orderData,
      };
    },
  });

  // Orders by day (last 7 days)
  const ordersByDay = (() => {
    if (!stats?.orderData) return [];
    const days: Record<string, { date: string; orders: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      days[d] = { date: format(subDays(new Date(), i), "dd MMM"), orders: 0, revenue: 0 };
    }
    stats.orderData.forEach((o: any) => {
      const d = format(new Date(o.created_at), "yyyy-MM-dd");
      if (days[d]) {
        days[d].orders += 1;
        days[d].revenue += Number(o.total);
      }
    });
    return Object.values(days);
  })();

  // Order status distribution
  const statusData = [
    { name: "পেন্ডিং", value: stats?.pendingOrders || 0 },
    { name: "ডেলিভারড", value: stats?.deliveredOrders || 0 },
    { name: "বাতিল", value: stats?.cancelledOrders || 0 },
    { name: "অন্যান্য", value: Math.max(0, (stats?.orders || 0) - (stats?.pendingOrders || 0) - (stats?.deliveredOrders || 0) - (stats?.cancelledOrders || 0)) },
  ].filter(d => d.value > 0);

  const COLORS = ["hsl(var(--primary))", "hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)", "hsl(var(--muted-foreground))"];

  // Password change
  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে"); return; }
    if (newPassword !== confirmPassword) { toast.error("পাসওয়ার্ড মিলছে না"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ");
    } finally {
      setChangingPassword(false);
    }
  };

  // Site reset
  const handleReset = async () => {
    setResetting(true);
    try {
      // Delete order items first (FK), then orders, products, categories
      await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("incomplete_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      queryClient.invalidateQueries();
      toast.success("সাইট রিসেট হয়েছে! সব ডাটা মুছে ফেলা হয়েছে।");
    } catch (err: any) {
      toast.error(err.message || "রিসেট ব্যর্থ");
    } finally {
      setResetting(false);
    }
  };

  const summaryCards = [
    { label: "মোট পণ্য", value: stats?.products || 0, icon: Package },
    { label: "মোট অর্ডার", value: stats?.orders || 0, icon: ShoppingCart },
    { label: "মোট কাস্টমার", value: stats?.customers || 0, icon: Users },
    { label: "মোট আয়", value: `৳${(stats?.revenue || 0).toLocaleString()}`, icon: TrendingUp },
    { label: "ক্যাটেগরি", value: stats?.categories || 0, icon: BarChart3 },
    { label: "ইনকমপ্লিট", value: stats?.incompleteOrders || 0, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-card border rounded-xl p-4">
            <card.icon className="h-6 w-6 text-primary mb-2" />
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {(stats?.pendingOrders || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{stats?.pendingOrders}টি পেন্ডিং অর্ডার আছে</p>
            <p className="text-sm text-muted-foreground">অর্ডারসমূহ পেজ থেকে ম্যানেজ করুন</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Orders & Revenue Chart */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4 text-sm">গত ৭ দিনের অর্ডার ও আয়</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: any, name: string) => [name === "revenue" ? `৳${value}` : value, name === "revenue" ? "আয়" : "অর্ডার"]}
                />
                <Legend formatter={(v) => v === "orders" ? "অর্ডার" : "আয় (৳)"} />
                <Bar yAxisId="left" dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4 text-sm">অর্ডার স্ট্যাটাস বিশ্লেষণ</h3>
          <div className="h-[250px] flex items-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}টি`, "অর্ডার"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center w-full">কোনো ডাটা নেই</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-bold text-foreground mb-4 text-sm">আয়ের ট্রেন্ড (৭ দিন)</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: any) => [`৳${value}`, "আয়"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-2 text-sm">পেমেন্ট সামারি</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">পেইড অর্ডার</span>
              <span className="font-bold text-foreground">{stats?.paidOrders || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">আনপেইড</span>
              <span className="font-bold text-foreground">{(stats?.orders || 0) - (stats?.paidOrders || 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">কনভার্সন রেট</span>
              <span className="font-bold text-primary">
                {stats?.orders ? `${Math.round((stats.deliveredOrders / stats.orders) * 100)}%` : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" /> পাসওয়ার্ড পরিবর্তন
          </h3>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">নতুন পাসওয়ার্ড</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষর" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="আবার লিখুন" className="h-8 text-sm" />
            </div>
            <Button size="sm" className="w-full" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
              {changingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Lock className="h-3.5 w-3.5 mr-1" />}
              পরিবর্তন করুন
            </Button>
          </div>
        </div>

        {/* Site Reset */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-2 text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> সাইট রিসেট
          </h3>
          <p className="text-xs text-muted-foreground mb-3">সব পণ্য, ক্যাটেগরি, অর্ডার ও রিভিউ মুছে একটি ফ্রেশ সাইট পাবেন। সেটিংস ও ইউজার অপরিবর্তিত থাকবে।</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> সম্পূর্ণ রিসেট করুন
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ সাইট রিসেট করতে চান?</AlertDialogTitle>
                <AlertDialogDescription>
                  এটি সব পণ্য, ক্যাটেগরি, অর্ডার, রিভিউ এবং ইনকমপ্লিট অর্ডার স্থায়ীভাবে মুছে ফেলবে। এই কাজটি আর ফেরত নেওয়া যাবে না!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={resetting}>
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  হ্যাঁ, রিসেট করুন
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
