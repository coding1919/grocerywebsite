import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Order, Product, OrderItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import OrderTracking from "@/components/tracking/OrderTracking";
import { Helmet } from "react-helmet";

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  // Hard-coded user ID for demo
  const userId = 1;
  
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders?userId=${userId}`],
  });
  
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  const { data: selectedOrder, isLoading: isSelectedOrderLoading } = useQuery<Order & { items: OrderItem[] }>({
    queryKey: [`/api/orders/${selectedOrderId}`],
    enabled: !!selectedOrderId,
  });
  
  const activeOrders = orders.filter(order => 
    order.status !== "delivered" && order.status !== "cancelled"
  );
  
  const pastOrders = orders.filter(order => 
    order.status === "delivered" || order.status === "cancelled"
  );
  
  const handleOpenTracking = (orderId: number) => {
    setSelectedOrderId(orderId);
  };
  
  const handleCloseTracking = () => {
    setSelectedOrderId(null);
  };
  
  return (
    <div className="py-8">
      <Helmet>
        <title>My Orders - QuickMart</title>
        <meta name="description" content="Track your grocery orders and view order history." />
      </Helmet>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="past">Past Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isOrdersLoading ? (
            <OrdersSkeleton />
          ) : activeOrders.length === 0 ? (
            <EmptyOrdersState message="You don't have any active orders" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrders.map(order => (
                <OrderCard 
                  key={order.id}
                  order={order}
                  products={products}
                  onTrackOrder={() => handleOpenTracking(order.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {isOrdersLoading ? (
            <OrdersSkeleton />
          ) : pastOrders.length === 0 ? (
            <EmptyOrdersState message="You don't have any past orders" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastOrders.map(order => (
                <OrderCard 
                  key={order.id}
                  order={order}
                  products={products}
                  onTrackOrder={() => handleOpenTracking(order.id)}
                  isPastOrder
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <OrderTracking
        order={selectedOrder}
        products={products}
        open={!!selectedOrderId}
        onClose={handleCloseTracking}
      />
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  products: Product[];
  onTrackOrder: () => void;
  isPastOrder?: boolean;
}

function OrderCard({ order, products, onTrackOrder, isPastOrder = false }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.id.toString().padStart(4, '0')}</CardTitle>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Delivery Address</h3>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">Total Amount</h3>
            <p className="text-lg font-semibold text-gray-800">{formatCurrency(order.totalAmount)}</p>
          </div>
          
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700">Estimated Delivery</h3>
              <p className="text-sm text-gray-600">
                {order.estimatedDelivery ? formatDateTime(order.estimatedDelivery) : 'Calculating...'}
              </p>
            </div>
          )}
          
          <button 
            className="w-full mt-3 py-2 px-4 bg-accent hover:bg-accent-dark text-white font-medium rounded transition flex items-center justify-center"
            onClick={onTrackOrder}
          >
            {isPastOrder ? (
              <>
                <i className="ri-file-list-line mr-2"></i>
                View Order Details
              </>
            ) : (
              <>
                <i className="ri-map-pin-line mr-2"></i>
                Track Order
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function OrdersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-3/4 mb-3" />
          <Skeleton className="h-6 w-1/4 mb-5" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyOrdersState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 bg-gray-50 rounded-lg">
      <i className="ri-shopping-bag-line text-5xl text-gray-300 mb-4"></i>
      <h3 className="text-lg font-medium text-gray-800 mb-2">{message}</h3>
      <p className="text-gray-600 mb-6">Browse stores and place an order to see it here</p>
      <a 
        href="/" 
        className="py-2 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded transition"
      >
        Shop Now
      </a>
    </div>
  );
}
