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
  
  // Analytics data
  let totalRevenue = 0;
  let totalOrders = 0;
  let totalProducts = 0;
  
  return (
    <div className="py-8">
      <Helmet>
        <title>Vendor Dashboard - QuickMart</title>
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
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-green-600 mt-1">↑ 8% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-gray-600 mt-1">Across all stores</p>
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
            <p className="text-gray-600 mb-6">Create your first store to start selling on QuickMart</p>
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
                    src={store.imageUrl} 
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
                  <Button 
                    onClick={() => setSelectedStoreId(store.id)} 
                    className="w-full"
                  >
                    Manage Store
                  </Button>
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
                    <FormLabel>Store Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
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
                      <FormLabel>Delivery Fee ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="2.99"
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
                      <FormLabel>Minimum Order ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="15.00"
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
