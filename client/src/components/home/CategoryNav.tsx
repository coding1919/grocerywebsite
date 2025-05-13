import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function CategoryNav() {
  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (error) {
    return (
      <section className="mb-8">
        <div className="text-center p-4 text-red-500">
          Failed to load categories. Please try again.
        </div>
      </section>
    );
  }

  const handleCategoryClick = (categoryId: number) => {
    if (user) {
      setLocation(`/stores?category=${categoryId}`);
    } else {
      setLocation(`/?category=${categoryId}`);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Categories</h2>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 pb-2">
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories?.map((category) => (
                <CategoryItem 
                  key={category.id} 
                  category={category} 
                  onClick={() => handleCategoryClick(category.id)}
                />
              ))}
        </div>
      </div>
    </section>
  );
}

interface CategoryItemProps {
  category: Category;
  onClick: () => void;
}

function CategoryItem({ category, onClick }: CategoryItemProps) {
  return (
    <div 
      className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
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
