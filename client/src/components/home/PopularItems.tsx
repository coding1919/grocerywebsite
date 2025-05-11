import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductCard from "@/components/store/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function PopularItems() {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  if (error) {
    return (
      <section className="mb-10">
        <div className="text-center p-4 text-red-500">
          Failed to load products. Please try again.
        </div>
      </section>
    );
  }

  // Take first 10 products for popular items section
  const popularProducts = products?.slice(0, 10);

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Popular Items</h2>
        <Link href="/products" className="text-primary font-medium text-sm">See All</Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : popularProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>
    </section>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative">
        <Skeleton className="w-full h-36" />
      </div>
      <div className="p-3">
        <Skeleton className="h-4 w-full mb-2" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      </div>
    </div>
  );
}
