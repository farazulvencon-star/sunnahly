import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Image, Upload, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const AdminHeroSlides = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ image_url: "", link_url: "", title: "", sort_order: 0, is_active: true });
  const [uploading, setUploading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*");
      const map: Record<string, any> = {};
      data?.forEach((s: any) => { map[s.key] = { id: s.id, value: s.value }; });
      return map;
    },
  });

  const { data: slides } = useQuery({
    queryKey: ["admin-hero-slides"],
    queryFn: async () => {
      const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
      return data || [];
    },
  });

  const uploadImage = useCallback(async (file: File) => {
    const cn = settings?.cloudinary?.value?.cloud_name;
    const preset = settings?.cloudinary?.value?.upload_preset;
    if (!cn || !preset) { toast.error("আগে Cloudinary সেটআপ করুন"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      fd.append("folder", "hero-slides");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cn}/image/upload`, { method: "POST", body: fd });
      const result = await res.json();
      setForm((f) => ({ ...f, image_url: result.secure_url }));
      toast.success("ছবি আপলোড হয়েছে");
    } catch { toast.error("আপলোড ব্যর্থ"); }
    finally { setUploading(false); }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editing) {
        const { error } = await supabase.from("hero_slides").update(data).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hero_slides").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success(editing ? "স্লাইড আপডেট হয়েছে" : "স্লাইড যোগ হয়েছে");
      setOpen(false);
      setEditing(null);
      setForm({ image_url: "", link_url: "", title: "", sort_order: 0, is_active: true });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-slides"] });
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success("স্লাইড মুছে ফেলা হয়েছে");
    },
  });

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ image_url: s.image_url, link_url: s.link_url || "", title: s.title || "", sort_order: s.sort_order || 0, is_active: s.is_active });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">হিরো স্লাইডার ({slides?.length || 0})</h1>
          <p className="text-sm text-muted-foreground mt-1">
            রেকমেন্ডেড সাইজ: <strong>1400×500px</strong> (ডেস্কটপ), ট্যাব/মোবাইলে অটো ফিট হবে। 3:1 রেশিও ব্যবহার করুন।
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm({ image_url: "", link_url: "", title: "", sort_order: 0, is_active: true }); } }}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="h-4 w-4" /> স্লাইড যোগ</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "স্লাইড সম্পাদনা" : "নতুন স্লাইড"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>ছবি *</Label>
                {form.image_url ? (
                  <div className="relative mt-2 rounded-lg overflow-hidden border">
                    <img src={form.image_url} alt="Preview" className="w-full h-40 object-cover" />
                    <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-secondary/50 transition-colors">
                    {uploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground mt-2">{uploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড করুন (1400×500px)"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); e.target.value = ""; }} />
                  </label>
                )}
              </div>
              <div>
                <Label>লিংক URL (ক্লিক করলে যেখানে যাবে)</Label>
                <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="যেমন: /product/my-product বা https://..." className="mt-1" />
              </div>
              <div>
                <Label>টাইটেল (ঐচ্ছিক)</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ব্যানার শিরোনাম" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>সর্ট অর্ডার</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: +e.target.value })} className="mt-1" />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>সক্রিয়</Label>
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                </div>
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.image_url}>
                {saveMutation.isPending ? "সেভ হচ্ছে..." : editing ? "আপডেট করুন" : "যোগ করুন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slides?.map((s: any) => (
          <div key={s.id} className="bg-card border rounded-xl overflow-hidden">
            <div className="relative">
              <img src={s.image_url} alt={s.title || "Slide"} className="w-full h-40 object-cover" />
              {!s.is_active && (
                <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">নিষ্ক্রিয়</span>
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{s.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground truncate">{s.link_url || "কোনো লিংক নেই"} • অর্ডার: {s.sort_order}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("মুছে ফেলতে চান?")) deleteMutation.mutate(s.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!slides?.length && <p className="text-center text-muted-foreground py-8">কোনো স্লাইড নেই</p>}
    </div>
  );
};

export default AdminHeroSlides;
