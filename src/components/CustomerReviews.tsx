import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState } from "react";

const CustomerReviews = () => {
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: reviews } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_approved", true)
        .not("image", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  if (!reviews?.length) return null;

  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="mx-auto" style={{ paddingLeft: "50px", paddingRight: "50px" }}>
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">কাস্টমার রিভিউ</h2>
          <p className="text-muted-foreground mt-2">আমাদের সন্তুষ্ট ক্রেতাদের মতামত</p>
        </div>
        <Carousel
          plugins={[plugin.current]}
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {reviews.map((review: any) => (
              <CarouselItem key={review.id} className="pl-3 basis-1/2 md:basis-1/4">
                <button
                  type="button"
                  onClick={() => setSelectedImage(review.image)}
                  className="block w-full rounded-xl border-[0.5px] border-primary overflow-hidden cursor-zoom-in transition-transform hover:scale-[1.02]"
                >
                  <img
                    src={review.image}
                    alt="কাস্টমার রিভিউ"
                    className="w-full object-cover"
                    style={{ aspectRatio: "350/400" }}
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="কাস্টমার রিভিউ"
              className="w-full h-auto rounded-lg object-contain max-h-[85vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CustomerReviews;
