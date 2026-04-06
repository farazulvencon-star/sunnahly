import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SetupAdmin = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState("");

  const handleSetup = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("setup-admin");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setCredentials(data.credentials);
      setStatus("success");
    } catch (err: any) {
      setError(err.message || "সমস্যা হয়েছে");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">অ্যাডমিন সেটআপ</h1>
          <p className="text-muted-foreground mb-6">ডেমো অ্যাডমিন একাউন্ট তৈরি করুন</p>

          {status === "idle" && (
            <Button onClick={handleSetup} size="lg" className="w-full">ডেমো অ্যাডমিন তৈরি করুন</Button>
          )}

          {status === "loading" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> তৈরি হচ্ছে...
            </div>
          )}

          {status === "success" && credentials && (
            <div className="bg-card border rounded-xl p-5 text-left space-y-3">
              <div className="flex items-center gap-2 text-primary mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-bold">অ্যাডমিন তৈরি হয়েছে!</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ইমেইল</p>
                <p className="font-mono font-bold text-foreground">{credentials.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">পাসওয়ার্ড</p>
                <p className="font-mono font-bold text-foreground">{credentials.password}</p>
              </div>
              <p className="text-xs text-destructive">এই পাসওয়ার্ড লগইন করার পর পরিবর্তন করুন</p>
              <a href="/auth">
                <Button className="w-full mt-2">লগইন করুন</Button>
              </a>
            </div>
          )}

          {status === "error" && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
              <p className="text-destructive text-sm">{error}</p>
              <Button variant="outline" className="mt-3" onClick={() => setStatus("idle")}>আবার চেষ্টা করুন</Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SetupAdmin;
