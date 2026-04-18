import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaultTexts = [
  "সারাদেশে ডেলিভারি চার্জ মাত্র ৳৮০",
  "১০০% খাঁটি ও প্রাকৃতিক পণ্য",
  "৭ দিনের মানি-ব্যাক গ্যারান্টি",
  "অর্ডার করতে কল করুন: ০১XXXXXXXXX",
];

const TopBar = () => {
  const { data: texts } = useQuery({
    queryKey: ["topbar-content"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_setting", { _key: "topbar_texts" });
      const val = data as any;
      return val?.texts?.length ? val.texts : defaultTexts;
    },
    staleTime: 1000 * 60 * 10,
  });

  const items = texts || defaultTexts;
  // Duplicate for seamless loop
  const allItems = [...items, ...items];

  return (
    <div className="bg-primary text-primary-foreground py-2 overflow-hidden">
      <div className="animate-slide-left whitespace-nowrap flex gap-16 text-sm font-medium">
        {allItems.map((t: string, i: number) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
};

export default TopBar;
