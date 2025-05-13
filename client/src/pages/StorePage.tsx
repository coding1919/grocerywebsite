import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Store, Product, Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/store/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import VendorPanel from "@/components/vendor/VendorPanel";
import { Helmet } from "react-helmet";

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const storeId = parseInt(id);
  const [isVendorPanelOpen, setIsVendorPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { isStoreInCart } = useCart();

  // Fetch store details
  const { data: store, isLoading: isStoreLoading } = useQuery<Store>({
    queryKey: [`/api/stores/${storeId}`],
  });

  // Fetch all products for this store
  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: [`/api/products?storeId=${storeId}`],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter(product => product.categoryId === selectedCategory)
    : products;

  // Organize products by category
  const productsByCategory = categories.map(category => ({
    category,
    products: products.filter(product => product.categoryId === category.id)
  })).filter(group => group.products.length > 0);

  if (isStoreLoading) {
    return <StorePageSkeleton />;
  }

  if (!store) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Store Not Found</h2>
          <p className="text-gray-600">The store you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{store.name} - YourGrocer</title>
        <meta name="description" content={store.description || `Order groceries from ${store.name} with fast delivery.`} />
      </Helmet>
      
      {/* Store Header */}
      <div className="relative mb-6">
        <div className="h-48 w-full bg-gray-200 rounded-lg overflow-hidden">
          <img 
            src={store.imageUrl} 
            alt={store.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute left-4 bottom-4 bg-white p-4 rounded-lg shadow-md max-w-xl">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{store.name}</h1>
              <div className="flex items-center mt-1 mb-2">
                <div className="flex items-center bg-green-50 px-2 py-1 rounded text-sm mr-3">
                  <i className="ri-star-fill text-yellow-400 mr-1"></i>
                  <span className="font-medium text-green-800">{store.rating}</span>
                  <span className="text-gray-500 ml-1">({store.reviewCount})</span>
                </div>
                <span className="text-sm text-gray-600">0.8 miles away</span>
              </div>
              <p className="text-gray-600 max-w-lg">{store.description}</p>
            </div>
            <Button onClick={() => setIsVendorPanelOpen(true)} variant="outline" className="ml-4">
              <i className="ri-store-2-line mr-1"></i>
              Vendor Panel
            </Button>
          </div>
        </div>
      </div>
      
      {/* Store Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-sm text-gray-500">Delivery Time</span>
          <div className="font-semibold text-gray-800 flex items-center">
            <i className="ri-time-line mr-1 text-primary"></i>
            {store.deliveryTime}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-sm text-gray-500">Delivery Fee</span>
          <div className="font-semibold text-gray-800 flex items-center">
            <i className="ri-bike-line mr-1 text-primary"></i>
            ₹{store.deliveryFee.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-sm text-gray-500">Min. Order</span>
          <div className="font-semibold text-gray-800 flex items-center">
            <i className="ri-shopping-basket-2-line mr-1 text-primary"></i>
            ₹{store.minOrder.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-sm text-gray-500">Hours</span>
          <div className="font-semibold text-gray-800 flex items-center">
            <i className="ri-store-2-line mr-1 text-primary"></i>
            {store.openingHours}
          </div>
        </div>
      </div>
      
      {/* Products Section */}
      <div className="mb-8">
        <Tabs defaultValue="all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Products</h2>
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedCategory(null)}>
                All
              </TabsTrigger>
              {categories.map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id.toString()}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <TabsContent value="all">
            {isProductsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <i className="ri-shopping-basket-2-line text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Products Available</h3>
                <p className="text-gray-600">This store doesn't have any products in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>
          
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id.toString()}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products
                  .filter(product => product.categoryId === category.id)
                  .map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Categories Section */}
      <div className="mb-8">
        {productsByCategory.map(({ category, products }) => (
          <div key={category.id} className="mb-10">
            <div className="flex items-center mb-4">
              <div className={`${category.colorClass} w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
                <i className={`${category.icon} text-xl`}></i>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{category.name}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Vendor Panel */}
      <VendorPanel 
        storeId={storeId} 
        isOpen={isVendorPanelOpen} 
        onClose={() => setIsVendorPanelOpen(false)} 
      />
    </>
  );
}

function StorePageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
