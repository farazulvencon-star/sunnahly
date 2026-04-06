import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Star, Copy, Filter, ChevronDown, Package, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

const emptyProduct = {
  name: "", slug: "", description: "", short_description: "", price: 0, original_price: null as number | null,
  sku: "", stock: 0, images: [] as string[], badge: "", is_featured: false, is_active: true, category_id: null as string | null,
  meta_title: "", meta_description: "", focus_keyword: "",
};

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyProduct);
  const [imageUrl, setImageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "featured">("all");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("general");

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

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q) && !p.slug?.toLowerCase().includes(q)) return false;
      }
      if (filterStatus === "active" && !p.is_active) return false;
      if (filterStatus === "inactive" && p.is_active) return false;
      if (filterStatus === "featured" && !p.is_featured) return false;
      if (filterCategory && p.category_id !== filterCategory) return false;
      return true;
    });
  }, [products, searchQuery, filterStatus, filterCategory]);

  const counts = useMemo(() => {
    if (!products) return { all: 0, active: 0, inactive: 0, featured: 0 };
    return {
      all: products.length,
      active: products.filter((p: any) => p.is_active).length,
      inactive: products.filter((p: any) => !p.is_active).length,
      featured: products.filter((p: any) => p.is_featured).length,
    };
  }, [products]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\u0980-\u09FF\w-]/g, "");
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
      setActiveTab("general");
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setSelectedIds([]);
      toast.success("নির্বাচিত পণ্য মুছে ফেলা হয়েছে");
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setSelectedIds([]);
      toast.success("স্ট্যাটাস আপডেট হয়েছে");
    },
  });

  const openEdit = (product: any) => {
    setEditing(product);
    setForm({
      name: product.name, slug: product.slug, description: product.description || "", short_description: product.short_description || "",
      price: Number(product.price), original_price: product.original_price ? Number(product.original_price) : null,
      sku: product.sku || "", stock: product.stock, images: product.images || [], badge: product.badge || "",
      is_featured: product.is_featured, is_active: product.is_active, category_id: product.category_id,
      meta_title: product.meta_title || "", meta_description: product.meta_description || "", focus_keyword: product.focus_keyword || "",
    });
    setActiveTab("general");
    setOpen(true);
  };

  const duplicateProduct = (product: any) => {
    setEditing(null);
    setForm({
      name: product.name + " (কপি)", slug: "", description: product.description || "", short_description: product.short_description || "",
      price: Number(product.price), original_price: product.original_price ? Number(product.original_price) : null,
      sku: "", stock: product.stock, images: product.images || [], badge: product.badge || "",
      is_featured: false, is_active: false, category_id: product.category_id,
      meta_title: product.meta_title || "", meta_description: product.meta_description || "", focus_keyword: product.focus_keyword || "",
    });
    setActiveTab("general");
    setOpen(true);
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      setForm({ ...form, images: [...form.images, imageUrl.trim()] });
      setImageUrl("");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p: any) => p.id));
    }
  };

  const seoScore = useMemo(() => {
    let score = 0;
    const keyword = form.focus_keyword.toLowerCase();
    if (form.meta_title) score += 25;
    if (form.meta_description) score += 25;
    if (form.focus_keyword) score += 10;
    if (keyword && form.meta_title.toLowerCase().includes(keyword)) score += 15;
    if (keyword && form.meta_description.toLowerCase().includes(keyword)) score += 15;
    if (keyword && form.name.toLowerCase().includes(keyword)) score += 10;
    return Math.min(score, 100);
  }, [form.meta_title, form.meta_description, form.focus_keyword, form.name]);

  const seoColor = seoScore >= 70 ? "text-green-600" : seoScore >= 40 ? "text-yellow-600" : "text-red-500";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6" /> পণ্যসমূহ
        </h1>
        <Button onClick={() => { setEditing(null); setForm(emptyProduct); setActiveTab("general"); setOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> নতুন পণ্য যোগ করুন
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b overflow-x-auto">
        {[
          { key: "all", label: "সব", count: counts.all },
          { key: "active", label: "সক্রিয়", count: counts.active },
          { key: "inactive", label: "নিষ্ক্রিয়", count: counts.inactive },
          { key: "featured", label: "ফিচার্ড", count: counts.featured },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setFilterStatus(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              filterStatus === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label} <span className="text-xs opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="নাম, SKU বা স্লাগ দিয়ে খুঁজুন..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm bg-background min-w-[150px]"
          value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">সব ক্যাটেগরি</option>
          {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selectedIds.length}টি নির্বাচিত</span>
            <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, is_active: true })}>সক্রিয় করুন</Button>
            <Button size="sm" variant="outline" onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, is_active: false })}>নিষ্ক্রিয় করুন</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (confirm(`${selectedIds.length}টি পণ্য মুছে ফেলতে চান?`)) bulkDeleteMutation.mutate(selectedIds); }}>মুছুন</Button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 p-3">
                  <button onClick={toggleAll} className="flex items-center justify-center">
                    {selectedIds.length === filteredProducts.length && filteredProducts.length > 0
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">ছবি</th>
                <th className="p-3 text-left font-medium text-muted-foreground">পণ্যের নাম</th>
                <th className="p-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="p-3 text-left font-medium text-muted-foreground">স্টক</th>
                <th className="p-3 text-left font-medium text-muted-foreground">দাম</th>
                <th className="p-3 text-left font-medium text-muted-foreground">ক্যাটেগরি</th>
                <th className="p-3 text-left font-medium text-muted-foreground">স্ট্যাটাস</th>
                <th className="p-3 text-left font-medium text-muted-foreground">তারিখ</th>
                <th className="p-3 text-right font-medium text-muted-foreground">একশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: any) => (
                <tr key={product.id} className={`border-b hover:bg-muted/30 transition-colors ${selectedIds.includes(product.id) ? "bg-primary/5" : ""}`}>
                  <td className="p-3">
                    <button onClick={() => toggleSelect(product.id)} className="flex items-center justify-center">
                      {selectedIds.includes(product.id)
                        ? <CheckSquare className="h-4 w-4 text-primary" />
                        : <Square className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="p-3">
                    <img src={product.images?.[0] || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-cover" />
                  </td>
                  <td className="p-3">
                    <div>
                      <button onClick={() => openEdit(product)} className="font-medium text-primary hover:underline text-left">
                        {product.name}
                      </button>
                      <div className="text-xs text-muted-foreground mt-0.5">/{product.slug}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {product.is_featured && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">ফিচার্ড</Badge>}
                        {product.badge && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{product.badge}</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{product.sku || "—"}</td>
                  <td className="p-3">
                    <span className={`font-medium ${product.stock <= 0 ? "text-destructive" : product.stock <= 5 ? "text-yellow-600" : "text-foreground"}`}>
                      {product.stock <= 0 ? "স্টক নেই" : product.stock}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-foreground">৳{Number(product.price)}</div>
                    {product.original_price && (
                      <div className="text-xs text-muted-foreground line-through">৳{Number(product.original_price)}</div>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{product.categories?.name || "—"}</td>
                  <td className="p-3">
                    {product.is_active
                      ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">সক্রিয়</Badge>
                      : <Badge variant="secondary" className="bg-muted text-muted-foreground">ড্রাফট</Badge>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(product.created_at).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="সম্পাদনা" onClick={() => openEdit(product)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="ডুপ্লিকেট" onClick={() => duplicateProduct(product)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="মুছুন"
                        onClick={() => { if (confirm("মুছে ফেলতে চান?")) deleteMutation.mutate(product.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">কোনো পণ্য পাওয়া যায়নি</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t text-xs text-muted-foreground">
          মোট {filteredProducts.length}টি পণ্য দেখাচ্ছে {products?.length !== filteredProducts.length ? `(সর্বমোট ${products?.length})` : ""}
        </div>
      </div>

      {/* Add/Edit Dialog - WordPress Style with Tabs */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyProduct); setActiveTab("general"); } }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-lg">{editing ? "পণ্য সম্পাদনা" : "নতুন পণ্য যোগ করুন"}</DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-4">
            {/* Product Title - Always visible like WordPress */}
            <div className="mb-5">
              <Input placeholder="পণ্যের নাম লিখুন" className="text-lg h-12 font-medium"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <span>পার্মালিংক:</span>
                <Input className="h-6 text-xs px-2 py-0 w-auto flex-1 max-w-xs" placeholder="auto-generated-slug"
                  value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
                {[
                  { value: "general", label: "সাধারণ" },
                  { value: "description", label: "বিবরণ" },
                  { value: "images", label: "ছবি" },
                  { value: "inventory", label: "ইনভেন্টরি" },
                  { value: "seo", label: "SEO" },
                ].map(t => (
                  <TabsTrigger key={t.value} value={t.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
                    {t.label}
                    {t.value === "seo" && form.focus_keyword && (
                      <span className={`ml-1.5 text-[10px] font-bold ${seoColor}`}>{seoScore}%</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">দাম (৳) *</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">আসল দাম (৳)</Label>
                    <Input type="number" value={form.original_price || ""} onChange={(e) => setForm({ ...form, original_price: e.target.value ? +e.target.value : null })} placeholder="ছাড়ের আগের দাম" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">ক্যাটেগরি</Label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    value={form.category_id || ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}>
                    <option value="">নির্বাচন করুন</option>
                    {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">ব্যাজ</Label>
                  <Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="যেমন: বেস্ট সেলার, নতুন, ছাড়" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <Label className="text-sm">ফিচার্ড পণ্য</Label>
                      <p className="text-xs text-muted-foreground">হোমপেজে দেখাবে</p>
                    </div>
                    <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <Label className="text-sm">পাবলিশ স্ট্যাটাস</Label>
                      <p className="text-xs text-muted-foreground">{form.is_active ? "সক্রিয় — ওয়েবসাইটে দেখাবে" : "ড্রাফট — দেখাবে না"}</p>
                    </div>
                    <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  </div>
                </div>
              </TabsContent>

              {/* Description Tab */}
              <TabsContent value="description" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">সংক্ষিপ্ত বিবরণ</Label>
                  <Textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                    placeholder="পণ্যের সংক্ষিপ্ত বিবরণ লিখুন (পণ্যের পাশে দেখাবে)" rows={3} />
                  <p className="text-xs text-muted-foreground mt-1">{form.short_description.length}/200 অক্ষর</p>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">বিস্তারিত বিবরণ</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="পণ্যের বিস্তারিত বিবরণ লিখুন..." rows={8} />
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">ছবি URL যোগ করুন</Label>
                  <div className="flex gap-2">
                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="flex-1" />
                    <Button type="button" variant="outline" onClick={addImage}>যোগ করুন</Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group border rounded-lg overflow-hidden aspect-square">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="sm" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {i === 0 && <Badge className="absolute top-1 left-1 text-[10px]">প্রধান</Badge>}
                    </div>
                  ))}
                  {form.images.length === 0 && (
                    <div className="col-span-4 border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                      কোনো ছবি যোগ হয়নি। উপরে URL দিয়ে ছবি যোগ করুন।
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">SKU (Stock Keeping Unit)</Label>
                    <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="যেমন: NS-001" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">স্টক পরিমাণ</Label>
                    <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} />
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium text-sm mb-2">স্টক অবস্থা</h4>
                  <p className={`text-sm ${form.stock <= 0 ? "text-destructive" : form.stock <= 5 ? "text-yellow-600" : "text-green-600"}`}>
                    {form.stock <= 0 ? "স্টক নেই — পণ্য অর্ডার করা যাবে না" : form.stock <= 5 ? `কম স্টক — মাত্র ${form.stock}টি বাকি` : `স্টকে আছে — ${form.stock}টি`}
                  </p>
                </div>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="border rounded-lg p-4 bg-muted/30 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">SEO স্কোর</h4>
                    <span className={`text-lg font-bold ${seoColor}`}>{seoScore}/100</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${seoScore >= 70 ? "bg-green-500" : seoScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${seoScore}%` }} />
                  </div>
                  <div className="mt-3 space-y-1 text-xs">
                    <p className={form.focus_keyword ? "text-green-600" : "text-muted-foreground"}>
                      {form.focus_keyword ? "✓" : "○"} ফোকাস কীওয়ার্ড সেট করা হয়েছে
                    </p>
                    <p className={form.meta_title ? "text-green-600" : "text-muted-foreground"}>
                      {form.meta_title ? "✓" : "○"} SEO টাইটেল সেট করা হয়েছে {form.meta_title && `(${form.meta_title.length} অক্ষর)`}
                    </p>
                    <p className={form.meta_description ? "text-green-600" : "text-muted-foreground"}>
                      {form.meta_description ? "✓" : "○"} মেটা ডেসক্রিপশন সেট করা হয়েছে {form.meta_description && `(${form.meta_description.length} অক্ষর)`}
                    </p>
                    {form.focus_keyword && (
                      <>
                        <p className={form.meta_title.toLowerCase().includes(form.focus_keyword.toLowerCase()) ? "text-green-600" : "text-red-500"}>
                          {form.meta_title.toLowerCase().includes(form.focus_keyword.toLowerCase()) ? "✓" : "✗"} কীওয়ার্ড SEO টাইটেলে আছে
                        </p>
                        <p className={form.meta_description.toLowerCase().includes(form.focus_keyword.toLowerCase()) ? "text-green-600" : "text-red-500"}>
                          {form.meta_description.toLowerCase().includes(form.focus_keyword.toLowerCase()) ? "✓" : "✗"} কীওয়ার্ড মেটা ডেসক্রিপশনে আছে
                        </p>
                        <p className={form.name.toLowerCase().includes(form.focus_keyword.toLowerCase()) ? "text-green-600" : "text-red-500"}>
                          {form.name.toLowerCase().includes(form.focus_keyword.toLowerCase()) ? "✓" : "✗"} কীওয়ার্ড পণ্যের নামে আছে
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1.5 block">ফোকাস কীওয়ার্ড</Label>
                  <Input value={form.focus_keyword} onChange={(e) => setForm({ ...form, focus_keyword: e.target.value })}
                    placeholder="যেমন: অর্গানিক নারকেল তেল" />
                  <p className="text-xs text-muted-foreground mt-1">সার্চ ইঞ্জিনে র‍্যাংক করতে চান এমন কীওয়ার্ড</p>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1.5 block">SEO টাইটেল</Label>
                  <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                    placeholder={form.name || "পণ্যের SEO টাইটেল"} />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">গুগলে যে টাইটেল দেখাবে</p>
                    <p className={`text-xs ${form.meta_title.length > 60 ? "text-red-500" : "text-muted-foreground"}`}>{form.meta_title.length}/60</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1.5 block">মেটা ডেসক্রিপশন</Label>
                  <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                    placeholder="পণ্যের সংক্ষিপ্ত বিবরণ যা গুগল সার্চে দেখাবে..." rows={3} />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">গুগল সার্চ রেজাল্টে যে বিবরণ দেখাবে</p>
                    <p className={`text-xs ${form.meta_description.length > 160 ? "text-red-500" : "text-muted-foreground"}`}>{form.meta_description.length}/160</p>
                  </div>
                </div>

                {/* Google Preview */}
                <div className="border rounded-lg p-4 bg-background">
                  <h4 className="text-xs font-medium text-muted-foreground mb-3">গুগল প্রিভিউ</h4>
                  <div className="space-y-0.5">
                    <p className="text-[#1a0dab] text-lg leading-tight hover:underline cursor-default">
                      {form.meta_title || form.name || "পণ্যের নাম"} — Natural Shefa
                    </p>
                    <p className="text-[#006621] text-sm">naturalshefa.com/product/{form.slug || "product-slug"}</p>
                    <p className="text-sm text-[#545454] line-clamp-2">
                      {form.meta_description || form.short_description || "পণ্যের বিবরণ এখানে দেখাবে..."}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Save Button - Always visible */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name || !form.price} className="min-w-[140px]">
                {saveMutation.isPending ? "সেভ হচ্ছে..." : editing ? "আপডেট করুন" : "পাবলিশ করুন"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
