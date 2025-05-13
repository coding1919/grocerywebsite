import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-localStorage";
import { Product } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl: string;
}

interface CartContextType {
  items: CartItem[];
  storeId: number | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  setStoreId: (id: number | null) => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  isStoreInCart: (storeId: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>("cart-items", []);
  const [storeId, setStoreId] = useLocalStorage<number | null>("cart-store-id", null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(2.99);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Clear cart when user logs out
  useEffect(() => {
    if (!user) {
      clearCart();
      setIsCartOpen(false);
    }
  }, [user]);
  
  // Recalculate total when items change
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const total = subtotal + deliveryFee;

  // Manage cart visibility
  const toggleCart = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access your cart",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    setIsCartOpen(!isCartOpen);
  };
  
  const openCart = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access your cart",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    setIsCartOpen(true);
  };
  
  const closeCart = () => setIsCartOpen(false);

  // Check if a store's products are in the cart
  const isStoreInCart = (id: number) => storeId === id;

  // Add item to cart
  const addItem = (product: Product, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to add items to cart",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    // If adding from a different store, confirm and clear cart
    if (storeId !== null && storeId !== product.storeId && items.length > 0) {
      if (!window.confirm("Your cart contains items from another store. Clear cart to add this item?")) {
        return;
      }
      clearCart();
    }
    
    setStoreId(product.storeId);
    
    // Check if item already exists
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: Date.now(), // unique id for the cart item
        productId: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity: quantity,
        imageUrl: product.imageUrl
      };
      setItems([...items, newItem]);
    }
    
    // Open cart when adding items
    openCart();
  };

  // Remove item from cart
  const removeItem = (itemId: number) => {
    if (!user) return;
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    
    // Clear store if cart is empty
    if (updatedItems.length === 0) {
      setStoreId(null);
    }
  };

  // Update item quantity
  const updateQuantity = (itemId: number, quantity: number) => {
    if (!user) return;
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }
    
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    setItems(updatedItems);
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
    setStoreId(null);
  };

  return (
    <CartContext.Provider value={{
      items,
      storeId,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setStoreId,
      isCartOpen,
      toggleCart,
      openCart,
      closeCart,
      itemCount,
      subtotal,
      deliveryFee,
      total,
      isStoreInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
