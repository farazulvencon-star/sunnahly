import { Phone, Mail, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaultFooter = {
  brand_description: "বাংলাদেশের সেরা প্রাকৃতিক ও অর্গানিক পণ্যের অনলাইন শপ। ১০০% খাঁটি পণ্যের নিশ্চয়তা।",
  quick_links: [
    { label: "আমাদের সম্পর্কে", href: "/about" },
    { label: "সকল পণ্য", href: "/products" },
    { label: "যোগাযোগ", href: "/contact" },
    { label: "অর্ডার ট্র্যাক করুন", href: "/track" },
  ],
  policy_links: [
    { label: "প্রাইভেসি পলিসি", href: "/privacy" },
    { label: "শর্তাবলী", href: "/terms" },
    { label: "রিফান্ড পলিসি", href: "/refund" },
    { label: "শিপিং পলিসি", href: "/shipping" },
  ],
  phone: "০১XXXXXXXXX",
  email: "info@naturalshefa.com",
  address: "ঢাকা, বাংলাদেশ",
  copyright: "© ২০২৬ Natural Shefa। সর্বস্বত্ব সংরক্ষিত।",
};

const Footer = () => {
  const { data: footerData } = useQuery({
    queryKey: ["footer-content"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "footer_content").single();
      return (data?.value as any) || defaultFooter;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: logoUrl } = useQuery({
    queryKey: ["site-logo"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "site_logo").single();
      return (data?.value as any)?.url || "";
    },
    staleTime: 1000 * 60 * 10,
  });

  const f = footerData || defaultFooter;

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain brightness-0 invert" />
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">N</span>
                  </div>
                  <span className="text-lg font-bold">Natural Shefa</span>
                </>
              )}
            </div>
            <p className="text-background/70 text-sm leading-relaxed">{f.brand_description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">দ্রুত লিংক</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {(f.quick_links || defaultFooter.quick_links).map((l: any, i: number) => (
                <li key={i}><a href={l.href} className="hover:text-background transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">নীতিমালা</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {(f.policy_links || defaultFooter.policy_links).map((l: any, i: number) => (
                <li key={i}><a href={l.href} className="hover:text-background transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">যোগাযোগ</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 flex-shrink-0" /><span>{f.phone}</span></li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 flex-shrink-0" /><span>{f.email}</span></li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" /><span>{f.address}</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-background/50">{f.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
