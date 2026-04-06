import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, ArrowLeft, FolderOpen, AlertTriangle, MessageCircle, Code2, Image, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { path: "/admin", icon: LayoutDashboard, label: "ড্যাশবোর্ড" },
  { path: "/admin/categories", icon: FolderOpen, label: "ক্যাটেগরি" },
  { path: "/admin/products", icon: Package, label: "পণ্যসমূহ" },
  { path: "/admin/orders", icon: ShoppingCart, label: "অর্ডারসমূহ" },
  { path: "/admin/incomplete-orders", icon: AlertTriangle, label: "ইনকমপ্লিট" },
  { path: "/admin/customers", icon: Users, label: "কাস্টমার" },
  { path: "/admin/chat", icon: MessageCircle, label: "চ্যাট" },
  { path: "/admin/code-snippets", icon: Code2, label: "কোড স্নিপেট" },
  { path: "/admin/settings", icon: Settings, label: "সেটিংস" },
];

const AdminLayout = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  const { data: logoUrl } = useQuery({
    queryKey: ["site-logo"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "site_logo").single();
      return (data?.value as any)?.url || "";
    },
    staleTime: 1000 * 60 * 10,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user || !isAdmin) return <Navigate to="/admin-login" />;

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 bg-card border-r flex-col">
        <div className="p-4 border-b">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain mb-1" />
          ) : (
            <h1 className="font-bold text-primary text-lg">Natural Shefa</h1>
          )}
          <p className="text-xs text-muted-foreground">অ্যাডমিন প্যানেল</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                location.pathname === item.path ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> স্টোরে ফিরে যান
          </Link>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 flex justify-around py-2">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}
            className={cn("flex flex-col items-center gap-0.5 text-xs p-1",
              location.pathname === item.path ? "text-primary" : "text-muted-foreground")}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
