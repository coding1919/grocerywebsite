import { Link, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();
  const { itemCount, openCart } = useCart();
  
  // Don't show on vendor pages
  if (location.startsWith('/vendor')) {
    return null;
  }

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openCart();
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-around py-2">
        <NavItem 
          href="/" 
          icon="ri-home-5-line" 
          label="Home" 
          isActive={location === '/'} 
        />
        <NavItem 
          href="/orders" 
          icon="ri-shopping-bag-line" 
          label="Orders" 
          isActive={location === '/orders'} 
        />
        <button 
          onClick={handleCartClick}
          className="flex flex-col items-center text-gray-500 relative"
        >
          <i className="ri-shopping-cart-2-line text-xl"></i>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
          <span className="text-xs mt-1">Cart</span>
        </button>
        <NavItem 
          href="/auth" 
          icon="ri-user-line" 
          label="Account" 
          isActive={location === '/auth'} 
        />
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center",
      isActive ? "text-primary" : "text-gray-500"
    )}>
      <i className={`${icon} text-xl`}></i>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
}
