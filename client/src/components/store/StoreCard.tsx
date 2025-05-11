import { Store } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  const { 
    id, 
    name, 
    imageUrl, 
    rating, 
    reviewCount, 
    deliveryTime, 
    deliveryFee 
  } = store;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">{name}</h3>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <i className="ri-map-pin-line mr-1"></i>
              <span>0.8 miles away</span>
            </div>
          </div>
          <div className="flex items-center bg-green-50 px-2 py-1 rounded text-sm">
            <i className="ri-star-fill text-yellow-400 mr-1"></i>
            <span className="font-medium text-green-800">{rating}</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <span className="flex items-center mr-4">
            <i className="ri-time-line mr-1"></i>
            <span>{deliveryTime}</span>
          </span>
          <span className="flex items-center">
            <i className="ri-bike-line mr-1"></i>
            <span>${deliveryFee.toFixed(2)} delivery</span>
          </span>
        </div>
        <Button asChild className="w-full">
          <Link href={`/store/${id}`}>
            Shop Now
          </Link>
        </Button>
      </div>
    </div>
  );
}
