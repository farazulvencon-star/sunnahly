import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  slug?: string;
  categoryName?: string;
}

const ProductCard = ({ id, name, price, originalPrice, image, badge, slug, categoryName }: ProductCardProps) => {
  const { addItem } = useCart();

  const resolveImage = (img: any) => {
    if (!img) return "/placeholder.svg";
    if (typeof img === "string") {
      if (img.startsWith("[") && img.endsWith("]")) {
        try {
          const parsed = JSON.parse(img);
          if (Array.isArray(parsed) && parsed[0]) return parsed[0];
        } catch {
          // ignore
        }
      }
      return img;
    }
    if (Array.isArray(img) && img[0]) return img[0];
    return "/placeholder.svg";
  };

  const finalImage = resolveImage(image);
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: id || name, name, price, originalPrice, image: finalImage });
    toast.success(`${name} কার্টে যোগ হয়েছে`);
  };

  const content = (
    <div className="group bg-card text-card-foreground rounded-lg border border-border/80 p-2.5 sm:p-3 flex flex-col justify-between h-full transition-all duration-200 hover:shadow-md hover:border-primary/50 relative">
      {/* Product Image Container with Inset Padding */}
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
        <img
          src={finalImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top-Right Dashed Discount Badge matching reference */}
        {discountPercent > 0 && (
          <span className="absolute top-2 right-2 border border-dashed border-primary text-primary bg-white/95 text-[11px] sm:text-xs font-bold px-1.5 py-0.5 rounded shadow-xs tracking-tight">
            -{discountPercent}%
          </span>
        )}

        {/* Optional Custom Badge (e.g. Featured / New) on Top-Left */}
        {badge && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded shadow-xs">
            {badge}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 pt-2.5 sm:pt-3">
        <h3 className="text-xs sm:text-sm font-normal sm:font-medium text-foreground line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem] leading-snug group-hover:text-primary transition-colors mb-2">
          {name}
        </h3>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base sm:text-lg font-bold text-primary">
            ৳ {price.toLocaleString("en-US")}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs sm:text-sm text-muted-foreground line-through">
              ৳ {originalPrice.toLocaleString("en-US")}
            </span>
          )}
        </div>

        {/* Full-width Outline "Add to Cart" Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full mt-auto h-9 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium text-xs sm:text-sm rounded-md transition-all duration-200 flex items-center justify-center gap-2 group-hover:border-primary active:scale-[0.99]"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </Button>
      </div>
    </div>
  );

  if (slug) {
    return (
      <Link to={`/product/${slug}`} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
};

export default ProductCard;
