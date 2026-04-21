import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { signIn, user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  // Redirect once auth state confirms admin role (after login or if already logged in)
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    } else if (submitted && !authLoading && user && !isAdmin) {
      toast.error("আপনার অ্যাডমিন অ্যাক্সেস নেই");
      setLoading(false);
    }
  }, [authLoading, user, isAdmin, submitted, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      setSubmitted(true);
      toast.success("সফলভাবে লগইন হয়েছে");
      // Don't navigate here — wait for isAdmin check via useEffect above
    } catch (err: any) {
      toast.error(err.message || "ইমেইল বা পাসওয়ার্ড ভুল");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-14 w-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Natural Shefa</h1>
          <p className="text-muted-foreground text-sm mt-1">অ্যাডমিন প্যানেল</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 space-y-4">
          <div>
            <Label htmlFor="email">ইমেইল</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@naturalshefa.com" required />
          </div>
          <div>
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="পাসওয়ার্ড দিন" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "লগইন হচ্ছে..." : "অ্যাডমিন লগইন"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
