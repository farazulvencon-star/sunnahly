import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

const AdminCustomers = () => {
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">কাস্টমার ({profiles?.length || 0})</h1>
      <div className="space-y-2">
        {profiles?.map((profile: any) => (
          <div key={profile.id} className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground">{profile.full_name || "নাম নেই"}</h3>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {profile.phone && <span>{profile.phone}</span>}
                {profile.city && <span>{profile.city}</span>}
                <span>{new Date(profile.created_at).toLocaleDateString("bn-BD")}</span>
              </div>
            </div>
          </div>
        ))}
        {profiles?.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো কাস্টমার নেই</p>}
      </div>
    </div>
  );
};

export default AdminCustomers;
