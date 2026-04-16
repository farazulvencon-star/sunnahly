import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CustomerReviews = () => {
  const { data: reviews } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .not("image", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  if (!reviews?.length) return null;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">কাস্টমার রিভিউ</h2>
          <p className="text-muted-foreground mt-2">আমাদের সন্তুষ্ট ক্রেতাদের মতামত</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {reviews.map((review: any) => (
            <div
              key={review.id}
              className="rounded-xl border-2 border-primary overflow-hidden"
            >
              <img
                src={review.image}
                alt="কাস্টমার রিভিউ"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
