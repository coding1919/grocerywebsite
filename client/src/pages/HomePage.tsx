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
  const [searchResults, setSearchResults] = useState<{
    products: Product[];
    stores: Store[];
  } | null>(null);

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

  // Fetch data
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter data based on search query and category
  useEffect(() => {
    if (!searchQuery && !selectedCategory) {
      setSearchResults(null);
      return;
    }

    if (products && stores) {
      // Filter products based on search query
      let filteredProducts = products;
      let filteredStores = stores;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = products.filter(
          (product) =>
            product.name.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query)
        );

        filteredStores = stores.filter(
          (store) =>
            store.name.toLowerCase().includes(query) ||
            store.description?.toLowerCase().includes(query)
        );
      }

      // Filter by category if selected
      if (selectedCategory && categories) {
        const categoryObj = categories.find(
          (cat) => cat.name.toLowerCase() === selectedCategory.toLowerCase()
        );

        if (categoryObj) {
          filteredProducts = filteredProducts.filter(
            (product) => product.categoryId === categoryObj.id
          );
        }
      }

      setSearchResults({
        products: filteredProducts,
        stores: filteredStores,
      });
    }
  }, [searchQuery, selectedCategory, products, stores, categories]);

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSearchResults(null);
    window.history.pushState({}, "", "/");
  };

  // Render search results if any
  const renderSearchResults = () => {
    if (!searchResults) return null;

    const { products: filteredProducts, stores: filteredStores } = searchResults;
    const hasResults = filteredProducts.length > 0 || filteredStores.length > 0;

    if (!hasResults) {
      return (
        <div className="py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">No results found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find any matches for your search.
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

        {filteredStores.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-medium mb-4">Stores ({filteredStores.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* We would map over the stores here and render StoreCard components */}
              {filteredStores.map((store) => (
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

        {filteredProducts.length > 0 && (
          <div>
            <h3 className="text-xl font-medium mb-4">Products ({filteredProducts.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* We would map over the products here and render ProductCard components */}
              {filteredProducts.map((product) => (
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
        <title>GroceryDukan - Online Grocery Delivery in India</title>
        <meta name="description" content="Order groceries from your favorite local stores with fast delivery right to your doorstep in cities across India." />
      </Helmet>
      
      {/* If there's a search/filter active, show results; otherwise show normal home page */}
      {searchResults ? (
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
