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
  const [userAddress, setUserAddress] = useState('Sector 62, Noida');
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
  };

  const toggleCategoriesMenu = () => {
    setShowCategoriesMenu(!showCategoriesMenu);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    console.log('Search query:', searchQuery);
    // Redirect to home page with search query parameter
    setLocation(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    
    // Close mobile search after submitting
    if (isMobileSearchOpen) {
      setIsMobileSearchOpen(false);
    }
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
              <span className="text-xl font-semibold text-gray-800">GroceryDukan</span>
            </Link>
          </div>

          {/* Categories Menu - Hidden on mobile */}
          <div className="hidden md:flex items-center ml-4 relative">
            <button 
              onClick={toggleCategoriesMenu}
              className="flex items-center text-gray-700 hover:text-primary"
            >
              <i className="ri-apps-line mr-1"></i>
              <span>Categories</span>
              <i className={`ri-arrow-${showCategoriesMenu ? 'up' : 'down'}-s-line ml-1`}></i>
            </button>
            
            {showCategoriesMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg w-60 z-50">
                <div className="p-2">
                  <Link href="/?category=fruits" className="block px-4 py-2 hover:bg-gray-100 rounded-md">
                    <i className="ri-apple-line mr-2"></i>Fruits & Vegetables
                  </Link>
                  <Link href="/?category=dairy" className="block px-4 py-2 hover:bg-gray-100 rounded-md">
                    <i className="ri-cup-line mr-2"></i>Dairy & Breakfast
                  </Link>
                  <Link href="/?category=staples" className="block px-4 py-2 hover:bg-gray-100 rounded-md">
                    <i className="ri-seedling-line mr-2"></i>Atta, Rice & Dal
                  </Link>
                  <Link href="/?category=snacks" className="block px-4 py-2 hover:bg-gray-100 rounded-md">
                    <i className="ri-cake-line mr-2"></i>Snacks & Beverages
                  </Link>
                  <Link href="/?category=household" className="block px-4 py-2 hover:bg-gray-100 rounded-md">
                    <i className="ri-home-line mr-2"></i>Household Items
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Location Selector - Hidden on mobile */}
          <div className="hidden md:flex items-center text-gray-700 cursor-pointer ml-4">
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
                      <Link href="/vendor/dashboard">Seller Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/">Switch to Shopping</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth">Customer Login/Register</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/login">Seller Portal</Link>
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
