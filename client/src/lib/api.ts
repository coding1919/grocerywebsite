import { Order } from "@shared/schema";

export async function cancelOrder(orderId: number): Promise<Order> {
  console.log('Attempting to cancel order:', orderId);
  
  try {
    const response = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    console.log('Response status:', response.status);
    
    // If the response is not OK, throw an error
    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }

    // Return a mock cancelled order for now
    return {
      id: orderId,
      status: 'cancelled',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalAmount: 0,
      deliveryAddress: '',
      userId: 1,
      storeId: 1,
      estimatedDelivery: null
    } as Order;
  } catch (e) {
    console.error('Network or other error:', e);
    throw new Error(e instanceof Error ? e.message : 'Failed to cancel order');
  }
}

export async function submitReview(orderId: number, rating: number, comment: string): Promise<void> {
  try {
    const response = await fetch(`/api/orders/${orderId}/review`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ rating, comment })
    });

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }
  } catch (e) {
    console.error('Network or other error:', e);
    throw new Error(e instanceof Error ? e.message : 'Failed to submit review');
  }
} 