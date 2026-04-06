import { useState } from "react";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "হোম", href: "/" },
  { label: "সকল পণ্য", href: "/products" },
  { label: "অর্ডার ট্র্যাক", href: "/track-order" },
];

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();

  const { data: logoUrl } = useQuery({
    queryKey: ["site-logo"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "site_logo").single();
      return (data?.value as any)?.url || "";
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetTitle className="text-lg font-bold text-primary">মেনু</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} to={item.href} className="px-3 py-3 rounded-md text-foreground hover:bg-accent transition-colors font-medium">
                    {item.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link to="/dashboard" className="px-3 py-3 rounded-md text-foreground hover:bg-accent transition-colors font-medium">আমার একাউন্ট</Link>
                  </>
                ) : (
                  <Link to="/auth" className="px-3 py-3 rounded-md text-foreground hover:bg-accent transition-colors font-medium">লগইন / সাইনআপ</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Natural Shefa" className="h-8 md:h-10 w-auto object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm md:text-lg">N</span>
                </div>
                <div className="leading-tight">
                  <h1 className="text-lg md:text-xl font-bold text-primary">Natural Shefa</h1>
                  <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">প্রাকৃতিক সৌন্দর্যের ঠিকানা</p>
                </div>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-primary hover:bg-accent transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="h-5 w-5" />
            </Button>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4 md:max-w-lg md:mx-auto">
            <div className="relative">
              <Input placeholder="পণ্য খুঁজুন..." className="pr-10" />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
