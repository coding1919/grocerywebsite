import { useState } from "react";
import { Order, OrderItem, Product } from "@shared/schema";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface OrderTrackingProps {
  order?: Order & { items?: OrderItem[] };
  products?: Product[];
  open: boolean;
  onClose: () => void;
}

export default function OrderTracking({ order, products = [], open, onClose }: OrderTrackingProps) {
  if (!order) return null;

  const getProductById = (id: number) => {
    return products.find(product => product.id === id);
  };

  const steps = [
    {
      id: 'confirmed',
      label: 'Order Confirmed',
      time: formatDateTime(order.createdAt),
      description: 'Your order has been received by the store.',
      icon: 'ri-check-line',
      isCompleted: true
    },
    {
      id: 'processing',
      label: 'Order Processing',
      time: formatDateTime(new Date(order.createdAt.getTime() + 5 * 60000)),
      description: 'The store is preparing your items for delivery.',
      icon: 'ri-check-line',
      isCompleted: order.status !== 'pending'
    },
    {
      id: 'out_for_delivery',
      label: 'Out for Delivery',
      time: formatDateTime(new Date(order.createdAt.getTime() + 15 * 60000)),
      description: 'Your order is on its way to you.',
      icon: 'ri-check-line',
      isCompleted: order.status === 'out_for_delivery' || order.status === 'delivered'
    },
    {
      id: 'delivered',
      label: 'Delivered',
      time: order.status === 'delivered' 
        ? formatDateTime(new Date()) 
        : `Estimated by ${formatDateTime(order.estimatedDelivery || new Date())}`,
      description: 'Your order will be delivered to your address.',
      icon: 'ri-home-4-line',
      isCompleted: order.status === 'delivered'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="text-2xl font-bold text-gray-800">Track Your Order</DialogTitle>
        <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
          <i className="ri-close-line text-2xl"></i>
        </DialogClose>
        
        {/* Order Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between mb-2">
            <div>
              <h3 className="text-sm text-gray-500">Order Number</h3>
              <p className="font-semibold text-gray-800">#{order.id.toString().padStart(4, '0')}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Order Date</h3>
              <p className="font-semibold text-gray-800">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Estimated Delivery</h3>
              <p className="font-semibold text-gray-800">
                {formatDateTime(order.estimatedDelivery || new Date())}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Delivery Address</h3>
            <p className="font-semibold text-gray-800">{order.deliveryAddress}</p>
          </div>
        </div>
        
        {/* Order Tracking Steps */}
        <div className="relative mb-8">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
          
          {steps.map((step, index) => (
            <div key={step.id} className="relative z-10 flex mb-8">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step.isCompleted 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-500'
              } border-4 border-white`}>
                <i className={step.icon}></i>
              </div>
              <div className="ml-4">
                <h3 className={`font-semibold ${
                  step.isCompleted ? 'text-gray-800' : 'text-gray-500'
                }`}>{step.label}</h3>
                <p className="text-sm text-gray-500">{step.time}</p>
                <p className={`text-sm ${
                  step.isCompleted ? 'text-gray-600' : 'text-gray-500'
                } mt-1`}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Delivery Map */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Delivery Location</h3>
          <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
            <p className="text-gray-500">Map View - Delivery Location</p>
          </div>
        </div>
        
        {/* Order Items */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Order Items</h3>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {order.items?.map((item) => {
              const product = getProductById(item.productId);
              if (!product) return null;
              
              return (
                <div key={item.id} className="p-4 flex items-center">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-12 h-12 object-cover rounded-md mr-4"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">{formatCurrency(item.price)}</p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
