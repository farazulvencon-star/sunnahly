import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const products = [
  { name: "অর্গানিক কালোজিরা তেল (১০০ মিলি)", price: 350, originalPrice: 450, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop", badge: "বেস্ট সেলার" },
  { name: "প্রাকৃতিক মধু - সুন্দরবনের খাঁটি মধু", price: 650, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop" },
  { name: "অর্গানিক অ্যালোভেরা জেল", price: 280, originalPrice: 350, image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=400&fit=crop", badge: "নতুন" },
  { name: "ভেষজ ফেসওয়াশ - নিম ও হলুদ", price: 320, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop" },
];

const FeaturedProducts = () => {
  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">ফিচার্ড পণ্য</h2>
            <p className="text-muted-foreground mt-1">আমাদের সবচেয়ে জনপ্রিয় পণ্যগুলো</p>
          </div>
          <Button variant="outline" className="hidden sm:flex gap-2">
            সবগুলো দেখুন <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <ProductCard key={i} {...product} />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Button variant="outline" className="gap-2">
            সবগুলো দেখুন <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
