import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaultBanners = {
  banner1: { subtitle: "সীমিত সময়ের অফার", title: "৩০% ছাড়", description: "সকল ত্বকের যত্ন পণ্যে বিশেষ ছাড়। অফার সীমিত সময়ের জন্য।", button_text: "এখনই কিনুন", button_link: "/products" },
  banner2: { subtitle: "নতুন সংগ্রহ", title: "চুলের যত্ন", description: "প্রাকৃতিক উপাদানে তৈরি চুলের যত্ন পণ্যের নতুন সংগ্রহ এসেছে।", button_text: "দেখুন", button_link: "/products" },
};

const PromoBanners = () => {
  const { data: promoData } = useQuery({
    queryKey: ["promo-banners-content"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_setting", { _key: "promo_banners" });
      return (data as any) || defaultBanners;
    },
    staleTime: 1000 * 60 * 5,
  });

  const b1 = promoData?.banner1 || defaultBanners.banner1;
  const b2 = promoData?.banner2 || defaultBanners.banner2;

  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="relative bg-primary rounded-2xl overflow-hidden p-8 md:p-10 min-h-[200px] flex flex-col justify-center">
            <span className="text-primary-foreground/70 text-sm font-medium mb-2">{b1.subtitle}</span>
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">{b1.title}</h3>
            <p className="text-primary-foreground/80 text-sm mb-4 max-w-xs">{b1.description}</p>
            <a href={b1.button_link || "/"}><Button variant="secondary" size="sm" className="w-fit">{b1.button_text}</Button></a>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-foreground/10 rounded-full" />
            <div className="absolute right-8 top-4 w-16 h-16 bg-primary-foreground/5 rounded-full" />
          </div>
          <div className="relative bg-foreground rounded-2xl overflow-hidden p-8 md:p-10 min-h-[200px] flex flex-col justify-center">
            <span className="text-background/70 text-sm font-medium mb-2">{b2.subtitle}</span>
            <h3 className="text-2xl md:text-3xl font-bold text-background mb-2">{b2.title}</h3>
            <p className="text-background/80 text-sm mb-4 max-w-xs">{b2.description}</p>
            <a href={b2.button_link || "/"}><Button variant="secondary" size="sm" className="w-fit">{b2.button_text}</Button></a>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-background/5 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
