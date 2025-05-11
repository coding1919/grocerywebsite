import { useQuery } from "@tanstack/react-query";
import { Store } from "@shared/schema";
import { Link } from "wouter";
import StoreCard from "@/components/store/StoreCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function NearbyStores() {
  const { data: stores, isLoading, error } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  if (error) {
    return (
      <section className="mb-10" id="stores">
        <div className="text-center p-4 text-red-500">
          Failed to load stores. Please try again.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10" id="stores">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Nearby Stores</h2>
        <Link href="/stores" className="text-primary font-medium text-sm">View All</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <StoreCardSkeleton key={i} />)
          : stores?.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
      </div>
    </section>
  );
}

function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <Skeleton className="w-full h-40" />
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-24 mb-2" />
          </div>
          <Skeleton className="h-8 w-12 rounded" />
        </div>
        <div className="flex items-center mb-3">
          <Skeleton className="h-4 w-20 mr-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-full rounded" />
      </div>
    </div>
  );
}
