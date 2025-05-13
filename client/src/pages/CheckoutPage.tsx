import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/context/CartContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";

// Form schema
const checkoutFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  city: z.string().min(2, { message: "City must be at least 2 characters" }),
  zipCode: z.string().min(5, { message: "Zip code must be at least 5 characters" }),
  deliveryInstructions: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage() {
  const { items, storeId, subtotal, deliveryFee, total, clearCart } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  // Initialize the form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      deliveryInstructions: "",
    },
  });

  const placingOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormValues) => {
      if (!storeId) throw new Error("No store selected");
      
      // Prepare order items
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Create full address
      const fullAddress = `${data.address}, ${data.city}, ${data.zipCode}`;
      
      // Prepare order data
      const orderData = {
        userId: 1, // Hardcoded for demo, in a real app would be the logged-in user
        storeId,
        totalAmount: total,
        deliveryAddress: fullAddress,
        items: orderItems
      };
      
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order placed successfully!",
        description: `Your order #${data.id} has been placed and will be delivered soon.`,
      });
      
      // Clear cart and navigate to order tracking/confirmation
      clearCart();
      navigate("/orders");
    },
    onError: (error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckoutFormValues) => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out",
        variant: "destructive",
      });
      return;
    }
    
    placingOrderMutation.mutate(data);
  };

  // If cart is empty, redirect to home
  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <Helmet>
          <title>Checkout - YourGrocer</title>
        </Helmet>
        <div className="max-w-md mx-auto">
          <i className="ri-shopping-cart-line text-6xl text-gray-300 mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Add items to your cart to continue with checkout.</p>
          <Button asChild>
            <a href="/">Continue Shopping</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Helmet>
        <title>Checkout - YourGrocer</title>
        <meta name="description" content="Complete your grocery order and get fast delivery to your doorstep." />
      </Helmet>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Apt 4B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="deliveryInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Leave at door, ring bell, call upon arrival, etc." 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4">
                    <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`border rounded-lg p-4 cursor-pointer ${
                          paymentMethod === 'cash' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${
                            paymentMethod === 'cash' ? 'border-primary' : 'border-gray-300'
                          }`}>
                            {paymentMethod === 'cash' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                            )}
                          </div>
                          <span className="font-medium">Cash on Delivery</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 pl-7">Pay when your order arrives</p>
                      </div>
                      
                      <div
                        className={`border rounded-lg p-4 cursor-pointer ${
                          paymentMethod === 'card' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${
                            paymentMethod === 'card' ? 'border-primary' : 'border-gray-300'
                          }`}>
                            {paymentMethod === 'card' && (
                              <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                            )}
                          </div>
                          <span className="font-medium">Credit Card</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 pl-7">Pay securely with credit card</p>
                      </div>
                    </div>
                  </div>
                  
                  {paymentMethod === 'card' && (
                    <div className="p-4 bg-gray-50 rounded-lg mt-4">
                      <p className="text-sm text-gray-500 mb-2">This is a demo, no actual payment will be processed.</p>
                      <div className="grid grid-cols-1 gap-4">
                        <Input placeholder="Card Number" disabled />
                        <div className="grid grid-cols-2 gap-4">
                          <Input placeholder="MM/YY" disabled />
                          <Input placeholder="CVC" disabled />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={placingOrderMutation.isPending}
                  >
                    {placingOrderMutation.isPending ? (
                      <span className="flex items-center">
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Processing...
                      </span>
                    ) : (
                      `Place Order - ${formatCurrency(total)}`
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-gray-100">
                    <div className="flex items-start">
                      <div className="text-gray-800">
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-800 text-lg pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <i className="ri-time-line text-primary mr-2"></i>
                  <span className="font-medium">Estimated Delivery Time</span>
                </div>
                <p className="text-gray-600">30-45 minutes from order confirmation</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
