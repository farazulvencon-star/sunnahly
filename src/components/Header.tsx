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
  { label: "শেফা টিউব", href: "/shefa-tube" },
];

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();

  const { data: logoUrl } = useQuery({
    queryKey: ["site-logo"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_public_setting", { _key: "site_logo" });
      return (data as any)?.url || "";
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-2 md:px-4 max-w-[1368px]">
        {/* Mobile Layout */}
        <div className="flex md:hidden items-center justify-between h-16">
          {/* Left: Mobile menu */}
          <div className="flex items-center w-10">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
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
                    <Link to="/dashboard" className="px-3 py-3 rounded-md text-foreground hover:bg-accent transition-colors font-medium">আমার একাউন্ট</Link>
                  ) : (
                    <Link to="/auth" className="px-3 py-3 rounded-md text-foreground hover:bg-accent transition-colors font-medium">লগইন / সাইনআপ</Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
            )}
          </Link>

          {/* Right: User icon */}
          <div className="flex items-center">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Desktop Layout - Logo left, Nav center, Icons right */}
        <div className="hidden md:flex items-center justify-between h-20 pl-0 pr-2 lg:pr-4">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 -ml-2 lg:-ml-4">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain" />
            )}
          </Link>

          {/* Center: Nav links */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} className="px-5 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-accent transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="h-6 w-6" />
            </Button>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-11 w-11">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="ghost" size="icon" className="h-11 w-11">
                <User className="h-6 w-6" />
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
