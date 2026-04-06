import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Key, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminCustomers = () => {
  const queryClient = useQueryClient();
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: "", name: "" });
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: users } = useQuery({
    queryKey: ["admin-auth-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list_users" },
      });
      if (error) throw error;
      return data.users || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*");
      return data || [];
    },
  });

  const mergedUsers = users?.map((u: any) => {
    const profile = profiles?.find((p: any) => p.user_id === u.id);
    return { ...u, full_name: profile?.full_name, phone: profile?.phone, city: profile?.city };
  }) || [];

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "change_password", user_id: passwordDialog.userId, new_password: newPassword },
      });
      if (error) throw error;
      toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে");
      setPasswordDialog({ open: false, userId: "", name: "" });
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`${email} ইউজারটি মুছে ফেলতে চান?`)) return;
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete_user", user_id: userId },
      });
      if (error) throw error;
      toast.success("ইউজার মুছে ফেলা হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["admin-auth-users"] });
    } catch (err: any) {
      toast.error(err.message || "সমস্যা হয়েছে");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">কাস্টমার ({mergedUsers.length})</h1>
      <div className="space-y-2">
        {mergedUsers.map((user: any) => (
          <div key={user.id} className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground">{user.full_name || "নাম নেই"}</h3>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{user.email}</span>
                {user.phone && <span>{user.phone}</span>}
                {user.city && <span>{user.city}</span>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="পাসওয়ার্ড পরিবর্তন"
                onClick={() => setPasswordDialog({ open: true, userId: user.id, name: user.full_name || user.email })}>
                <Key className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="ইউজার মুছুন"
                onClick={() => handleDeleteUser(user.id, user.email)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {mergedUsers.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো কাস্টমার নেই</p>}
      </div>

      <Dialog open={passwordDialog.open} onOpenChange={(v) => { setPasswordDialog({ ...passwordDialog, open: v }); setNewPassword(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>পাসওয়ার্ড পরিবর্তন</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{passwordDialog.name}</p>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" />
          <Button onClick={handleChangePassword} disabled={loading} className="w-full">
            {loading ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
