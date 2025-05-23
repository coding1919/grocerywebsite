import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema, insertStoreSchema, insertProductSchema, 
  insertOrderSchema, insertOrderItemSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);
  
  // API Routes
  // All routes are prefixed with /api

  // Categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  // Stores
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      let stores;
      const search = req.query.search as string | undefined;
      const vendorId = req.query.vendorId ? parseInt(req.query.vendorId as string) : undefined;

      if (search) {
        stores = await storage.searchStores(search);
      } else if (vendorId && !isNaN(vendorId)) {
        stores = await storage.getStoresByVendor(vendorId);
      } else {
        stores = await storage.getStores();
      }
      
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stores" });
    }
  });

  app.get("/api/stores/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid store ID" });
      }

      const store = await storage.getStore(id);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: "Error fetching store" });
    }
  });

  app.post("/api/stores", async (req: Request, res: Response) => {
    try {
      const validatedData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(validatedData);
      res.status(201).json(store);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid store data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating store" });
    }
  });

  app.put("/api/stores/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid store ID" });
      }

      const updatedStore = await storage.updateStore(id, req.body);
      if (!updatedStore) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      res.json(updatedStore);
    } catch (error) {
      res.status(500).json({ message: "Error updating store" });
    }
  });

  app.delete("/api/stores/:id", async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Invalid store ID" });
      }

      console.log(`Attempting to delete store ${storeId}`);
      const success = await storage.deleteStore(storeId);
      console.log(`Store deletion result: ${success}`);

      if (!success) {
        return res.status(404).json({ message: "Store not found or could not be deleted" });
      }

      // Return success response
      res.status(200).json({ success: true, message: "Store deleted successfully" });
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  // Products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      let products;
      const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const search = req.query.search as string | undefined;

      if (search) {
        console.log('Searching products with query:', search);
        products = await storage.searchProducts(search);
        console.log('Found products:', products);
      } else if (storeId && !isNaN(storeId)) {
        products = await storage.getProductsByStore(storeId);
      } else if (categoryId && !isNaN(categoryId)) {
        products = await storage.getProductsByCategory(categoryId);
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Error updating product" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Orders
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      let orders;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;

      if (userId && !isNaN(userId)) {
        orders = await storage.getOrdersByUser(userId);
      } else if (storeId && !isNaN(storeId)) {
        orders = await storage.getOrdersByStore(storeId);
      } else {
        orders = await storage.getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get order items
      const orderItems = await storage.getOrderItems(id);
      
      res.json({ ...order, items: orderItems });
    } catch (error) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // Create order items
      const orderItems = req.body.items || [];
      for (const item of orderItems) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });
      }
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating order" });
    }
  });

  app.put("/api/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedOrder = await storage.updateOrderStatus(id, status);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error updating order status" });
    }
  });

  // Add new endpoint for cancelling orders
  app.post("/api/orders/:id/cancel", async (req: Request, res: Response) => {
    try {
      // Set content type explicitly
      res.setHeader('Content-Type', 'application/json');
      
      const id = parseInt(req.params.id);
      console.log("Attempting to cancel order:", id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrder(id);
      console.log("Found order:", order);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order is within 10 minutes of creation
      const orderTime = new Date(order.createdAt);
      const currentTime = new Date();
      const timeDiffInMinutes = (currentTime.getTime() - orderTime.getTime()) / (1000 * 60);
      console.log("Time difference in minutes:", timeDiffInMinutes);

      if (timeDiffInMinutes > 10) {
        return res.status(400).json({ 
          message: "Order cannot be cancelled after 10 minutes of placement",
          timeElapsed: Math.round(timeDiffInMinutes)
        });
      }

      // Check if order is already cancelled or delivered
      if (order.status === 'cancelled' || order.status === 'delivered') {
        return res.status(400).json({ message: "Order cannot be cancelled" });
      }

      const updatedOrder = await storage.updateOrderStatus(id, 'cancelled');
      console.log("Updated order:", updatedOrder);
      
      if (!updatedOrder) {
        return res.status(500).json({ message: "Failed to update order status" });
      }

      // Create a clean response object with only the necessary fields
      const responseOrder = {
        id: updatedOrder.id,
        userId: updatedOrder.userId,
        storeId: updatedOrder.storeId,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        deliveryAddress: updatedOrder.deliveryAddress,
        createdAt: updatedOrder.createdAt.toISOString(),
        estimatedDelivery: updatedOrder.estimatedDelivery ? updatedOrder.estimatedDelivery.toISOString() : null
      };

      return res.status(200).json(responseOrder);
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error; // Let the error handling middleware handle it
    }
  });

  // Users
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/logout", async (req: Request, res: Response) => {
    try {
      // In a real app, this would invalidate the session/token
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ message: "Error during logout" });
    }
  });
  
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      // In a real app, this would get the current user from session/token
      // For now, we'll return a 401 to simulate no authenticated user
      res.status(401).json({ message: "Not authenticated" });
      
      // When authentication is implemented, it would look more like:
      // const userId = req.session.userId;
      // if (!userId) {
      //   return res.status(401).json({ message: "Not authenticated" });
      // }
      // const user = await storage.getUser(userId);
      // if (!user) {
      //   return res.status(404).json({ message: "User not found" });
      // }
      // const { password: _, ...userWithoutPassword } = user;
      // res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
