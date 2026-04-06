import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const AdminSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*");
      const map: Record<string, any> = {};
      data?.forEach((s: any) => { map[s.key] = { id: s.id, value: s.value }; });
      return map;
    },
  });

  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [insideDhaka, setInsideDhaka] = useState(60);
  const [outsideDhaka, setOutsideDhaka] = useState(120);
  const [partialPercent, setPartialPercent] = useState(10);

  useEffect(() => {
    if (settings) {
      setPaymentEnabled(settings.payment_gateway?.value?.enabled || false);
      setInsideDhaka(settings.delivery_charge?.value?.inside_dhaka || 60);
      setOutsideDhaka(settings.delivery_charge?.value?.outside_dhaka || 120);
      setPartialPercent(settings.partial_payment_percent?.value?.percent || 10);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("সেটিংস আপডেট হয়েছে");
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">সেটিংস</h1>

      <div className="space-y-6 max-w-lg">
        {/* Payment Gateway */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-foreground">পেমেন্ট গেটওয়ে (SSLCommerz)</h3>
              <p className="text-sm text-muted-foreground">অনলাইন পেমেন্ট চালু/বন্ধ করুন</p>
            </div>
            <Switch checked={paymentEnabled}
              onCheckedChange={(v) => {
                setPaymentEnabled(v);
                updateMutation.mutate({ key: "payment_gateway", value: { enabled: v, provider: "sslcommerz" } });
              }} />
          </div>
          <div>
            <Label>আংশিক পেমেন্ট (%)</Label>
            <div className="flex gap-2 mt-1">
              <Input type="number" value={partialPercent} onChange={(e) => setPartialPercent(+e.target.value)} className="w-24" />
              <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ key: "partial_payment_percent", value: { percent: partialPercent } })}>
                সেভ
              </Button>
            </div>
          </div>
        </div>

        {/* Delivery Charge */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-bold text-foreground mb-4">ডেলিভারি চার্জ</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ঢাকার ভিতরে (৳)</Label>
              <Input type="number" value={insideDhaka} onChange={(e) => setInsideDhaka(+e.target.value)} />
            </div>
            <div>
              <Label>ঢাকার বাইরে (৳)</Label>
              <Input type="number" value={outsideDhaka} onChange={(e) => setOutsideDhaka(+e.target.value)} />
            </div>
          </div>
          <Button variant="outline" className="mt-3" onClick={() => updateMutation.mutate({ key: "delivery_charge", value: { inside_dhaka: insideDhaka, outside_dhaka: outsideDhaka } })}>
            সেভ করুন
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
