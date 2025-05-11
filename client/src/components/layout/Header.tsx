import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { itemCount, openCart } = useCart();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userAddress, setUserAddress] = useState('123 Main St');

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic here
    console.log('Search query:', searchQuery);
  };

  const isVendorSection = location.startsWith('/vendor');

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <i className="ri-shopping-basket-2-fill text-3xl text-primary mr-2"></i>
              <span className="text-xl font-semibold text-gray-800">QuickMart</span>
            </Link>
          </div>
          
          {/* Location Selector - Hidden on mobile */}
          <div className="hidden md:flex items-center text-gray-700 cursor-pointer">
            <i className="ri-map-pin-line mr-1"></i>
            <span className="text-sm">Deliver to: </span>
            <span className="font-medium ml-1 text-sm">{userAddress}</span>
            <i className="ri-arrow-down-s-line ml-1"></i>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:block flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for groceries, stores..."
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="ri-search-line absolute left-3 top-2.5 text-gray-400"></i>
              </div>
            </form>
          </div>

          {/* Right Nav Items */}
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden text-gray-700"
              onClick={toggleMobileSearch}
              aria-label="Toggle search"
            >
              <i className="ri-search-line text-xl"></i>
            </button>
            
            {!isVendorSection && (
              <button 
                className="relative text-gray-700"
                onClick={openCart}
                aria-label="Open cart"
              >
                <i className="ri-shopping-cart-2-line text-xl"></i>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:block text-gray-700">
                <i className="ri-user-line text-xl"></i>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isVendorSection ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/">Switch to Shopping</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/login">Vendor Login</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button 
              className="md:hidden text-gray-700" 
              id="mobile-menu-button"
              aria-label="Toggle menu"
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className={cn("md:hidden pb-3", isMobileSearchOpen ? "block" : "hidden")}>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for groceries, stores..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="ri-search-line absolute left-3 top-2.5 text-gray-400"></i>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}
