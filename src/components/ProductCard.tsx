import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
}

const ProductCard = ({ name, price, originalPrice, image, badge }: ProductCardProps) => {
  return (
    <div className="group bg-card rounded-xl border overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-square bg-secondary overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {badge && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
            {badge}
          </span>
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 shadow-md">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" className="rounded-full h-10 w-10 shadow-md">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">{name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">৳{price}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">৳{originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
