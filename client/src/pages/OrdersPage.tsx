import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order, Product, OrderItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import OrderTracking from "@/components/tracking/OrderTracking";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { cancelOrder, submitReview } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ReviewDialog } from "@/components/orders/ReviewDialog";

export default function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const cancelOrderMutation = useMutation({
    mutationFn: cancelOrder,
    onMutate: async (orderId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/orders?userId=${userId}`] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<Order[]>([`/api/orders?userId=${userId}`]);

      // Optimistically update to the new value
      queryClient.setQueryData<Order[]>(
        [`/api/orders?userId=${userId}`],
        old => old?.map(order => 
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ) ?? []
      );

      // Return a context object with the snapshotted value
      return { previousOrders };
    },
    onError: (error, orderId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrders) {
        queryClient.setQueryData(
          [`/api/orders?userId=${userId}`],
          context.previousOrders
        );
      }
      
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (cancelledOrder) => {
      // Close the tracking modal if it's open for the cancelled order
      if (selectedOrderId === cancelledOrder.id) {
        setSelectedOrderId(null);
      }
      
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: ({ orderId, rating, comment }: { orderId: number; rating: number; comment: string }) =>
      submitReview(orderId, rating, comment),
    onSuccess: () => {
      setReviewOrderId(null);
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
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

  const handleCancelOrder = (orderId: number) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleReviewOrder = (orderId: number) => {
    setReviewOrderId(orderId);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!reviewOrderId) return;
    await submitReviewMutation.mutateAsync({ orderId: reviewOrderId, rating, comment });
  };

  const canCancelOrder = (order: Order) => {
    const orderTime = new Date(order.createdAt);
    const currentTime = new Date();
    const timeDiffInMinutes = (currentTime.getTime() - orderTime.getTime()) / (1000 * 60);
    return timeDiffInMinutes <= 10 && order.status === 'pending';
  };

  const canReviewOrder = (order: Order) => {
    return order.status === 'delivered' && !order.reviewed;
  };
  
  return (
    <div className="py-8">
      <Helmet>
        <title>My Orders - YourGrocer</title>
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
                  onCancelOrder={() => handleCancelOrder(order.id)}
                  canCancel={canCancelOrder(order)}
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
                  onReviewOrder={() => handleReviewOrder(order.id)}
                  canReview={canReviewOrder(order)}
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

      <ReviewDialog
        orderId={reviewOrderId ?? 0}
        open={!!reviewOrderId}
        onClose={() => setReviewOrderId(null)}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  products: Product[];
  onTrackOrder: () => void;
  onCancelOrder?: () => void;
  onReviewOrder?: () => void;
  canCancel?: boolean;
  canReview?: boolean;
  isPastOrder?: boolean;
}

function OrderCard({ 
  order, 
  products, 
  onTrackOrder, 
  onCancelOrder, 
  onReviewOrder,
  canCancel, 
  canReview,
  isPastOrder = false 
}: OrderCardProps) {
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
          
          <div className="flex gap-2">
            <button 
              className="flex-1 py-2 px-4 bg-accent hover:bg-accent-dark text-white font-medium rounded transition flex items-center justify-center"
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
            
            {onCancelOrder && canCancel && (
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={onCancelOrder}
              >
                <i className="ri-close-circle-line mr-2"></i>
                Cancel Order
              </Button>
            )}

            {onReviewOrder && canReview && (
              <Button 
                variant="outline"
                className="flex-1"
                onClick={onReviewOrder}
              >
                <i className="ri-star-line mr-2"></i>
                Write Review
              </Button>
            )}
          </div>
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
