import { useEffect } from "react";
import { Link } from "wouter";
import { useCart, CartItem } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

export default function CartSidebar() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    isCartOpen, 
    closeCart, 
    subtotal, 
    deliveryFee, 
    total 
  } = useCart();

  // Close cart when Escape key is pressed
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isCartOpen, closeCart]);

  // Prevent scrolling on the body when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Close cart when clicking outside
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeCart();
    }
  };

  if (!isCartOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50" 
      onClick={handleOverlayClick}
    >
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-xl",
          "transform transition-transform duration-300",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0">
          <h2 className="text-xl font-semibold">Your Cart</h2>
          <button 
            onClick={closeCart}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close cart"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>
        
        {/* Cart Items */}
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <i className="ri-shopping-cart-line text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-center mb-6">Your cart is empty</p>
              <Button onClick={closeCart} variant="outline">
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow 
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
              />
            ))
          )}
        </div>
        
        {/* Cart Summary */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-white sticky bottom-0">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-800 text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <Button asChild className="w-full py-3">
                <Link href="/checkout">
                  Proceed to Checkout
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemRowProps) {
  return (
    <div className="border-b border-gray-100 p-4">
      <div className="flex items-center">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="w-20 h-20 object-cover rounded-md mr-4"
        />
        <div className="flex-1">
          <h3 className="font-medium text-gray-800">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.quantity} {item.unit}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="font-semibold text-gray-800">
              {formatCurrency(item.price)}
            </span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button 
                className="px-2 py-1 text-gray-500 hover:text-gray-700"
                onClick={() => onUpdateQuantity(item.quantity - 1)}
                aria-label="Decrease quantity"
              >
                <i className="ri-subtract-line"></i>
              </button>
              <span className="px-2 text-gray-800">{item.quantity}</span>
              <button 
                className="px-2 py-1 text-gray-500 hover:text-gray-700"
                onClick={() => onUpdateQuantity(item.quantity + 1)}
                aria-label="Increase quantity"
              >
                <i className="ri-add-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
