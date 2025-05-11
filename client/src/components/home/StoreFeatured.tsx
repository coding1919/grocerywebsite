import { useQuery } from "@tanstack/react-query";
import { Store, Product } from "@shared/schema";
import { Link } from "wouter";
import ProductCard from "@/components/store/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function StoreFeatured() {
  // Hardcoded featured store id for demo
  const featuredStoreId = 1;

  const { data: store, isLoading: isStoreLoading } = useQuery<Store>({
    queryKey: [`/api/stores/${featuredStoreId}`],
  });

  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: [`/api/products?storeId=${featuredStoreId}`],
    enabled: !!store,
  });

  const isLoading = isStoreLoading || isProductsLoading;

  if (isLoading) {
    return <StoreFeaturedSkeleton />;
  }

  if (!store) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{store.name}</h2>
        <Link 
          href={`/store/${store.id}`} 
          className="text-primary font-medium text-sm flex items-center"
        >
          <span>View Store</span>
          <i className="ri-arrow-right-s-line ml-1"></i>
        </Link>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row">
          {/* Store image */}
          <div className="md:w-1/4 mb-4 md:mb-0 md:mr-6">
            <img 
              src={store.imageUrl} 
              alt={store.name} 
              className="w-full h-auto rounded-lg"
            />
          </div>
          
          {/* Store details */}
          <div className="md:w-3/4">
            <div className="flex flex-wrap items-start justify-between mb-3">
              <div>
                <div className="flex items-center mb-2">
                  <div className="flex items-center bg-green-50 px-2 py-1 rounded text-sm mr-3">
                    <i className="ri-star-fill text-yellow-400 mr-1"></i>
                    <span className="font-medium text-green-800">{store.rating}</span>
                    <span className="text-gray-500 ml-1">({store.reviewCount})</span>
                  </div>
                  <span className="text-sm text-gray-600">0.8 miles away</span>
                </div>
                <p className="text-gray-700 mb-2">{store.description}</p>
              </div>
              <div className="mt-2 md:mt-0">
                <Button asChild>
                  <Link href={`/store/${store.id}`}>
                    Shop Now
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="bg-gray-50 rounded p-2">
                <span className="text-sm text-gray-500">Delivery Time</span>
                <div className="font-semibold text-gray-800 flex items-center">
                  <i className="ri-time-line mr-1 text-primary"></i>
                  {store.deliveryTime}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-sm text-gray-500">Delivery Fee</span>
                <div className="font-semibold text-gray-800 flex items-center">
                  <i className="ri-bike-line mr-1 text-primary"></i>
                  ${store.deliveryFee.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-sm text-gray-500">Min. Order</span>
                <div className="font-semibold text-gray-800 flex items-center">
                  <i className="ri-shopping-basket-2-line mr-1 text-primary"></i>
                  ${store.minOrder.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <span className="text-sm text-gray-500">Hours</span>
                <div className="font-semibold text-gray-800 flex items-center">
                  <i className="ri-store-2-line mr-1 text-primary"></i>
                  {store.openingHours}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Store Popular Items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products?.slice(0, 5).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function StoreFeaturedSkeleton() {
  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Store Info Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/4 mb-4 md:mb-0 md:mr-6">
            <Skeleton className="w-full h-40 rounded-lg" />
          </div>
          
          <div className="md:w-3/4">
            <div className="flex flex-wrap items-start justify-between mb-3">
              <div className="w-full md:w-3/4">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="mt-2 md:mt-0">
                <Skeleton className="h-10 w-24 rounded" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Products Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <Skeleton className="w-full h-36" />
            <div className="p-3">
              <Skeleton className="h-4 w-full mb-2" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-7 w-7 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
