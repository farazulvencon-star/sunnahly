import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Play, Video as VideoIcon, Youtube, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  type: "youtube" | "file";
  youtubeId?: string;
  videoUrl?: string;
  thumbnail: string;
  source?: "shefa_tube" | "product";
}

// Extract YouTube ID helper
const extractYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// Fallback demo videos if admin hasn't added any yet
const sampleVideos: VideoItem[] = [
  {
    id: "sample-1",
    title: "খাঁটি মধুর আসল বৈশিষ্ট্য ও চেনার সহজ উপায়",
    type: "youtube",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80",
    source: "shefa_tube",
  },
  {
    id: "sample-2",
    title: "প্রাকৃতিক কালোজিরা তেলের বিস্ময়কর স্বাস্থ্য উপকারিতা",
    type: "youtube",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=800&auto=format&fit=crop&q=80",
    source: "shefa_tube",
  },
  {
    id: "sample-3",
    title: "মদিনার প্রিমিয়াম আজওয়া খেজুরের গুণাগুণ ও পুষ্টিমান",
    type: "youtube",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&auto=format&fit=crop&q=80",
    source: "shefa_tube",
  },
  {
    id: "sample-4",
    title: "আমাদের অর্গানিক পণ্যের প্যাকেজিং ও কোয়ালিটি চেকিং",
    type: "youtube",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
    source: "shefa_tube",
  },
  {
    id: "sample-5",
    title: "গ্রাহকদের রিভিউ ও সন্তুষ্টির গল্প",
    type: "youtube",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
    source: "shefa_tube",
  },
];

