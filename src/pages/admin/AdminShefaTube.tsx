import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Play, Upload, Loader2, Video as VideoIcon, Youtube } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-shefa-videos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shefa_videos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("ভিডিও আপলোড ব্যর্থ হয়েছে");
      const result = await res.json();
      setUploadedUrl(result.secure_url);
      setUrl(result.secure_url);
      toast.success("ভিডিও সফলভাবে আপলোড হয়েছে");
    } catch (err: any) {
      toast.error(err.message || "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
    }
  };

  const addVideo = useMutation({
    mutationFn: async () => {
      const finalUrl = (uploadedUrl || url).trim();
      if (!finalUrl) throw new Error("ভিডিও লিঙ্ক অথবা ফাইল প্রয়োজন");

      const ytId = extractYouTubeId(finalUrl);
      const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `vid_${Date.now()}`;

      const payload: any = {
        id: newId,
        title: title.trim() || null,
        is_active: true,
      };

      if (ytId) {
        payload.youtube_url = finalUrl;
        payload.youtube_id = ytId;
        payload.thumbnail_url = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      } else {
        payload.video_url = finalUrl;
        payload.youtube_url = finalUrl;
        payload.youtube_id = "custom_video";
        payload.thumbnail_url = thumbnailUrl.trim() || null;
      }

      const { error } = await supabase.from("shefa_videos").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shefa-videos"] });
      queryClient.invalidateQueries({ queryKey: ["shefa-videos"] });
      queryClient.invalidateQueries({ queryKey: ["video-gallery-shefa-videos"] });
      setUrl("");
      setUploadedUrl("");
      setTitle("");
      setThumbnailUrl("");
      setOpen(false);
      toast.success("ভিডিও সফলভাবে যোগ হয়েছে");
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
      queryClient.invalidateQueries({ queryKey: ["video-gallery-shefa-videos"] });
      toast.success("ভিডিওর স্ট্যাটাস পরিবর্তন হয়েছে");
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
      queryClient.invalidateQueries({ queryKey: ["video-gallery-shefa-videos"] });
      toast.success("ভিডিও মুছে ফেলা হয়েছে");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ভিডিও গ্যালারি ও শেফা টিউব</h1>
          <p className="text-sm text-muted-foreground mt-1">
            হোমপেজের ভিডিও গ্যালারি ও শেফা টিউব পেইজের ভিডিও পরিচালনা করুন
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> ভিডিও যোগ করুন
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>নতুন ভিডিও যোগ করুন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-semibold">ইউটিউব লিঙ্ক অথবা সরাসরি ভিডিও URL *</Label>
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (uploadedUrl) setUploadedUrl("");
                  }}
                  placeholder="https://youtube.com/watch?v=... বা Shorts লিঙ্ক"
                  className="mt-1.5"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  YouTube সাধারণ ভিডিও বা Shorts লিঙ্ক পেস্ট করতে পারেন
                </p>
              </div>

              {/* Direct Video File Upload */}
              <div className="border border-dashed rounded-lg p-3 text-center bg-muted/40">
                <Label className="text-xs text-muted-foreground block mb-2">অথবা সরাসরি কম্পিউটার থেকে ভিডিও আপলোড করুন:</Label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-xs cursor-pointer font-medium transition-colors">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 text-primary" />
                  )}
                  <span>{uploading ? "আপলোড হচ্ছে..." : "ভিডিও ফাইল সিলেক্ট করুন (MP4/WebM)"}</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
                {uploadedUrl && (
                  <p className="text-[11px] text-emerald-600 mt-2 font-medium truncate">
                    ✓ ফাইল সিলেক্টেড: {uploadedUrl}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold">টাইটেল (শিরোনাম)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: খাঁটি মধু চেনার সহজ উপায়"
                  className="mt-1.5"
                />
              </div>

              <Button
                onClick={() => addVideo.mutate()}
                disabled={(!url.trim() && !uploadedUrl) || addVideo.isPending || uploading}
                className="w-full mt-2"
              >
                {addVideo.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos?.map((v: any) => {
            const isYt = v.youtube_id && v.youtube_id !== "custom_video";
            const thumb = v.thumbnail_url || (isYt ? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg` : "/placeholder.svg");

            return (
              <Card key={v.id} className="overflow-hidden flex flex-col group border shadow-xs hover:shadow-md transition-all">
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src={thumb}
                    alt={v.title || "ভিডিও"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e: any) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="bg-primary/95 text-white rounded-full p-2.5 shadow-md">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute top-2 left-2">
                    {isYt ? (
                      <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        <Youtube className="h-2.5 w-2.5 fill-white" />
                        <span>YouTube</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-primary text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-xs">
                        <VideoIcon className="h-2.5 w-2.5" />
                        <span>ভিডিও</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                  <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-tight text-foreground">
                    {v.title || "শিরোনামহীন ভিডিও"}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={v.is_active === true || v.is_active === 1 || v.is_active === "1"}
                        onCheckedChange={(val) => toggleActive.mutate({ id: v.id, active: val })}
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {v.is_active ? "সক্রিয়" : "বন্ধ"}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteVideo.mutate(v.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {!videos?.length && (
            <div className="text-center py-14 col-span-full border border-dashed rounded-xl p-8 bg-card">
              <VideoIcon className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">এখনো কোনো ভিডিও যোগ করা হয়নি</p>
              <p className="text-xs text-muted-foreground mt-1">
                "ভিডিও যোগ করুন" বাটনে ক্লিক করে YouTube লিঙ্ক বা সরাসরি ফাইল আপলোড করুন
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminShefaTube;
