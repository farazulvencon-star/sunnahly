import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Play } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const AdminShefaTube = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-shefa-videos"],
    queryFn: async () => {
      const { data } = await supabase.from("shefa_videos").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const addVideo = useMutation({
    mutationFn: async () => {
      const id = extractYouTubeId(url.trim());
      if (!id) throw new Error("Invalid YouTube URL");
      const { error } = await supabase.from("shefa_videos").insert({
        title: title.trim() || null,
        youtube_url: url.trim(),
        youtube_id: id,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shefa-videos"] });
      queryClient.invalidateQueries({ queryKey: ["shefa-videos"] });
      setUrl("");
      setTitle("");
      setOpen(false);
      toast.success("ভিডিও যোগ হয়েছে");
    },
    onError: (e: any) => toast.error(e.message || "ভিডিও যোগ করতে সমস্যা হয়েছে"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("shefa_videos").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shefa-videos"] });
      queryClient.invalidateQueries({ queryKey: ["shefa-videos"] });
    },
  });

  const deleteVideo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shefa_videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shefa-videos"] });
      queryClient.invalidateQueries({ queryKey: ["shefa-videos"] });
      toast.success("ভিডিও মুছে ফেলা হয়েছে");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">শেফা টিউব ম্যানেজমেন্ট</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> ভিডিও যোগ করুন</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন ইউটিউব ভিডিও যোগ করুন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>ইউটিউব লিঙ্ক *</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... অথবা https://youtu.be/..."
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">YouTube, Shorts বা সাধারণ ভিডিও লিঙ্ক সাপোর্ট করে</p>
              </div>
              <div>
                <Label>টাইটেল (ঐচ্ছিক)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ভিডিওর শিরোনাম" className="mt-1" />
              </div>
              <Button onClick={() => addVideo.mutate()} disabled={!url.trim() || addVideo.isPending} className="w-full">
                {addVideo.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos?.map((v: any) => (
            <Card key={v.id} className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                <img src={`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`} alt={v.title || ""} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-primary/90 rounded-full p-2">
                    <Play className="h-5 w-5 text-primary-foreground fill-current" />
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {v.title && <p className="text-sm font-medium line-clamp-2">{v.title}</p>}
                <div className="flex items-center justify-between">
                  <Switch checked={v.is_active} onCheckedChange={(val) => toggleActive.mutate({ id: v.id, active: val })} />
                  <Button variant="ghost" size="icon" onClick={() => deleteVideo.mutate(v.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {!videos?.length && <p className="text-center text-muted-foreground py-10 col-span-full">কোনো ভিডিও নেই</p>}
        </div>
      )}
    </div>
  );
};

export default AdminShefaTube;
