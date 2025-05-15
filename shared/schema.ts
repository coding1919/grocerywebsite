import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  isVendor: boolean("is_vendor").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, isVendor: true });

// Store model
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  address: text("address").notNull(),
  location: text("location").notNull(), // Could be coordinates as string "lat,long"
  rating: doublePrecision("rating").default(0).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  deliveryTime: text("delivery_time").notNull(), // e.g., "20-35 min"
  deliveryFee: doublePrecision("delivery_fee").notNull(),
  minOrder: doublePrecision("min_order").default(0).notNull(),
  openingHours: text("opening_hours"), // e.g., "7AM - 10PM"
});

export const insertStoreSchema = createInsertSchema(stores)
  .omit({ id: true, rating: true, reviewCount: true });

// Category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(), // Icon name/class
  colorClass: text("color_class").notNull(), // Tailwind CSS color class
});

export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true });

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),
  categoryId: integer("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  unit: text("unit").notNull(), // e.g., "lb", "gal", "pack"
  imageUrl: text("image_url"),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true });

// Order model
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  storeId: integer("store_id").notNull().references(() => stores.id),
  status: text("status").notNull().default("pending"), // "pending", "processing", "out_for_delivery", "delivered"
  totalAmount: doublePrecision("total_amount").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  reviewed: boolean("reviewed").default(false).notNull(),
});

export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, status: true, createdAt: true });

// Order Item model
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(), // Price at time of purchase
});

export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = {
  username: string;
  password: string;
  name: string;
  email: string;
  address?: string | null;
  phone?: string | null;
  isVendor?: boolean;
};

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
