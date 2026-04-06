import { Leaf, Truck, ShieldCheck, Headphones } from "lucide-react";

const points = [
  {
    icon: Leaf,
    title: "১০০% অর্গানিক",
    desc: "সকল পণ্য সম্পূর্ণ প্রাকৃতিক উপাদানে তৈরি",
  },
  {
    icon: Truck,
    title: "দ্রুত ডেলিভারি",
    desc: "সারাদেশে ২-৫ কার্যদিবসের মধ্যে ডেলিভারি",
  },
  {
    icon: ShieldCheck,
    title: "মান নিশ্চিত",
    desc: "প্রতিটি পণ্য যাচাই-বাছাই করে পাঠানো হয়",
  },
  {
    icon: Headphones,
    title: "২৪/৭ সাপোর্ট",
    desc: "যেকোনো সমস্যায় আমাদের সাপোর্ট টিম সর্বদা প্রস্তুত",
  },
];

const KeyPoints = () => {
  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {points.map((point, i) => (
            <div key={i} className="bg-card rounded-xl border p-6 text-center group hover:border-primary transition-colors">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <point.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{point.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{point.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyPoints;
