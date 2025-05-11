import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();
  
  // Don't show on vendor pages
  if (location.startsWith('/vendor')) {
    return null;
  }

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
        <NavItem 
          href="/checkout" 
          icon="ri-shopping-cart-2-line" 
          label="Cart" 
          isActive={location === '/checkout'} 
        />
        <NavItem 
          href="/vendor/login" 
          icon="ri-user-line" 
          label="Account" 
          isActive={location === '/vendor/login'} 
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
