import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Store, Category, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import ProductCard from "@/components/store/ProductCard";

export default function StoreBrowsePage() {
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get URL params
  useEffect(() => {
    const url = new URL(window.location.href);
    const search = url.searchParams.get("search");
    const category = url.searchParams.get("category");

    if (search) {
      setSearchQuery(search);
    }

    if (category) {
      setSelectedCategory(parseInt(category));
    }
  }, [location]);

  // Fetch stores with search query
  const { data: stores = [], isLoading: isLoadingStores } = useQuery<Store[]>({
    queryKey: ["/api/stores", { search: searchQuery }],
    enabled: !!searchQuery,
  });

  // Fetch all stores if no search
  const { data: allStores = [], isLoading: isLoadingAllStores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    enabled: !searchQuery,
  });

  // Fetch all products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    window.history.pushState({}, "", "/stores");
  };

  // Filter products by selected category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter stores by search query
  const filteredStores = allStores.filter(store => {
    return !searchQuery || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get store for a product
  const getStoreForProduct = (product: Product) => {
    return allStores.find(store => store.id === product.storeId);
  };

  // Render search results if any
  const renderSearchResults = () => {
    if (!searchQuery && !selectedCategory) return null;

    const hasResults = filteredProducts.length > 0 || filteredStores.length > 0;

    if (!hasResults) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <i className="ri-search-line text-5xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Results Found</h3>
          <p className="text-gray-600">Try adjusting your search or category filter</p>
          <Button variant="outline" onClick={clearSearch} className="mt-4">
            Clear Search
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {filteredStores.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Stores ({filteredStores.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
          </div>
        )}

        {filteredProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Products ({filteredProducts.length})
              {selectedCategory && categories && (
                <span className="text-gray-600 ml-2">
                  in {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((product) => {
                const store = getStoreForProduct(product);
                return (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img 
                      src={product.imageUrl || ''} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-md mb-3"
                    />
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <p className="font-semibold">₹{product.price}</p>
                    {store && (
                      <p className="text-sm text-gray-500 mt-1">
                        <i className="ri-store-2-line mr-1"></i>
                        {store.name}
                      </p>
                    )}
                    <Button variant="link" className="mt-2 p-0" asChild>
                      <a href={`/store/${product.storeId}`}>View Store</a>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Browse Stores - YourGrocer</title>
        <meta name="description" content="Browse and shop from your favorite local grocery stores." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for stores or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* If there's a search active, show results; otherwise show normal store browse page */}
        {searchQuery ? (
          renderSearchResults()
        ) : (
          <>
            {/* Categories Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((category) => (
                  <Card
                    key={category.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`${category.colorClass} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
                        <i className={`${category.icon} text-xl`}></i>
                      </div>
                      <span className="text-sm font-medium">{category.name}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Products Section */}
            {selectedCategory && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {categories?.find(c => c.id === selectedCategory)?.name || 'Selected Category'}
                  </h2>
                  <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                    Clear Category
                  </Button>
                </div>

                {isLoadingProducts ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className="h-64 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => {
                      const store = getStoreForProduct(product);
                      return (
                        <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <img 
                            src={product.imageUrl || ''} 
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-md mb-3"
                          />
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          <p className="font-semibold">₹{product.price}</p>
                          {store && (
                            <p className="text-sm text-gray-500 mt-1">
                              <i className="ri-store-2-line mr-1"></i>
                              {store.name}
                            </p>
                          )}
                          <Button variant="link" className="mt-2 p-0" asChild>
                            <a href={`/store/${product.storeId}`}>View Store</a>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Featured Stores */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Featured Stores</h2>
              {isLoadingAllStores ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allStores.slice(0, 6).map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              )}
            </div>

            {/* All Stores */}
            <div>
              <h2 className="text-xl font-semibold mb-4">All Stores</h2>
              {isLoadingAllStores ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allStores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StoreCard({ store }: { store: Store }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-40 overflow-hidden">
        <img
          src={store.imageUrl || ''}
          alt={store.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <i className="ri-map-pin-line mr-1"></i>
          <span>{store.address.substring(0, 30)}...</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center bg-gray-100 rounded px-2 py-1">
            <i className="ri-star-fill text-yellow-400 mr-1"></i>
            <span className="font-medium">{store.rating}</span>
            <span className="text-gray-500 text-sm ml-1">({store.reviewCount})</span>
          </div>
          <div className="text-sm text-gray-600">
            {store.deliveryTime}
          </div>
        </div>
        <Button className="w-full" onClick={() => window.location.href = `/store/${store.id}`}>
          View Store
        </Button>
      </CardContent>
    </Card>
  );
} 