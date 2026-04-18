import { ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaults = {
  title: "৭ দিনের মানি-ব্যাক গ্যারান্টি",
  description: "আমাদের যেকোনো পণ্যে সন্তুষ্ট না হলে ৭ দিনের মধ্যে সম্পূর্ণ টাকা ফেরত পাবেন। কোনো প্রশ্ন ছাড়াই। আপনার সন্তুষ্টিই আমাদের প্রথম অগ্রাধিকার।",
};

const MoneyBackBanner = () => {
  const { data } = useQuery({
    queryKey: ["money-back-content"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_setting", { _key: "money_back_banner" });
      return (data as any) || defaults;
    },
    staleTime: 1000 * 60 * 5,
  });

  const content = data || defaults;

  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="bg-primary rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-10 w-10 md:h-12 md:w-12 text-primary-foreground" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">{content.title}</h3>
            <p className="text-primary-foreground/80 max-w-xl">{content.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MoneyBackBanner;
