import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, User, LogOut, Edit, Lock, Eye, EyeOff } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "পেন্ডিং", color: "bg-warning/10 text-warning" },
  confirmed: { label: "কনফার্মড", color: "bg-primary/10 text-primary" },
  processing: { label: "প্রসেসিং", color: "bg-accent text-accent-foreground" },
  shipped: { label: "শিপড", color: "bg-primary/10 text-primary" },
  delivered: { label: "ডেলিভারড", color: "bg-success/10 text-success" },
  cancelled: { label: "বাতিল", color: "bg-destructive/10 text-destructive" },
};

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "password">("orders");
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", address: "", city: "", area: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (data) {
        setProfileForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          area: data.area || "",
        });
      }
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

  const profileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(profileForm).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("প্রোফাইল আপডেট হয়েছে");
      setEditProfile(false);
    },
    onError: () => toast.error("আপডেট ব্যর্থ হয়েছে"),
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error("নতুন পাসওয়ার্ড মিলছে না");
      return;
    }
    if (passwordForm.newPass.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে");
      return;
    }
    setPassLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass });
      if (error) throw error;
      toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
      setPasswordForm({ current: "", newPass: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  const tabs = [
    { key: "orders", label: "অর্ডারসমূহ", icon: Package },
    { key: "profile", label: "প্রোফাইল", icon: User },
    { key: "password", label: "পাসওয়ার্ড", icon: Lock },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">আমার একাউন্ট</h1>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-1">
              <LogOut className="h-4 w-4" /> লগআউট
            </Button>
          </div>

          {/* Profile Summary */}
          <div className="bg-card border rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{profile?.full_name || "ইউজার"}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <>
              {orders?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>কোনো অর্ডার নেই</p>
                  <Link to="/products"><Button className="mt-3">কেনাকাটা করুন</Button></Link>
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
                          <span className="text-xs text-muted-foreground">{order.order_status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-card border rounded-xl p-5 max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">প্রোফাইল তথ্য</h3>
                <Button variant="ghost" size="sm" onClick={() => setEditProfile(!editProfile)} className="gap-1">
                  <Edit className="h-4 w-4" /> {editProfile ? "বাতিল" : "এডিট"}
                </Button>
              </div>
              {editProfile ? (
                <div className="space-y-3">
                  <div><Label>নাম</Label><Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="mt-1" /></div>
                  <div><Label>ফোন</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="mt-1" /></div>
                  <div><Label>ঠিকানা</Label><Input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>শহর</Label><Input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} className="mt-1" /></div>
                    <div><Label>এলাকা</Label><Input value={profileForm.area} onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })} className="mt-1" /></div>
                  </div>
                  <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending} className="w-full">
                    {profileMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">নাম</span><span className="font-medium">{profile?.full_name || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ইমেইল</span><span className="font-medium">{user.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ফোন</span><span className="font-medium">{profile?.phone || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ঠিকানা</span><span className="font-medium">{profile?.address || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">শহর</span><span className="font-medium">{profile?.city || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">এলাকা</span><span className="font-medium">{profile?.area || "—"}</span></div>
                </div>
              )}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="bg-card border rounded-xl p-5 max-w-lg">
              <h3 className="font-bold text-foreground mb-4">পাসওয়ার্ড পরিবর্তন</h3>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <Label>নতুন পাসওয়ার্ড</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={passwordForm.newPass}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>পাসওয়ার্ড নিশ্চিত করুন</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    placeholder="আবার পাসওয়ার্ড দিন"
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" disabled={passLoading} className="w-full">
                  {passLoading ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
