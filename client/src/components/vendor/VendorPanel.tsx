import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Product, Order } from "@shared/schema";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import ProductForm from "./ProductForm";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VendorPanelProps {
  storeId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorPanel({ storeId, isOpen, onClose }: VendorPanelProps) {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data: store } = useQuery<Store>({
    queryKey: [`/api/stores/${storeId}`],
    enabled: isOpen,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [`/api/products?storeId=${storeId}`],
    enabled: isOpen,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/orders?storeId=${storeId}`],
    enabled: isOpen,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products?storeId=${storeId}`] });
      toast({
        title: "Product deleted",
        description: "The product has been removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders?storeId=${storeId}`] });
      toast({
        title: "Order updated",
        description: "The order status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddProductOpen(true);
  };

  const handleStatusChange = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const openAddProductForm = () => {
    setEditingProduct(null);
    setIsAddProductOpen(true);
  };

  const closeAddProductForm = () => {
    setIsAddProductOpen(false);
    setEditingProduct(null);
  };

  if (!store) {
    return null;
  }

  // Count products by status
  const activeProducts = products.filter(p => p.isActive).length;
  const lowStockCount = products.filter(p => p.stock < 10).length;

  // Calculate revenue
  const totalRevenue = orders
    .filter(order => order.status === "delivered")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogTitle className="text-2xl font-bold text-gray-800">Vendor Dashboard</DialogTitle>
        <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
          <i className="ri-close-line text-2xl"></i>
        </DialogClose>
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary/10 rounded-lg p-4">
            <h3 className="text-sm text-gray-500 mb-1">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
            <p className="text-xs text-green-600 mt-1">↑ 8% from last week</p>
          </div>
          <div className="bg-secondary/10 rounded-lg p-4">
            <h3 className="text-sm text-gray-500 mb-1">Revenue</h3>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
          </div>
          <div className="bg-accent/10 rounded-lg p-4">
            <h3 className="text-sm text-gray-500 mb-1">Active Products</h3>
            <p className="text-2xl font-bold text-gray-800">{activeProducts}</p>
            <p className="text-xs text-gray-500 mt-1">of {products.length} total items</p>
          </div>
          <div className="bg-purple-100 rounded-lg p-4">
            <h3 className="text-sm text-gray-500 mb-1">Avg. Rating</h3>
            <p className="text-2xl font-bold text-gray-800">{store.rating.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">from {store.reviewCount} reviews</p>
          </div>
        </div>
        
        <Tabs defaultValue="products">
          <TabsList className="mb-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Product Management</h3>
              <Button onClick={openAddProductForm} className="bg-primary hover:bg-primary-dark flex items-center">
                <i className="ri-add-line mr-1"></i>
                Add Product
              </Button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No products found</td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-10 h-10 rounded-full object-cover mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500">SKU: {product.sku || `-`}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700">{product.categoryId || "Uncategorized"}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700">{formatCurrency(product.price)}/{product.unit}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${product.stock < 10 ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                              {product.stock} {product.unit}s
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.isActive 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              className="text-accent hover:text-accent-dark mr-3"
                              onClick={() => handleEditProduct(product)}
                            >
                              Edit
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="orders">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Recent Orders</h3>
              <Button variant="outline" className="text-primary hover:text-primary-dark font-medium text-sm">
                View All Orders
              </Button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No orders found</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id.toString().padStart(4, '0')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            User #{order.userId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              className="px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-gray-100 border-0"
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-accent hover:text-accent-dark">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <ProductForm 
          storeId={storeId} 
          product={editingProduct} 
          isOpen={isAddProductOpen} 
          onClose={closeAddProductForm} 
        />
      </DialogContent>
    </Dialog>
  );
}
