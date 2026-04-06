import { Leaf, Droplets, Sun, Heart, Sparkles, Apple } from "lucide-react";

const categories = [
  { name: "ত্বকের যত্ন", icon: Sparkles, count: "১২ পণ্য" },
  { name: "চুলের যত্ন", icon: Droplets, count: "৮ পণ্য" },
  { name: "মধু ও খেজুর", icon: Apple, count: "১৫ পণ্য" },
  { name: "ভেষজ তেল", icon: Leaf, count: "১০ পণ্য" },
  { name: "সানস্ক্রিন", icon: Sun, count: "৬ পণ্য" },
  { name: "বডি কেয়ার", icon: Heart, count: "৯ পণ্য" },
];

const CategorySlider = () => {
  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">ক্যাটাগরি সমূহ</h2>
          <p className="text-muted-foreground mt-2">আপনার প্রয়োজন অনুযায়ী পণ্য বেছে নিন</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex-shrink-0 snap-center w-36 md:w-44 group cursor-pointer"
            >
              <div className="bg-secondary rounded-2xl p-6 flex flex-col items-center gap-3 transition-all group-hover:bg-primary group-hover:shadow-lg">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors">
                  <cat.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary-foreground transition-colors">
                  {cat.name}
                </h3>
                <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/70 transition-colors">
                  {cat.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;