const VideoGallery = () => {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 1. Fetch Shefa Tube videos from admin
  const { data: shefaVideos } = useQuery({
    queryKey: ["video-gallery-shefa-videos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shefa_videos")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // 2. Fetch products that have video_url from admin
  const { data: productVideos } = useQuery({
    queryKey: ["video-gallery-product-videos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, video_url, video_thumbnail, images")
        .eq("is_active", true);
      
      const list = data || [];
      return list.filter((p: any) => p.video_url && String(p.video_url).trim().length > 0);
    },
  });

  // Combine & normalize videos from both sources
  const normalizedVideos: VideoItem[] = [];

  if (Array.isArray(shefaVideos) && shefaVideos.length > 0) {
    shefaVideos.forEach((v: any) => {
      const ytId = v.youtube_id || extractYouTubeId(v.youtube_url || v.video_url);
      if (ytId && ytId !== "custom_video") {
        normalizedVideos.push({
          id: `shefa-${v.id}`,
          title: v.title || "ভিডিও",
          type: "youtube",
          youtubeId: ytId,
          thumbnail: v.thumbnail_url || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
          source: "shefa_tube",
        });
      } else if (v.video_url) {
        normalizedVideos.push({
          id: `shefa-${v.id}`,
          title: v.title || "ভিডিও",
          type: "file",
          videoUrl: v.video_url,
          thumbnail: v.thumbnail_url || "/placeholder.svg",
          source: "shefa_tube",
        });
      }
    });
  }

  if (Array.isArray(productVideos) && productVideos.length > 0) {
    productVideos.forEach((p: any) => {
      const ytId = extractYouTubeId(p.video_url);
      let thumb = p.video_thumbnail;
      if (!thumb && Array.isArray(p.images) && p.images[0]) thumb = p.images[0];
      if (!thumb && typeof p.images === "string") {
        try {
          const parsed = JSON.parse(p.images);
          if (Array.isArray(parsed) && parsed[0]) thumb = parsed[0];
        } catch {
          thumb = p.images;
        }
      }

      if (ytId) {
        normalizedVideos.push({
          id: `prod-${p.id}`,
          title: p.name,
          type: "youtube",
          youtubeId: ytId,
          thumbnail: thumb || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
          source: "product",
        });
      } else if (p.video_url) {
        normalizedVideos.push({
          id: `prod-${p.id}`,
          title: p.name,
          type: "file",
          videoUrl: p.video_url,
          thumbnail: thumb || "/placeholder.svg",
          source: "product",
        });
      }
    });
  }

  // Use real videos if available, otherwise sample videos for demonstration
  const displayVideos = normalizedVideos.length > 0 ? normalizedVideos : sampleVideos;

  // Pagination dots count based on items
  const totalDots = Math.min(Math.max(Math.ceil(displayVideos.length / 2), 1), 6);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < maxScroll - 10);

    if (maxScroll > 0) {
      const progress = el.scrollLeft / maxScroll;
      const dotIdx = Math.min(Math.round(progress * (totalDots - 1)), totalDots - 1);
      setActiveDot(dotIdx);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [displayVideos.length, totalDots]);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 280);

    if (direction === "left") {
      if (el.scrollLeft <= 15) {
        el.scrollTo({ left: maxScroll, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      }
    } else {
      if (el.scrollLeft >= maxScroll - 15) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const scrollToDot = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = (index / (totalDots - 1)) * maxScroll;
    el.scrollTo({ left: target, behavior: "smooth" });
    setActiveDot(index);
  };

  return (
    <section className="py-8 md:py-14 bg-gradient-to-b from-background via-secondary/15 to-background border-b border-border/40">
      <div className="container mx-auto px-4 max-w-[1536px]">
        {/* Style block for gentle brand pulse animation */}
        <style>{`
          @keyframes brandArrowPulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(26, 77, 46, 0.4), 0 4px 14px rgba(0, 0, 0, 0.18);
              transform: translateY(-50%) scale(1);
            }
            50% {
              box-shadow: 0 0 0 8px rgba(26, 77, 46, 0.15), 0 6px 20px rgba(26, 77, 46, 0.35);
              transform: translateY(-50%) scale(1.08);
            }
          }
          .brand-arrow-pulse {
            animation: brandArrowPulse 2.6s infinite ease-in-out;
          }
          .brand-arrow-pulse:hover {
            animation-play-state: paused;
            transform: translateY(-50%) scale(1.15);
          }
        `}</style>

        {/* Section Header - in English with amber accent underline */}
        <div className="text-center mb-6 md:mb-9">
          <div className="inline-flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-foreground tracking-normal">
              Video Gallery
            </h2>
            <div className="h-1 w-14 bg-amber-500 rounded-full mt-2 mx-auto" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Watch our organic product highlights & customer stories
          </p>
        </div>

        {/* Horizontal Slider Track */}
        <div className="relative group/slider px-2 sm:px-10 md:px-12">
          {/* Left Arrow Button - always visible in the middle with brand color & gentle pulse */}
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="brand-arrow-pulse flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary text-primary-foreground border-2 border-white shadow-lg items-center justify-center hover:bg-primary/90 transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Right Arrow Button - always visible in the middle with brand color & gentle pulse */}
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="brand-arrow-pulse flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary text-primary-foreground border-2 border-white shadow-lg items-center justify-center hover:bg-primary/90 transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Scrollable Track */}
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scroll-smooth py-2 px-0.5 no-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className="w-[240px] sm:w-[280px] md:w-[320px] lg:w-[340px] shrink-0 snap-start group relative bg-card rounded-xl md:rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col hover:-translate-y-1"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                    onError={(e: any) => {
                      e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80";
                    }}
                  />

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 group-hover:from-black/90 transition-colors" />

                  {/* Badge (YouTube or Video) */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {video.type === "youtube" ? (
                      <span className="inline-flex items-center gap-1 bg-red-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm tracking-wide">
                        <Youtube className="h-3 w-3 fill-white" />
                        <span>YouTube</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-primary/95 text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                        <VideoIcon className="h-3 w-3" />
                        <span>ভিডিও</span>
                      </span>
                    )}
                  </div>

                  {/* Center Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 ring-4 ring-white/30 group-hover:ring-primary/40">
                      <Play className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom title inside thumbnail on mobile */}
                  <div className="absolute bottom-2 left-2 right-2 z-10 sm:hidden">
                    <p className="text-white text-xs font-medium line-clamp-2 leading-tight drop-shadow-sm">
                      {video.title}
                    </p>
                  </div>
                </div>

                {/* Title & Info below thumbnail for larger screens */}
                <div className="hidden sm:flex flex-col flex-1 p-3 md:p-3.5 bg-card">
                  <h3 className="text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {video.title}
                  </h3>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Sparkles className="h-3 w-3" /> দেখতে ক্লিক করুন
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">HD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Pagination Dots */}
          {totalDots > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-5">
              {Array.from({ length: totalDots }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToDot(idx)}
                  className={`transition-all duration-200 rounded-full ${
                    activeDot === idx
                      ? "w-5 h-2 bg-amber-500"
                      : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border border-white/10 shadow-2xl rounded-2xl text-white">
          <DialogTitle className="sr-only">
            {activeVideo?.title || "Video Player"}
          </DialogTitle>

          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2 min-w-0 pr-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h4 className="text-xs sm:text-sm font-medium text-white truncate">
                {activeVideo?.title || "Video Player"}
              </h4>
            </div>
            <button
              onClick={() => setActiveVideo(null)}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Player Container */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {activeVideo?.type === "youtube" && activeVideo.youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : activeVideo?.videoUrl ? (
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                poster={activeVideo.thumbnail}
              >
                আপনার ব্রাউজার ভিডিওটি চালাতে পারছে না।
              </video>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default VideoGallery;
