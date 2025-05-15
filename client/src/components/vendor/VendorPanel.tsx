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
import { Card, CardContent } from "@/components/ui/card";

interface VendorPanelProps {
  storeId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface OrderWithItems extends Order {
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function VendorPanel({ storeId, isOpen, onClose }: VendorPanelProps) {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("products");
  const { toast } = useToast();

  const { data: store } = useQuery<Store>({
    queryKey: [`/api/stores/${storeId}`],
    enabled: isOpen,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [`/api/products?storeId=${storeId}`],
    enabled: isOpen,
  });

  const { data: orders = [] } = useQuery<OrderWithItems[]>({
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

  // Calculate analytics metrics
  const analytics = {
    totalRevenue: orders
      .filter(order => order.status === "delivered")
      .reduce((sum, order) => sum + order.totalAmount, 0),
    totalOrders: orders.length,
    activeProducts: products.filter(p => p.isActive).length,
    lowStockProducts: products.filter(p => p.stock < 10).length,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    processingOrders: orders.filter(o => o.status === "processing").length,
    outForDeliveryOrders: orders.filter(o => o.status === "out_for_delivery").length,
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
    cancelledOrders: orders.filter(o => o.status === "cancelled").length,
    averageOrderValue: orders.length > 0 
      ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
      : 0
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-none flex items-center justify-between p-4 border-b bg-white">
          <DialogTitle className="text-xl font-bold text-gray-800">
            {store?.name || "Store Management"}
          </DialogTitle>
          <DialogClose className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <i className="ri-close-line text-2xl text-gray-500"></i>
          </DialogClose>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Products</h3>
                    <Button onClick={openAddProductForm}>
                      <i className="ri-add-line mr-1"></i>
                      Add Product
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => (
                      <Card key={product.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{product.name}</h4>
                              <p className="text-sm text-gray-600">{product.description}</p>
                              <p className="text-lg font-semibold mt-2">₹{product.price}</p>
                            </div>
                            <img 
                              src={product.imageUrl || ''} 
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          </div>
                          <div className="flex justify-end mt-4 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                              <i className="ri-edit-line mr-1"></i>
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteProduct(product.id)}>
                              <i className="ri-delete-bin-line mr-1"></i>
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="orders">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recent Orders</h3>
                  <div className="space-y-4">
                    {orders.map(order => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Order #{order.id}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                  <i className="ri-user-line mr-1"></i>
                                  Customer #{order.userId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <i className="ri-map-pin-line mr-1"></i>
                                  {order.deliveryAddress}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{order.totalAmount}</p>
                              <div className="mt-2">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="out_for_delivery">Out for Delivery</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="font-medium mb-2">Order Items</h5>
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>₹{item.price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Store Analytics</h3>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm text-gray-500">Total Revenue</h4>
                        <p className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm text-gray-500">Total Orders</h4>
                        <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm text-gray-500">Active Products</h4>
                        <p className="text-2xl font-bold">{analytics.activeProducts}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm text-gray-500">Average Order Value</h4>
                        <p className="text-2xl font-bold">₹{analytics.averageOrderValue.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Status Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm text-gray-500 mb-4">Order Status</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Pending</span>
                            <span className="font-medium">{analytics.pendingOrders}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Processing</span>
                            <span className="font-medium">{analytics.processingOrders}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Out for Delivery</span>
                            <span className="font-medium">{analytics.outForDeliveryOrders}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Delivered</span>
                            <span className="font-medium">{analytics.deliveredOrders}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Cancelled</span>
                            <span className="font-medium">{analytics.cancelledOrders}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Inventory Status */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm text-gray-500 mb-4">Inventory Status</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Total Products</span>
                            <span className="font-medium">{products.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Active Products</span>
                            <span className="font-medium">{analytics.activeProducts}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Low Stock Products</span>
                            <span className="font-medium text-yellow-600">{analytics.lowStockProducts}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Out of Stock</span>
                            <span className="font-medium text-red-600">
                              {products.filter(p => p.stock === 0).length}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="text-sm text-gray-500 mb-4">Recent Activity</h4>
                      <div className="space-y-3">
                        {orders.slice(0, 5).map(order => (
                          <div key={order.id} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">Order #{order.id}</span>
                              <span className="text-gray-500 ml-2">
                                {new Date(order.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                              <span className="font-medium">₹{order.totalAmount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
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
