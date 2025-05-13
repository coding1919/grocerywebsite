import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Store, Product, Order, insertStoreSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import VendorPanel from "@/components/vendor/VendorPanel";
import { Helmet } from "react-helmet";

// Store form schema
const storeFormSchema = z.object({
  name: z.string().min(2, { message: "Store name must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  location: z.string().min(1, { message: "Location is required" }), // Format: "lat,lng"
  imageUrl: z.string().url({ message: "Please enter a valid image URL" }),
  deliveryTime: z.string().min(1, { message: "Delivery time is required" }),
  deliveryFee: z.number().min(0, { message: "Delivery fee must be a positive number" }),
  minOrder: z.number().min(0, { message: "Minimum order must be a positive number" }),
  openingHours: z.string().min(1, { message: "Opening hours are required" }),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

export default function VendorDashboardPage() {
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Hard-coded vendor ID for demo
  const vendorId = 1;
  
  const { data: stores = [], isLoading: isStoresLoading } = useQuery<Store[]>({
    queryKey: [`/api/stores?vendorId=${vendorId}`],
  });

  // Fetch all orders for analytics
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/orders?vendorId=${vendorId}`],
  });

  // Fetch all products for analytics
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [`/api/products?vendorId=${vendorId}`],
  });

  // Delete store mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: number) => {
      const response = await apiRequest("DELETE", `/api/stores/${storeId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete store");
      }
      return storeId;
    },
    onMutate: async (deletedStoreId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/stores?vendorId=${vendorId}`] as const });

      // Snapshot the previous value
      const previousStores = queryClient.getQueryData<Store[]>([`/api/stores?vendorId=${vendorId}`] as const);

      // Optimistically update to the new value
      queryClient.setQueryData<Store[]>(
        [`/api/stores?vendorId=${vendorId}`] as const,
        old => old?.filter(store => store.id !== deletedStoreId) ?? []
      );

      // Return a context object with the snapshotted value
      return { previousStores };
    },
    onError: (err, deletedStoreId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStores) {
        queryClient.setQueryData(
          [`/api/stores?vendorId=${vendorId}`] as const,
          context.previousStores
        );
      }
      toast({
        title: "Failed to delete store",
        description: err.message,
        variant: "destructive",
      });
    },
    onSuccess: (deletedStoreId) => {
      // Force refetch the stores list
      queryClient.invalidateQueries({ 
        queryKey: [`/api/stores?vendorId=${vendorId}`] as const,
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/products?vendorId=${vendorId}`] as const,
        refetchType: 'all'
      });

      // Close the store panel if it was open
      if (selectedStoreId === deletedStoreId) {
        setSelectedStoreId(null);
      }

      toast({
        title: "Store deleted",
        description: "The store and all its products have been removed successfully",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is in sync
      queryClient.invalidateQueries({ 
        queryKey: [`/api/stores?vendorId=${vendorId}`] as const,
        refetchType: 'all'
      });
    },
  });

  const handleDeleteStore = (storeId: number) => {
    if (window.confirm("Are you sure you want to delete this store? This will also delete all products and orders associated with this store. This action cannot be undone.")) {
      deleteStoreMutation.mutate(storeId);
    }
  };
  
  // Calculate analytics
  const analytics = {
    totalRevenue: orders
      .filter(order => order.status === "delivered")
      .reduce((sum, order) => sum + order.totalAmount, 0),
    totalOrders: orders.length,
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isActive).length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    processingOrders: orders.filter(o => o.status === "processing").length,
    outForDeliveryOrders: orders.filter(o => o.status === "out_for_delivery").length,
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
    cancelledOrders: orders.filter(o => o.status === "cancelled").length,
    averageOrderValue: orders.length > 0 
      ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
      : 0
  };

  // Calculate month-over-month growth
  const lastMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return orderDate >= lastMonth;
  });

  const lastMonthRevenue = lastMonthOrders
    .filter(order => order.status === "delivered")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const revenueGrowth = analytics.totalRevenue > 0 && lastMonthRevenue > 0
    ? ((analytics.totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  const orderGrowth = orders.length > 0 && lastMonthOrders.length > 0
    ? ((orders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100
    : 0;
  
  const storeForm = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      location: "40.7128,-74.0060", // Default to NYC coordinates
      imageUrl: "",
      deliveryTime: "30-45 min",
      deliveryFee: 2.99,
      minOrder: 15.00,
      openingHours: "9AM - 9PM",
    },
  });
  
  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreFormValues) => {
      const storeData = {
        ...data,
        vendorId
      };
      const res = await apiRequest("POST", "/api/stores", storeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stores?vendorId=${vendorId}`] });
      toast({
        title: "Store created successfully",
        description: "Your new store has been added to the platform",
      });
      setIsStoreModalOpen(false);
      storeForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create store",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmitStore = (data: StoreFormValues) => {
    createStoreMutation.mutate(data);
  };
  
  return (
    <div className="py-8">
      <Helmet>
        <title>Vendor Dashboard - YourGrocer</title>
        <meta name="description" content="Manage your grocery store, products, and orders." />
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vendor Dashboard</h1>
        <Button onClick={() => setIsStoreModalOpen(true)}>
          <i className="ri-add-line mr-1"></i>
          Add New Store
        </Button>
      </div>
      
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className={`text-xs ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
              {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className={`text-xs ${orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
              {orderGrowth >= 0 ? '↑' : '↓'} {Math.abs(orderGrowth).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProducts}</div>
            <p className="text-xs text-gray-600 mt-1">
              {analytics.activeProducts} active products
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Stores Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Stores</h2>
        
        {isStoresLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse">
                <div className="bg-gray-200 h-32"></div>
                <CardContent className="p-4">
                  <div className="bg-gray-200 h-5 w-3/4 mb-2 rounded"></div>
                  <div className="bg-gray-200 h-4 w-1/2 mb-4 rounded"></div>
                  <div className="bg-gray-200 h-8 w-full rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <Card className="bg-gray-50 p-8 text-center">
            <i className="ri-store-2-line text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Stores Yet</h3>
            <p className="text-gray-600 mb-6">Create your first store to start selling on YourGrocer</p>
            <Button onClick={() => setIsStoreModalOpen(true)}>
              <i className="ri-add-line mr-1"></i>
              Add New Store
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map(store => (
              <Card key={store.id} className="overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img 
                    src={store.imageUrl || '/placeholder-store.jpg'} 
                    alt={store.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">{store.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
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
                      {store.openingHours}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setSelectedStoreId(store.id)} 
                      className="flex-1"
                    >
                      Manage Store
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteStore(store.id)}
                      disabled={deleteStoreMutation.isPending}
                    >
                      {deleteStoreMutation.isPending ? (
                        <i className="ri-loader-4-line animate-spin"></i>
                      ) : (
                        <i className="ri-delete-bin-line"></i>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Store Modal */}
      <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Add New Store</DialogTitle>
          <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
            <i className="ri-close-line text-2xl"></i>
          </DialogClose>
          
          <Form {...storeForm}>
            <form onSubmit={storeForm.handleSubmit(onSubmitStore)} className="space-y-4">
              <FormField
                control={storeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Fresh Foods Market" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={storeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Fresh produce, dairy, bakery, and grocery items..." 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={storeForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, New York, NY 10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={storeForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Image</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-4">
                        <Input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Here you would typically upload the file to your server
                              // and get back a URL. For now, we'll use a placeholder
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                field.onChange(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {field.value && (
                          <img 
                            src={field.value} 
                            alt="Store preview" 
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={storeForm.control}
                  name="deliveryTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Time</FormLabel>
                      <FormControl>
                        <Input placeholder="20-35 min" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={storeForm.control}
                  name="deliveryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Fee (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="49.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={storeForm.control}
                  name="minOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="199.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={storeForm.control}
                  name="openingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Hours</FormLabel>
                      <FormControl>
                        <Input placeholder="9AM - 9PM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={storeForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (lat,lng)</FormLabel>
                    <FormControl>
                      <Input placeholder="40.7128,-74.0060" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsStoreModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createStoreMutation.isPending}
                >
                  {createStoreMutation.isPending ? (
                    <span className="flex items-center">
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Creating...
                    </span>
                  ) : (
                    'Create Store'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Store Management Panel */}
      {selectedStoreId && (
        <VendorPanel
          storeId={selectedStoreId}
          isOpen={!!selectedStoreId}
          onClose={() => setSelectedStoreId(null)}
        />
      )}
    </div>
  );
}

// Dialog component
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    // Prevent scrolling when dialog is open
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

function DialogContent({ className, children }: DialogContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
}

function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-xl font-bold text-gray-800 mb-4">{children}</h2>
  );
}

interface DialogCloseProps {
  className?: string;
  children: React.ReactNode;
}

function DialogClose({ className, children }: DialogCloseProps) {
  return (
    <button className={`${className}`}>
      {children}
    </button>
  );
}
