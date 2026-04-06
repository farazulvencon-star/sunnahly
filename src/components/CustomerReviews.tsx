import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fallbackReviews = [
  { customer_name: "ফাতেমা আক্তার", comment: "অসাধারণ পণ্য! ১০০% খাঁটি পণ্য।", rating: 5 },
  { customer_name: "রাহাত হোসেন", comment: "সুন্দরবনের মধু অনেক ভালো।", rating: 5 },
  { customer_name: "নুসরাত জাহান", comment: "ডেলিভারি অনেক দ্রুত পেয়েছি।", rating: 4 },
];

const CustomerReviews = () => {
  const { data: reviews } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const displayReviews = reviews?.length ? reviews : fallbackReviews;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">কাস্টমার রিভিউ</h2>
          <p className="text-muted-foreground mt-2">আমাদের সন্তুষ্ট ক্রেতাদের মতামত</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {displayReviews.map((review: any, i: number) => (
            <div key={review.id || i} className="bg-card rounded-xl border p-6">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < review.rating ? "fill-warning text-warning" : "text-border"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">{review.comment}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{review.customer_name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.customer_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
