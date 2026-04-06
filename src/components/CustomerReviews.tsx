import { Star } from "lucide-react";

const reviews = [
  {
    name: "ফাতেমা আক্তার",
    review: "অসাধারণ পণ্য! কালোজিরা তেল ব্যবহার করে আমার চুল পড়া অনেক কমে গেছে। ১০০% খাঁটি পণ্য।",
    rating: 5,
    location: "ঢাকা",
  },
  {
    name: "রাহাত হোসেন",
    review: "সুন্দরবনের মধু অনেক ভালো। আগে অনেক জায়গা থেকে কিনতাম, কিন্তু এটা সত্যিই খাঁটি।",
    rating: 5,
    location: "চট্টগ্রাম",
  },
  {
    name: "নুসরাত জাহান",
    review: "ডেলিভারি অনেক দ্রুত পেয়েছি। প্যাকেজিং ও পণ্যের মান দুটোই চমৎকার। আবার অর্ডার করবো।",
    rating: 4,
    location: "রাজশাহী",
  },
];

const CustomerReviews = () => {
  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">কাস্টমার রিভিউ</h2>
          <p className="text-muted-foreground mt-2">আমাদের সন্তুষ্ট ক্রেতাদের মতামত</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {reviews.map((review, i) => (
            <div key={i} className="bg-card rounded-xl border p-6">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < review.rating ? "fill-warning text-warning" : "text-border"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">{review.review}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{review.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.location}</p>
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
