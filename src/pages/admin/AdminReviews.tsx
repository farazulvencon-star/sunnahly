import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star, Trash2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: "", comment: "", rating: 5, image: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("review-images").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("review-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const addReview = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let imageUrl = form.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const { error } = await supabase.from("reviews").insert({
        customer_name: form.customer_name,
        comment: form.comment,
        rating: form.rating,
        image: imageUrl || null,
        is_approved: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["approved-reviews"] });
      setForm({ customer_name: "", comment: "", rating: 5, image: "" });
      setImageFile(null);
      setOpen(false);
      setUploading(false);
      toast.success("রিভিউ যোগ হয়েছে");
    },
    onError: () => {
      setUploading(false);
      toast.error("রিভিউ যোগ করতে সমস্যা হয়েছে");
    },
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase.from("reviews").update({ is_approved: approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["approved-reviews"] });
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["approved-reviews"] });
      toast.success("রিভিউ মুছে ফেলা হয়েছে");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">রিভিউ ম্যানেজমেন্ট</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> রিভিউ যোগ করুন</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন রিভিউ যোগ করুন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>কাস্টমারের নাম</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="নাম লিখুন" />
              </div>
              <div>
                <Label>মন্তব্য</Label>
                <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="রিভিউ লিখুন" />
              </div>
              <div>
                <Label>রেটিং (১-৫)</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setForm({ ...form, rating: s })}>
                      <Star className={`h-6 w-6 ${s <= form.rating ? "fill-warning text-warning" : "text-border"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>ছবি (৩০০x৩০০)</Label>
                <div className="mt-1">
                  {imageFile ? (
                    <div className="relative w-20 h-20">
                      <img src={URL.createObjectURL(imageFile)} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      <button onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-secondary transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">ছবি আপলোড করুন</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files?.[0]) setImageFile(e.target.files[0]);
                      }} />
                    </label>
                  )}
                </div>
              </div>
              <Button onClick={() => addReview.mutate()} disabled={!form.customer_name || uploading} className="w-full">
                {uploading ? "আপলোড হচ্ছে..." : "সেভ করুন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>
      ) : (
        <div className="grid gap-4">
          {reviews?.map((review: any) => (
            <Card key={review.id} className="p-4 flex items-start gap-4">
              {review.image && (
                <img src={review.image} alt={review.customer_name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{review.customer_name}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-3 w-3 ${j < review.rating ? "fill-warning text-warning" : "text-border"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={review.is_approved} onCheckedChange={(v) => toggleApproval.mutate({ id: review.id, approved: v })} />
                <Button variant="ghost" size="icon" onClick={() => deleteReview.mutate(review.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
          {!reviews?.length && <p className="text-center text-muted-foreground py-10">কোনো রিভিউ নেই</p>}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
