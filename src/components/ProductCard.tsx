import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: id || name, name, price, originalPrice, image });
    toast.success(`${name} কার্টে যোগ হয়েছে`);
  };

  const content = (
    <div className="group bg-card rounded-xl border overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-square bg-secondary overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        {badge && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-3 md:p-4">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1 min-h-[2.5rem]">{name}</h3>
        {categoryName && (
          <p className="text-xs text-primary mb-2">{categoryName}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base md:text-lg font-bold text-primary">৳ {price}</span>
            {originalPrice && <span className="text-xs text-muted-foreground line-through">৳{originalPrice}</span>}
          </div>
          <Button size="sm" className="h-8 px-3 text-xs rounded-full" onClick={handleAddToCart}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );

  if (slug) {
    return <Link to={`/product/${slug}`}>{content}</Link>;
  }

  return content;
};

export default ProductCard;
