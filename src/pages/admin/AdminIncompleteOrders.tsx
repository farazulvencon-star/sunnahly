import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Clock, Phone, User, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  return `${Math.floor(hours / 24)} দিন আগে`;
};

const AdminIncompleteOrders = () => {
  const queryClient = useQueryClient();
  const [liveCount, setLiveCount] = useState(0);

  const { data: orders } = useQuery({
    queryKey: ["admin-incomplete-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("incomplete_orders")
        .select("*")
        .eq("is_converted", false)
        .order("last_activity", { ascending: false });
      return data || [];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("incomplete-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incomplete_orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-incomplete-orders"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  useEffect(() => {
    setLiveCount(orders?.length || 0);
  }, [orders]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("incomplete_orders").delete().eq("id", id);
    if (error) {
      toast.error("মুছে ফেলতে সমস্যা হয়েছে");
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-incomplete-orders"] });
      toast.success("মুছে ফেলা হয়েছে");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground">ইনকমপ্লিট অর্ডার</h1>
        {liveCount > 0 && (
          <span className="bg-warning/10 text-warning px-2.5 py-0.5 rounded-full text-sm font-bold animate-pulse">
            {liveCount} লাইভ
          </span>
        )}
      </div>

      {orders?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>কোনো ইনকমপ্লিট অর্ডার নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders?.map((order: any) => {
            const cartItems = order.cart_items || [];
            const filledFields = [order.customer_name, order.customer_phone, order.customer_email, order.shipping_address].filter(Boolean).length;
            const completionPercent = Math.round((filledFields / 4) * 100);

            return (
              <div key={order.id} className="bg-card border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{timeAgo(order.last_activity)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      completionPercent >= 75 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                    }`}>
                      {completionPercent}% সম্পন্ন
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(order.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Customer Info */}
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  {order.customer_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-foreground">{order.customer_name}</span>
                    </div>
                  )}
                  {order.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-foreground">{order.customer_phone}</span>
                    </div>
                  )}
                  {order.customer_email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {order.customer_email}
                    </div>
                  )}
                  {order.shipping_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-foreground line-clamp-1">{order.shipping_address}</span>
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                {cartItems.length > 0 && (
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">কার্টে {cartItems.length}টি পণ্য</p>
                    {cartItems.map((item: any, i: number) => (
                      <p key={i} className="text-sm text-foreground">
                        {item.name} x{item.quantity} = ৳{item.price * item.quantity}
                      </p>
                    ))}
                    <p className="text-sm font-bold text-primary mt-1">মোট: ৳{Number(order.cart_total)}</p>
                  </div>
                )}

                {!order.customer_name && !order.customer_phone && cartItems.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">কোনো তথ্য দেওয়া হয়নি</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminIncompleteOrders;
