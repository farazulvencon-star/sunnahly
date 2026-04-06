import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusOptions = [
  { value: "pending", label: "পেন্ডিং" },
  { value: "confirmed", label: "কনফার্মড" },
  { value: "processing", label: "প্রসেসিং" },
  { value: "shipped", label: "শিপড" },
  { value: "delivered", label: "ডেলিভারড" },
  { value: "cancelled", label: "বাতিল" },
];

const paymentStatusOptions = [
  { value: "pending", label: "পেন্ডিং" },
  { value: "paid", label: "পেইড" },
  { value: "partial", label: "আংশিক" },
  { value: "refunded", label: "রিফান্ড" },
];

const AdminOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      const { error } = await supabase.from("orders").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("আপডেট হয়েছে");
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">অর্ডারসমূহ ({orders?.length || 0})</h1>
      <div className="space-y-3">
        {orders?.map((order: any) => (
          <div key={order.id} className="bg-card border rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <span className="font-bold text-primary text-sm">{order.order_number}</span>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("bn-BD")}</p>
              </div>
              <span className="font-bold text-lg">৳{Number(order.total)}</span>
            </div>
            <div className="text-sm space-y-1 mb-3">
              <p><span className="text-muted-foreground">কাস্টমার:</span> {order.customer_name} ({order.customer_phone})</p>
              <p><span className="text-muted-foreground">ঠিকানা:</span> {order.shipping_address}, {order.city}</p>
              <p><span className="text-muted-foreground">পেমেন্ট:</span> {order.payment_method === "cod" ? "COD" : "আংশিক"} | বাকি: ৳{Number(order.due_amount)}</p>
            </div>
            <div className="text-sm mb-3 border-t pt-2">
              {order.order_items?.map((item: any) => (
                <p key={item.id} className="text-muted-foreground">{item.product_name} x{item.quantity} = ৳{Number(item.total)}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[140px]">
                <p className="text-xs text-muted-foreground mb-1">অর্ডার স্ট্যাটাস</p>
                <Select value={order.order_status} onValueChange={(v) => updateMutation.mutate({ id: order.id, field: "order_status", value: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <p className="text-xs text-muted-foreground mb-1">পেমেন্ট স্ট্যাটাস</p>
                <Select value={order.payment_status} onValueChange={(v) => updateMutation.mutate({ id: order.id, field: "payment_status", value: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
        {orders?.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো অর্ডার নেই</p>}
      </div>
    </div>
  );
};

export default AdminOrders;
