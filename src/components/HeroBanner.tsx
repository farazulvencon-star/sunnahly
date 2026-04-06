import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroBanner = () => {
  return (
    <section className="relative bg-secondary overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-28">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            ১০০% অর্গানিক
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
            প্রকৃতির শক্তিতে <br />
            <span className="text-primary">আপনার সৌন্দর্য</span> ফিরিয়ে আনুন
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg">
            বাংলাদেশের সেরা প্রাকৃতিক ও অর্গানিক পণ্যের সংগ্রহ। কোনো কেমিক্যাল নেই, শুধুই প্রকৃতি।
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="gap-2">
              এখনই কিনুন <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              সকল পণ্য দেখুন
            </Button>
          </div>
        </div>
      </div>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 rounded-bl-[100px] hidden lg:block" />
      <div className="absolute bottom-8 right-20 w-24 h-24 bg-primary/10 rounded-full hidden lg:block" />
      <div className="absolute top-12 right-40 w-16 h-16 bg-primary/5 rounded-full hidden lg:block" />
    </section>
  );
};

export default HeroBanner;
