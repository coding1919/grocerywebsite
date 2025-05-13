import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import HeroSection from "@/components/home/HeroSection";
import CategoryNav from "@/components/home/CategoryNav";
import NearbyStores from "@/components/home/NearbyStores";
import PopularItems from "@/components/home/PopularItems";
import DeliveryBanner from "@/components/home/DeliveryBanner";
import StoreFeatured from "@/components/home/StoreFeatured";
import { Helmet } from "react-helmet";
import { Product, Store, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get URL params
  useEffect(() => {
    const url = new URL(window.location.href);
    const search = url.searchParams.get("search");
    const category = url.searchParams.get("category");

    if (search) {
      setSearchQuery(search);
    }

    if (category) {
      setSelectedCategory(category);
    }
  }, [location]);

  // Fetch data with search query
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: searchQuery }],
    enabled: !!searchQuery,
  });

  const { data: stores = [], isLoading: isLoadingStores } = useQuery<Store[]>({
    queryKey: ["/api/stores", { search: searchQuery }],
    enabled: !!searchQuery,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    window.history.pushState({}, "", "/");
  };

  // Render search results if any
  const renderSearchResults = () => {
    if (!searchQuery) return null;

    if (isLoadingProducts || isLoadingStores) {
      return (
        <div className="py-12 text-center">
          <p className="text-gray-600">Searching...</p>
        </div>
      );
    }

    const hasResults = products.length > 0 || stores.length > 0;

    if (!hasResults) {
      return (
        <div className="py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">No results found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find any matches for "{searchQuery}".
          </p>
          <Button onClick={clearSearch}>Clear Search</Button>
        </div>
      );
    }

    return (
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Search Results for "{searchQuery}"
            {selectedCategory && ` in ${selectedCategory}`}
          </h2>
          <Button variant="outline" onClick={clearSearch}>
            Clear Search
          </Button>
        </div>

        {stores.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-medium mb-4">Stores ({stores.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div key={store.id} className="border rounded-lg p-4">
                  <h4 className="font-medium">{store.name}</h4>
                  <p className="text-sm text-gray-600">{store.description}</p>
                  <Button variant="link" className="mt-2 p-0" asChild>
                    <a href={`/store/${store.id}`}>View Store</a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div>
            <h3 className="text-xl font-medium mb-4">Products ({products.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  <p className="font-semibold">₹{product.price}</p>
                  <Button variant="link" className="mt-2 p-0" asChild>
                    <a href={`/store/${product.storeId}`}>View Store</a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>YourGrocer - Online Grocery Delivery in India</title>
        <meta name="description" content="Order groceries from your favorite local stores with fast delivery right to your doorstep in cities across India." />
      </Helmet>
      
      {/* If there's a search/filter active, show results; otherwise show normal home page */}
      {searchQuery ? (
        renderSearchResults()
      ) : (
        <>
          <HeroSection />
          <CategoryNav />
          <NearbyStores />
          <PopularItems />
          <DeliveryBanner />
          <StoreFeatured />
        </>
      )}
    </>
  );
}
