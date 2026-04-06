import { Button } from "@/components/ui/button";

const PromoBanners = () => {
  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Banner 1 */}
          <div className="relative bg-primary rounded-2xl overflow-hidden p-8 md:p-10 min-h-[200px] flex flex-col justify-center">
            <span className="text-primary-foreground/70 text-sm font-medium mb-2">সীমিত সময়ের অফার</span>
            <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
              ৩০% ছাড়
            </h3>
            <p className="text-primary-foreground/80 text-sm mb-4 max-w-xs">
              সকল ত্বকের যত্ন পণ্যে বিশেষ ছাড়। অফার সীমিত সময়ের জন্য।
            </p>
            <Button variant="secondary" size="sm" className="w-fit">
              এখনই কিনুন
            </Button>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-foreground/10 rounded-full" />
            <div className="absolute right-8 top-4 w-16 h-16 bg-primary-foreground/5 rounded-full" />
          </div>

          {/* Banner 2 */}
          <div className="relative bg-foreground rounded-2xl overflow-hidden p-8 md:p-10 min-h-[200px] flex flex-col justify-center">
            <span className="text-background/70 text-sm font-medium mb-2">নতুন সংগ্রহ</span>
            <h3 className="text-2xl md:text-3xl font-bold text-background mb-2">
              চুলের যত্ন
            </h3>
            <p className="text-background/80 text-sm mb-4 max-w-xs">
              প্রাকৃতিক উপাদানে তৈরি চুলের যত্ন পণ্যের নতুন সংগ্রহ এসেছে।
            </p>
            <Button variant="secondary" size="sm" className="w-fit">
              দেখুন
            </Button>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-background/5 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;
