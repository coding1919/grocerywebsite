import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface DeliveryLocation {
  id: number;
  name: string;
  address: string;
}

export default function Header() {
  const [location, setLocation] = useLocation();
  const { itemCount, openCart } = useCart();
  const { user, logoutMutation } = useAuth();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation>({
    id: 1,
    name: 'Mangalore',
    address: 'Mangalore, Karnataka'
  });

  const deliveryLocations: DeliveryLocation[] = [
    { id: 1, name: 'Mangalore', address: 'Mangalore, Karnataka' },
    { id: 2, name: 'Udupi', address: 'Udupi, Karnataka' },
    { id: 3, name: 'Surathkal', address: 'Surathkal, Karnataka' }
  ];

  const userLocations: DeliveryLocation[] = [
    { id: 1, name: 'Home', address: '123 Main St, Mangalore' },
    { id: 2, name: 'Office', address: '456 Work Ave, Mangalore' },
    { id: 3, name: 'Other', address: '789 Other Rd, Mangalore' }
  ];

  // Set default location based on auth status
  useEffect(() => {
    if (user) {
      setSelectedLocation(userLocations[0]); // Set to Home when logged in
    } else {
      setSelectedLocation(deliveryLocations[0]); // Set to Mangalore when not logged in
    }
  }, [user]);

  const toggleCategoriesMenu = () => {
    setShowCategoriesMenu(!showCategoriesMenu);
  };

  const toggleLocationMenu = () => {
    setShowLocationMenu(!showLocationMenu);
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/stores?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLocationSelect = (loc: DeliveryLocation) => {
    setSelectedLocation(loc);
    setShowLocationMenu(false);
  };

  const handleCategoryClick = (categoryId: number) => {
    if (user) {
      setLocation(`/stores?category=${categoryId}`);
    } else {
      setLocation(`/?category=${categoryId}`);
    }
    setShowCategoriesMenu(false);
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
              <span className="text-xl font-semibold text-gray-800">YourGrocer</span>
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
                  <button 
                    onClick={() => handleCategoryClick(1)} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md"
                  >
                    <i className="ri-apple-line mr-2"></i>Fruits & Vegetables
                  </button>
                  <button 
                    onClick={() => handleCategoryClick(2)} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md"
                  >
                    <i className="ri-cup-line mr-2"></i>Dairy & Breakfast
                  </button>
                  <button 
                    onClick={() => handleCategoryClick(3)} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md"
                  >
                    <i className="ri-seedling-line mr-2"></i>Atta, Rice & Dal
                  </button>
                  <button 
                    onClick={() => handleCategoryClick(4)} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md"
                  >
                    <i className="ri-cake-line mr-2"></i>Snacks & Beverages
                  </button>
                  <button 
                    onClick={() => handleCategoryClick(5)} 
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md"
                  >
                    <i className="ri-home-line mr-2"></i>Household Items
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Location Selector - Hidden on mobile */}
          <div className="hidden md:flex items-center text-gray-700 cursor-pointer ml-4 relative">
            <button
              onClick={toggleLocationMenu}
              className="flex items-center text-gray-700 hover:text-primary bg-gray-50 px-3 py-1.5 rounded-md border"
              type="button"
            >
              <i className="ri-map-pin-line mr-1 text-primary"></i>
              <span className="text-sm">Deliver to: </span>
              <span className="font-medium ml-1 text-sm">{selectedLocation.name}</span>
              <i className="ri-arrow-down-s-line ml-1"></i>
            </button>
            
            {showLocationMenu && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white shadow-lg rounded-lg w-60 z-50">
                <div className="p-2">
                  {(user ? userLocations : deliveryLocations).map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => handleLocationSelect(loc)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md"
                      >
                      <i className="ri-map-pin-line mr-2"></i>
                          {loc.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
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
                {user ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/auth">Login/Register</Link>
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
    </header>
  );
}
