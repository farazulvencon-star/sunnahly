import { useState } from "react";
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from "lucide-react";
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

  // Categories ordered by created_at ascending (oldest/first created first)
  const { data: categories } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 max-w-[1536px]">
        {/* Mobile Layout */}
        <div className="flex md:hidden items-center justify-between h-16">
          {/* Left: Mobile menu */}
          <div className="flex items-center w-10 shrink-0">
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

                  {/* Mobile Drawer Categories */}
                  {categories && categories.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">ক্যাটাগরি সমূহ</p>
                      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                        {categories.map((cat: any) => (
                          <Link
                            key={cat.id}
                            to={`/category/${cat.slug}`}
                            className="px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent transition-colors flex items-center justify-between"
                          >
                            <span>{cat.name}</span>
                            <ChevronDown className="h-3.5 w-3.5 -rotate-90 opacity-40" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center: Logo */}
          <div className="flex-1 flex items-center justify-center px-2 min-w-0">
            <Link to="/" className="flex items-center justify-center">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 sm:h-9 max-h-10 w-auto max-w-[160px] sm:max-w-[200px] object-contain"
                />
              )}
            </Link>
          </div>

          {/* Right: User icon */}
          <div className="flex items-center justify-end w-10 shrink-0">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Desktop Layout - Logo left, Nav center, Icons right */}
        <div className="hidden md:flex items-center justify-between h-20">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center shrink-0 py-2">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 md:h-11 lg:h-13 max-h-14 w-auto max-w-[180px] md:max-w-[210px] lg:max-w-[250px] object-contain transition-all"
              />
            )}
          </Link>

          {/* Center: Nav links */}
          <nav className="flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-3 lg:px-5 py-2 rounded-md text-sm lg:text-base font-medium text-foreground hover:text-primary hover:bg-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-1 lg:gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="h-10 w-10 md:h-11 md:w-11" onClick={() => setSearchOpen(!searchOpen)}>
              <Search className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 md:h-11 md:w-11">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="ghost" size="icon" className="h-10 w-10 md:h-11 md:w-11">
                <User className="h-5 w-5 md:h-6 md:w-6" />
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

      {/* Categories Bar Below Header */}
      {categories && categories.length > 0 && (
        <div className="bg-[#09241d] text-white border-t border-white/10 shadow-xs">
          <div className="container mx-auto px-4 max-w-[1536px]">
            <nav
              aria-label="Category Navigation"
              className="flex items-center gap-5 sm:gap-7 md:gap-8 overflow-x-auto md:overflow-hidden whitespace-nowrap py-2.5 text-xs sm:text-sm font-semibold tracking-wide no-scrollbar"
            >
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="inline-flex items-center shrink-0 text-white/90 hover:text-white transition-colors py-0.5 group"
                >
                  <span>{cat.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 ml-1 text-white/60 group-hover:text-white transition-colors" />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
