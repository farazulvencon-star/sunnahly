import { Home, LayoutGrid, Search, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const BottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Search Sheet */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-20">
          <SheetTitle className="text-center text-primary font-bold mb-4">পণ্য খুঁজুন</SheetTitle>
          <div className="relative">
            <Input placeholder="পণ্য খুঁজুন..." className="pr-10 h-12 text-base rounded-xl" autoFocus />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-end justify-around px-2 h-16 relative">
          {/* Home */}
          <Link to="/" className={`flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 flex-1 ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}>
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Category */}
          <Link to="/products" className={`flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 flex-1 ${isActive("/products") ? "text-primary" : "text-muted-foreground"}`}>
            <LayoutGrid className="h-5 w-5" />
            <span className="text-[10px] font-medium">Category</span>
          </Link>

          {/* Search - Raised Center Button */}
          <div className="flex flex-col items-center flex-1 relative">
            <button
              onClick={() => setSearchOpen(true)}
              className="absolute -top-5 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background transition-transform active:scale-95"
            >
              <Search className="h-6 w-6" />
            </button>
            <span className="text-[10px] font-medium text-primary mt-8">Search</span>
          </div>

          {/* Cart */}
          <Link to="/cart" className={`flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 flex-1 relative ${isActive("/cart") ? "text-primary" : "text-muted-foreground"}`}>
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
          </Link>
        </div>

        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* Spacer to prevent content from hiding behind bottom nav */}
      <div className="md:hidden h-20" />
    </>
  );
};

export default BottomNav;
