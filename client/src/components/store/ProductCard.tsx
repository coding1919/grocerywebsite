import { useState } from "react";
import { Product } from "@shared/schema";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { addItem, isStoreInCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    id, 
    name, 
    price, 
    unit, 
    imageUrl,
    storeId
  } = product;

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to add items to cart",
        variant: "destructive",
      });
      return;
    }
    
    addItem(product);
    
    toast({
      title: "Added to cart",
      description: `${name} has been added to your cart.`,
    });
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-36 object-cover"
        />
        <button 
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100"
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <i className={`${isFavorite ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-500'}`}></i>
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-800 text-sm">{name}</h3>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-semibold text-gray-800">{formatCurrency(price)}</span>
            <span className="text-sm text-gray-500">/{unit}</span>
          </div>
          <button 
            className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-primary-dark"
            onClick={handleAddToCart}
            aria-label="Add to cart"
          >
            <i className="ri-add-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
