import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const defaultContent: Record<string, { title: string; body: string }> = {
  privacy: { title: "প্রাইভেসি পলিসি", body: "প্রাইভেসি পলিসি এখানে লেখা হবে।" },
  terms: { title: "শর্তাবলী", body: "শর্তাবলী এখানে লেখা হবে।" },
  refund: { title: "রিফান্ড পলিসি", body: "রিফান্ড পলিসি এখানে লেখা হবে।" },
  shipping: { title: "শিপিং পলিসি", body: "শিপিং পলিসি এখানে লেখা হবে।" },
  about: { title: "আমাদের সম্পর্কে", body: "আমাদের সম্পর্কে এখানে লেখা হবে।" },
  contact: { title: "যোগাযোগ", body: "যোগাযোগের তথ্য এখানে লেখা হবে।" },
};

const PolicyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const key = `page_${slug}`;

  const { data } = useQuery({
    queryKey: ["policy-page", slug],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", key).single();
      return (data?.value as any) || null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const fallback = defaultContent[slug || ""] || { title: "পেইজ", body: "" };
  const title = data?.title || fallback.title;
  const body = data?.body || fallback.body;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{title}</h1>
        <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap">{body}</div>
      </main>
      <Footer />
    </div>
  );
};

export default PolicyPage;
