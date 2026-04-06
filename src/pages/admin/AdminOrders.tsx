import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, ArchiveRestore, Archive } from "lucide-react";
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

const emptyOrder = {
  customer_name: "", customer_phone: "", customer_email: "", shipping_address: "", city: "ঢাকা", area: "",
  subtotal: 0, delivery_charge: 0, total: 0, payment_method: "cod", notes: "",
  items: [{ product_name: "", quantity: 1, price: 0 }],
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ ...emptyOrder });

  const { data: orders } = useQuery({
    queryKey: ["admin-orders", showTrash],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("is_trashed", showTrash)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const { error } = await supabase.from("orders").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("আপডেট হয়েছে");
    },
  });

  const trashMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("orders").update({ is_trashed: !showTrash }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedIds([]);
      toast.success(showTrash ? "রিস্টোর হয়েছে" : "ট্র্যাশে সরানো হয়েছে");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("order_items").delete().in("order_id", ids);
      if (error) throw error;
      const { error: e2 } = await supabase.from("orders").delete().in("id", ids);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedIds([]);
      toast.success("স্থায়ীভাবে মুছে ফেলা হয়েছে");
    },
  });

  const addOrderMutation = useMutation({
    mutationFn: async () => {
      const subtotal = newOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
      const total = subtotal + Number(newOrder.delivery_charge);
      const { data: order, error } = await supabase.from("orders").insert({
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        customer_email: newOrder.customer_email || null,
        shipping_address: newOrder.shipping_address,
        city: newOrder.city,
        area: newOrder.area || null,
        subtotal,
        delivery_charge: Number(newOrder.delivery_charge),
        total,
        due_amount: total,
        payment_method: newOrder.payment_method,
        notes: newOrder.notes || null,
      }).select().single();
      if (error) throw error;

      const orderItems = newOrder.items.filter(i => i.product_name).map(i => ({
        order_id: order.id,
        product_name: i.product_name,
        quantity: i.quantity,
        price: i.price,
        total: i.price * i.quantity,
      }));
      if (orderItems.length > 0) {
        const { error: e2 } = await supabase.from("order_items").insert(orderItems);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setAddOpen(false);
      setNewOrder({ ...emptyOrder });
      toast.success("অর্ডার তৈরি হয়েছে");
    },
    onError: () => toast.error("অর্ডার তৈরিতে সমস্যা হয়েছে"),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const allSelected = orders && orders.length > 0 && selectedIds.length === orders.length;
  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : (orders?.map((o: any) => o.id) || []));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = [...newOrder.items];
    items[index] = { ...items[index], [field]: value };
    setNewOrder({ ...newOrder, items });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {showTrash ? "ট্র্যাশ" : "অর্ডারসমূহ"} ({orders?.length || 0})
        </h1>
        <div className="flex gap-2">
          <Button variant={showTrash ? "default" : "outline"} size="sm" onClick={() => { setShowTrash(!showTrash); setSelectedIds([]); }}>
            <Archive className="h-4 w-4 mr-1" /> {showTrash ? "অর্ডার দেখুন" : "ট্র্যাশ"}
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> অর্ডার যোগ করুন</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>ম্যানুয়াল অর্ডার</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>নাম *</Label><Input value={newOrder.customer_name} onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })} /></div>
                  <div><Label>ফোন *</Label><Input value={newOrder.customer_phone} onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })} /></div>
                </div>
                <div><Label>ইমেইল</Label><Input value={newOrder.customer_email} onChange={(e) => setNewOrder({ ...newOrder, customer_email: e.target.value })} /></div>
                <div><Label>ঠিকানা *</Label><Input value={newOrder.shipping_address} onChange={(e) => setNewOrder({ ...newOrder, shipping_address: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>শহর</Label><Input value={newOrder.city} onChange={(e) => setNewOrder({ ...newOrder, city: e.target.value })} /></div>
                  <div><Label>এলাকা</Label><Input value={newOrder.area} onChange={(e) => setNewOrder({ ...newOrder, area: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>পেমেন্ট</Label>
                    <Select value={newOrder.payment_method} onValueChange={(v) => setNewOrder({ ...newOrder, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cod">COD</SelectItem>
                        <SelectItem value="partial">আংশিক</SelectItem>
                        <SelectItem value="online">অনলাইন</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>ডেলিভারি চার্জ</Label><Input type="number" value={newOrder.delivery_charge} onChange={(e) => setNewOrder({ ...newOrder, delivery_charge: +e.target.value })} /></div>
                </div>

                <div>
                  <Label className="mb-2 block">পণ্যসমূহ</Label>
                  {newOrder.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_60px_80px_32px] gap-2 mb-2 items-end">
                      <Input placeholder="পণ্যের নাম" value={item.product_name} onChange={(e) => updateItem(i, "product_name", e.target.value)} />
                      <Input type="number" placeholder="সংখ্যা" value={item.quantity} onChange={(e) => updateItem(i, "quantity", +e.target.value)} />
                      <Input type="number" placeholder="দাম" value={item.price} onChange={(e) => updateItem(i, "price", +e.target.value)} />
                      {newOrder.items.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setNewOrder({ ...newOrder, items: newOrder.items.filter((_, idx) => idx !== i) })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setNewOrder({ ...newOrder, items: [...newOrder.items, { product_name: "", quantity: 1, price: 0 }] })}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> পণ্য যোগ
                  </Button>
                </div>

                <div><Label>নোট</Label><Textarea value={newOrder.notes} onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} rows={2} /></div>

                <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                  <p>সাবটোটাল: ৳{newOrder.items.reduce((s, i) => s + i.price * i.quantity, 0)}</p>
                  <p>ডেলিভারি: ৳{newOrder.delivery_charge}</p>
                  <p className="font-bold">মোট: ৳{newOrder.items.reduce((s, i) => s + i.price * i.quantity, 0) + Number(newOrder.delivery_charge)}</p>
                </div>

                <Button className="w-full" onClick={() => addOrderMutation.mutate()} disabled={!newOrder.customer_name || !newOrder.customer_phone || !newOrder.shipping_address || addOrderMutation.isPending}>
                  অর্ডার তৈরি করুন
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="bg-secondary/50 border rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{selectedIds.length}টি সিলেক্টেড</span>
          <Button size="sm" variant="outline" onClick={() => trashMutation.mutate(selectedIds)}>
            {showTrash ? <><ArchiveRestore className="h-3.5 w-3.5 mr-1" /> রিস্টোর</> : <><Archive className="h-3.5 w-3.5 mr-1" /> ট্র্যাশে সরান</>}
          </Button>
          {showTrash && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive"><Trash2 className="h-3.5 w-3.5 mr-1" /> স্থায়ীভাবে মুছুন</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>নিশ্চিত করুন</AlertDialogTitle>
                  <AlertDialogDescription>{selectedIds.length}টি অর্ডার স্থায়ীভাবে মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate(selectedIds)}>মুছে ফেলুন</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Select all */}
      {orders && orders.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          <span className="text-sm text-muted-foreground">সব সিলেক্ট করুন</span>
        </div>
      )}

      <div className="space-y-3">
        {orders?.map((order: any) => (
          <div key={order.id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox checked={selectedIds.includes(order.id)} onCheckedChange={() => toggleSelect(order.id)} className="mt-1" />
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-bold text-primary text-sm">{order.order_number}</span>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("bn-BD")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">৳{Number(order.total)}</span>
                    {!showTrash && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => trashMutation.mutate([order.id])}>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                    {showTrash && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => trashMutation.mutate([order.id])}>
                        <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
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
                {!showTrash && (
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
                )}
              </div>
            </div>
          </div>
        ))}
        {orders?.length === 0 && <p className="text-center text-muted-foreground py-8">{showTrash ? "ট্র্যাশ খালি" : "কোনো অর্ডার নেই"}</p>}
      </div>
    </div>
  );
};

export default AdminOrders;
