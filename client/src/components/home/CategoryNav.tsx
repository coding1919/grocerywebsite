import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryNav() {
  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (error) {
    return (
      <section className="mb-8">
        <div className="text-center p-4 text-red-500">
          Failed to load categories. Please try again.
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Categories</h2>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 pb-2">
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories?.map((category) => (
                <CategoryItem key={category.id} category={category} />
              ))}
        </div>
      </div>
    </section>
  );
}

interface CategoryItemProps {
  category: Category;
}

function CategoryItem({ category }: CategoryItemProps) {
  return (
    <div className="flex flex-col items-center">
      <div className={`${category.colorClass} w-16 h-16 rounded-full flex items-center justify-center mb-2`}>
        <i className={`${category.icon} text-2xl`}></i>
      </div>
      <span className="text-sm text-gray-700">{category.name}</span>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="w-16 h-16 rounded-full mb-2" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
