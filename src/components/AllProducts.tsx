import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";

const products = [
  { name: "অর্গানিক নারকেল তেল (২০০ মিলি)", price: 420, originalPrice: 500, image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop" },
  { name: "ভেষজ হেয়ার অয়েল - ভৃঙ্গরাজ", price: 380, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop" },
  { name: "প্রাকৃতিক লিপ বাম - মধু ও গোলাপ", price: 180, originalPrice: 220, image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop", badge: "ছাড়" },
  { name: "অর্গানিক হলুদ গুঁড়া (১০০ গ্রাম)", price: 250, image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&h=400&fit=crop" },
  { name: "ন্যাচারাল বডি লোশন - ল্যাভেন্ডার", price: 450, originalPrice: 550, image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop" },
  { name: "অর্গানিক চিয়া সিড (৩০০ গ্রাম)", price: 550, image: "https://images.unsplash.com/photo-1541990934484-c33ba7f74d46?w=400&h=400&fit=crop" },
  { name: "গোলাপ জল - ১০০% প্রাকৃতিক", price: 290, originalPrice: 350, image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=400&fit=crop", badge: "জনপ্রিয়" },
  { name: "অর্গানিক অ্যাপেল সাইডার ভিনেগার", price: 480, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop" },
];

const AllProducts = () => {
  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">সকল পণ্য</h2>
          <p className="text-muted-foreground mt-2">আমাদের সম্পূর্ণ পণ্যের তালিকা</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <ProductCard key={i} {...product} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="outline" size="lg">
            আরও পণ্য দেখুন
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AllProducts;
