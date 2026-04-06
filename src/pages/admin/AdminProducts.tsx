import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyProduct = {
  name: "", slug: "", description: "", short_description: "", price: 0, original_price: null as number | null,
  sku: "", stock: 0, images: [] as string[], badge: "", is_featured: false, is_active: true, category_id: null as string | null,
};

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyProduct);
  const [imageUrl, setImageUrl] = useState("");

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      const payload = { ...data, slug };
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(editing ? "পণ্য আপডেট হয়েছে" : "পণ্য যোগ হয়েছে");
      setOpen(false);
      setEditing(null);
      setForm(emptyProduct);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("পণ্য মুছে ফেলা হয়েছে");
    },
  });

  const openEdit = (product: any) => {
    setEditing(product);
    setForm({
      name: product.name, slug: product.slug, description: product.description || "", short_description: product.short_description || "",
      price: Number(product.price), original_price: product.original_price ? Number(product.original_price) : null,
      sku: product.sku || "", stock: product.stock, images: product.images || [], badge: product.badge || "",
      is_featured: product.is_featured, is_active: product.is_active, category_id: product.category_id,
    });
    setOpen(true);
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      setForm({ ...form, images: [...form.images, imageUrl.trim()] });
      setImageUrl("");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">পণ্যসমূহ ({products?.length || 0})</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyProduct); } }}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="h-4 w-4" /> পণ্য যোগ করুন</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "পণ্য সম্পাদনা" : "নতুন পণ্য"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>পণ্যের নাম *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>দাম (৳) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
                <div><Label>আসল দাম</Label><Input type="number" value={form.original_price || ""} onChange={(e) => setForm({ ...form, original_price: e.target.value ? +e.target.value : null })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                <div><Label>স্টক</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
              </div>
              <div>
                <Label>ক্যাটেগরি</Label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.category_id || ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}>
                  <option value="">নির্বাচন করুন</option>
                  {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><Label>সংক্ষিপ্ত বিবরণ</Label><Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></div>
              <div><Label>বিস্তারিত বিবরণ</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>ব্যাজ</Label><Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="যেমন: বেস্ট সেলার, নতুন" /></div>
              <div>
                <Label>ছবি URL</Label>
                <div className="flex gap-2">
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                  <Button type="button" variant="outline" onClick={addImage}>যোগ</Button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt="" className="w-14 h-14 rounded object-cover" />
                      <button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">x</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>ফিচার্ড</Label>
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>সক্রিয়</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "সেভ হচ্ছে..." : editing ? "আপডেট করুন" : "যোগ করুন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {products?.map((product: any) => (
          <div key={product.id} className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <img src={product.images?.[0] || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground line-clamp-1">{product.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-bold text-primary">৳{Number(product.price)}</span>
                <span>স্টক: {product.stock}</span>
                {!product.is_active && <span className="text-destructive">নিষ্ক্রিয়</span>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("মুছে ফেলতে চান?")) deleteMutation.mutate(product.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {products?.length === 0 && <p className="text-center text-muted-foreground py-8">কোনো পণ্য নেই</p>}
      </div>
    </div>
  );
};

export default AdminProducts;
