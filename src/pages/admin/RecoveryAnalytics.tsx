import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, ShoppingCart, AlertTriangle, DollarSign, Target, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(126, 54%, 24%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

const RecoveryAnalytics = () => {
  const { data: analytics } = useQuery({
    queryKey: ["recovery-analytics"],
    queryFn: async () => {
      const [incompleteRes, convertedRes, ordersRes] = await Promise.all([
        supabase.from("incomplete_orders").select("*").eq("is_converted", false),
        supabase.from("incomplete_orders").select("*").eq("is_converted", true),
        supabase.from("orders").select("id, total, created_at, notes"),
      ]);

      const incomplete = incompleteRes.data || [];
      const converted = convertedRes.data || [];
      const allOrders = ordersRes.data || [];
      const recoveredOrders = allOrders.filter((o: any) => o.notes?.includes("ইনকমপ্লিট অর্ডার থেকে রিকভার"));

      const totalIncomplete = incomplete.length + converted.length;
      const conversionRate = totalIncomplete > 0 ? Math.round((converted.length / totalIncomplete) * 100) : 0;
      const totalLostValue = incomplete.reduce((sum: number, o: any) => sum + (Number(o.cart_total) || 0), 0);
      const totalRecoveredValue = recoveredOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);

      // Daily trend (last 7 days)
      const dailyTrend: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        const dayLabel = date.toLocaleDateString("bn-BD", { weekday: "short", day: "numeric" });

        const dayIncomplete = incomplete.filter((o: any) => o.created_at?.slice(0, 10) === dateStr).length;
        const dayConverted = converted.filter((o: any) => o.updated_at?.slice(0, 10) === dateStr).length;
        const dayRecovered = recoveredOrders.filter((o: any) => o.created_at?.slice(0, 10) === dateStr)
          .reduce((s: number, o: any) => s + Number(o.total), 0);

        dailyTrend.push({ date: dayLabel, incomplete: dayIncomplete, converted: dayConverted, recovered: dayRecovered });
      }

      // Completion funnel
      const withName = incomplete.filter((o: any) => o.customer_name).length;
      const withPhone = incomplete.filter((o: any) => o.customer_phone).length;
      const withAddress = incomplete.filter((o: any) => o.shipping_address).length;
      const withCart = incomplete.filter((o: any) => (o.cart_items || []).length > 0).length;

      const funnel = [
        { step: "চেকআউট পেজ", count: totalIncomplete, percent: 100 },
        { step: "নাম দিয়েছে", count: withName + converted.length, percent: totalIncomplete > 0 ? Math.round(((withName + converted.length) / totalIncomplete) * 100) : 0 },
        { step: "ফোন দিয়েছে", count: withPhone + converted.length, percent: totalIncomplete > 0 ? Math.round(((withPhone + converted.length) / totalIncomplete) * 100) : 0 },
        { step: "ঠিকানা দিয়েছে", count: withAddress + converted.length, percent: totalIncomplete > 0 ? Math.round(((withAddress + converted.length) / totalIncomplete) * 100) : 0 },
        { step: "কার্টে পণ্য", count: withCart + converted.length, percent: totalIncomplete > 0 ? Math.round(((withCart + converted.length) / totalIncomplete) * 100) : 0 },
        { step: "অর্ডার সম্পন্ন", count: converted.length, percent: conversionRate },
      ];

      const pieData = [
        { name: "রিকভার করা", value: converted.length },
        { name: "পেন্ডিং", value: incomplete.length },
      ];

      return {
        totalIncomplete: incomplete.length,
        totalConverted: converted.length,
        conversionRate,
        totalLostValue,
        totalRecoveredValue,
        dailyTrend,
        funnel,
        pieData,
      };
    },
  });

  const stats = [
    { label: "পেন্ডিং ইনকমপ্লিট", value: analytics?.totalIncomplete || 0, icon: AlertTriangle, color: "text-warning" },
    { label: "রিকভার করা অর্ডার", value: analytics?.totalConverted || 0, icon: ShoppingCart, color: "text-primary" },
    { label: "রিকভারি রেট", value: `${analytics?.conversionRate || 0}%`, icon: Target, color: "text-primary" },
    { label: "রিকভার করা মূল্য", value: `৳${analytics?.totalRecoveredValue || 0}`, icon: DollarSign, color: "text-primary" },
    { label: "হারানো মূল্য", value: `৳${analytics?.totalLostValue || 0}`, icon: TrendingUp, color: "text-destructive" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/incomplete-orders">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">রিকভারি অ্যানালিটিক্স</h1>
          <p className="text-sm text-muted-foreground">ইনকমপ্লিট অর্ডার রিকভারি পারফরম্যান্স</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border rounded-xl p-4">
            <s.icon className={`h-5 w-5 ${s.color} mb-1.5`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Daily Trend */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> দৈনিক ট্রেন্ড (শেষ ৭ দিন)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 15%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="incomplete" name="ইনকমপ্লিট" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="converted" name="রিকভার" fill="hsl(126, 54%, 24%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4">রিকভারি রেশিও</h3>
          <div className="h-64 flex items-center justify-center">
            {(analytics?.totalIncomplete || 0) + (analytics?.totalConverted || 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics?.pieData || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {analytics?.pieData?.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">ডেটা নেই</p>
            )}
          </div>
        </div>
      </div>

      {/* Recovery Value Trend */}
      <div className="bg-card border rounded-xl p-5 mb-6">
        <h3 className="font-bold text-foreground mb-4">রিকভারি মূল্য ট্রেন্ড (৳)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics?.dailyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 15%, 90%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`৳${v}`, "রিকভার"]} />
              <Line type="monotone" dataKey="recovered" stroke="hsl(126, 54%, 24%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-bold text-foreground mb-4">কনভার্শন ফানেল</h3>
        <div className="space-y-2">
          {analytics?.funnel?.map((step: any, i: number) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">{step.step}</span>
                <span className="text-muted-foreground">{step.count} ({step.percent}%)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${step.percent}%`,
                    backgroundColor: i === analytics.funnel.length - 1 ? "hsl(126, 54%, 24%)" : `hsl(126, ${20 + i * 8}%, ${60 - i * 6}%)`,
                  }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecoveryAnalytics;
