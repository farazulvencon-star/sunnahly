import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Trash2 } from "lucide-react";

const FaviconUpload = ({ settings, updateMutation }: { settings: any; updateMutation: any }) => {
  const [faviconUrl, setFaviconUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings?.site_favicon) setFaviconUrl(settings.site_favicon.value?.url || "");
  }, [settings]);

  const upload = async (file: File) => {
    const cn = settings?.cloudinary?.value?.cloud_name;
    const preset = settings?.cloudinary?.value?.upload_preset;
    if (!cn || !preset) { toast.error("আগে Cloudinary সেটআপ করুন"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      fd.append("folder", "branding");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cn}/image/upload`, { method: "POST", body: fd });
      const result = await res.json();
      setFaviconUrl(result.secure_url);
      updateMutation.mutate({ key: "site_favicon", value: { url: result.secure_url } });
    } catch { toast.error("ফেভিকন আপলোড ব্যর্থ"); }
    finally { setUploading(false); }
  };

  return (
    <div className="bg-card border rounded-xl p-5">
      <h3 className="font-bold text-foreground mb-4">ফেভিকন</h3>
      <div className="flex items-center gap-4">
        {faviconUrl ? (
          <div className="relative group">
            <img src={faviconUrl} alt="Favicon" className="h-10 w-10 object-contain border rounded-lg p-1" />
            <button onClick={() => { setFaviconUrl(""); updateMutation.mutate({ key: "site_favicon", value: { url: "" } }); }}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-10 w-10 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
            <Upload className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1">
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild disabled={uploading}>
              <span>{uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> আপলোড হচ্ছে...</> : "ফেভিকন আপলোড"}</span>
            </Button>
            <input type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ""; }} />
          </label>
          <p className="text-xs text-muted-foreground mt-1">PNG, ICO, বা SVG। ব্রাউজার ট্যাবে দেখাবে।</p>
        </div>
      </div>
    </div>
  );
};

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
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [pixelId, setPixelId] = useState("");
  const [pixelToken, setPixelToken] = useState("");
  const [cloudName, setCloudName] = useState("");
  const [uploadPreset, setUploadPreset] = useState("");
  const [steadfastApiKey, setSteadfastApiKey] = useState("");
  const [steadfastSecretKey, setSteadfastSecretKey] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (settings) {
      setPaymentEnabled(settings.payment_gateway?.value?.enabled || false);
      setInsideDhaka(settings.delivery_charge?.value?.inside_dhaka || 60);
      setOutsideDhaka(settings.delivery_charge?.value?.outside_dhaka || 120);
      setPartialPercent(settings.partial_payment_percent?.value?.percent || 10);
      setPixelEnabled(settings.facebook_pixel?.value?.enabled || false);
      setPixelId(settings.facebook_pixel?.value?.pixel_id || "");
      setPixelToken(settings.facebook_pixel?.value?.access_token || "");
      setCloudName(settings.cloudinary?.value?.cloud_name || "");
      setUploadPreset(settings.cloudinary?.value?.upload_preset || "");
      setSteadfastApiKey(settings.steadfast?.value?.api_key || "");
      setSteadfastSecretKey(settings.steadfast?.value?.secret_key || "");
      setLogoUrl(settings.site_logo?.value?.url || "");
      setWhatsappNumber(settings.whatsapp_number?.value?.number || "");
    }
  }, [settings]);

  const uploadLogo = useCallback(async (file: File) => {
    const cn = settings?.cloudinary?.value?.cloud_name;
    const preset = settings?.cloudinary?.value?.upload_preset;
    if (!cn || !preset) {
      toast.error("আগে Cloudinary সেটআপ করুন");
      return;
    }
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      fd.append("folder", "branding");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cn}/image/upload`, { method: "POST", body: fd });
      const result = await res.json();
      const url = result.secure_url;
      setLogoUrl(url);
      updateMutation.mutate({ key: "site_logo", value: { url } });
    } catch {
      toast.error("লোগো আপলোড ব্যর্থ");
    } finally {
      setLogoUploading(false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const existing = settings?.[key];
      if (existing) {
        const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("সেটিংস আপডেট হয়েছে");
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6 md:text-center">সেটিংস</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl md:mx-auto">
        {/* Col 1 */}
        <div className="space-y-6">
          {/* Site Logo */}
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-bold text-foreground mb-4">সাইট লোগো</h3>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative group">
                  <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain border rounded-lg p-1" />
                  <button
                    onClick={() => { setLogoUrl(""); updateMutation.mutate({ key: "site_logo", value: { url: "" } }); }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  <Upload className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={logoUploading}>
                    <span>
                      {logoUploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> আপলোড হচ্ছে...</> : "লোগো আপলোড করুন"}
                    </span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadLogo(e.target.files[0]); e.target.value = ""; }} />
                </label>
                <p className="text-xs text-muted-foreground mt-1">PNG বা SVG রিকমেন্ডেড। Cloudinary-তে আপলোড হবে।</p>
              </div>
            </div>
          </div>

          {/* Favicon */}
          <FaviconUpload settings={settings} updateMutation={updateMutation} />

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

          {/* Cloudinary */}
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-bold text-foreground mb-1">Cloudinary (ছবি ও ভিডিও)</h3>
            <p className="text-sm text-muted-foreground mb-4">ছবি অটো-অপটিমাইজ ও রিসাইজ হবে</p>
            <div className="space-y-3">
              <div>
                <Label>Cloud Name</Label>
                <Input placeholder="যেমন: my-cloud" value={cloudName} onChange={(e) => setCloudName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Upload Preset (Unsigned)</Label>
                <Input placeholder="যেমন: ml_default" value={uploadPreset} onChange={(e) => setUploadPreset(e.target.value)} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Cloudinary Dashboard → Settings → Upload → Upload Presets → Unsigned preset তৈরি করুন</p>
              </div>
              <Button variant="outline" onClick={() => updateMutation.mutate({
                key: "cloudinary",
                value: { cloud_name: cloudName, upload_preset: uploadPreset },
              })}>
                সেভ করুন
              </Button>
            </div>
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-6">
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

          {/* Facebook Pixel */}
          <div className="bg-card border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground">Facebook Pixel</h3>
                <p className="text-sm text-muted-foreground">কাস্টমার ট্র্যাকিং চালু/বন্ধ করুন</p>
              </div>
              <Switch checked={pixelEnabled}
                onCheckedChange={(v) => {
                  setPixelEnabled(v);
                  updateMutation.mutate({
                    key: "facebook_pixel",
                    value: { enabled: v, pixel_id: pixelId, access_token: pixelToken },
                  });
                }} />
            </div>
            <div className="space-y-3">
              <div>
                <Label>Pixel ID</Label>
                <Input placeholder="যেমন: 123456789012345" value={pixelId} onChange={(e) => setPixelId(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Access Token (Conversions API)</Label>
                <Input placeholder="আপনার Access Token দিন" value={pixelToken} onChange={(e) => setPixelToken(e.target.value)} className="mt-1" type="password" />
              </div>
              <Button variant="outline" onClick={() => updateMutation.mutate({
                key: "facebook_pixel",
                value: { enabled: pixelEnabled, pixel_id: pixelId, access_token: pixelToken },
              })}>
                সেভ করুন
              </Button>
            </div>
          </div>

          {/* Steadfast Courier */}
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-bold text-foreground mb-1">Steadfast Courier</h3>
            <p className="text-sm text-muted-foreground mb-4">এক ক্লিকে অর্ডার কুরিয়ারে পাঠান</p>
            <div className="space-y-3">
              <div>
                <Label>API Key</Label>
                <Input placeholder="আপনার Steadfast API Key" value={steadfastApiKey} onChange={(e) => setSteadfastApiKey(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Secret Key</Label>
                <Input placeholder="আপনার Steadfast Secret Key" value={steadfastSecretKey} onChange={(e) => setSteadfastSecretKey(e.target.value)} className="mt-1" type="password" />
              </div>
              <p className="text-xs text-muted-foreground">Steadfast Dashboard → API Settings থেকে কী নিন</p>
              <Button variant="outline" onClick={() => updateMutation.mutate({
                key: "steadfast",
                value: { api_key: steadfastApiKey, secret_key: steadfastSecretKey },
              })}>
                সেভ করুন
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
