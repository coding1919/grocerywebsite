import {
  User, InsertUser, Store, InsertStore, Category, InsertCategory,
  Product, InsertProduct, Order, InsertOrder, OrderItem, InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface for all data operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Store methods
  getStores(): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  getStoresByVendor(vendorId: number): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, storeData: Partial<Store>): Promise<Store | undefined>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsByStore(storeId: number): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersByStore(storeId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Order item methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Session store
  sessionStore: session.SessionStore;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stores: Map<number, Store>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  private userIdCounter: number;
  private storeIdCounter: number;
  private categoryIdCounter: number;
  private productIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.stores = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.userIdCounter = 1;
    this.storeIdCounter = 1;
    this.categoryIdCounter = 1;
    this.productIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some sample data
    this.initializeData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id, isVendor: false };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Store methods
  async getStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoresByVendor(vendorId: number): Promise<Store[]> {
    return Array.from(this.stores.values())
      .filter(store => store.vendorId === vendorId);
  }

  async createStore(storeData: InsertStore): Promise<Store> {
    const id = this.storeIdCounter++;
    const store: Store = { 
      ...storeData, 
      id, 
      rating: 0,
      reviewCount: 0
    };
    this.stores.set(id, store);
    return store;
  }

  async updateStore(id: number, storeData: Partial<Store>): Promise<Store | undefined> {
    const existingStore = this.stores.get(id);
    if (!existingStore) return undefined;
    
    const updatedStore = { ...existingStore, ...storeData };
    this.stores.set(id, updatedStore);
    return updatedStore;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...categoryData, id };
    this.categories.set(id, category);
    return category;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByStore(storeId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.storeId === storeId);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.categoryId === categoryId);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { ...productData, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct = { ...existingProduct, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId);
  }

  async getOrdersByStore(storeId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.storeId === storeId);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    
    // Set estimated delivery time to 30-45 minutes from now
    const estimatedDelivery = new Date(now.getTime() + 30 * 60000 + Math.random() * 15 * 60000);
    
    const order: Order = { 
      ...orderData, 
      id, 
      status: 'pending',
      createdAt: now,
      estimatedDelivery
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder = { ...existingOrder, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Order item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }

  async createOrderItem(orderItemData: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const orderItem: OrderItem = { ...orderItemData, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Initialize with sample data
  private initializeData() {
    // Sample Categories
    const categories = [
      { id: 1, name: 'Fruits', icon: 'ri-apple-line', colorClass: 'bg-primary/10 text-primary' },
      { id: 2, name: 'Vegetables', icon: 'ri-plant-line', colorClass: 'bg-secondary/10 text-secondary' },
      { id: 3, name: 'Bakery', icon: 'ri-bread-line', colorClass: 'bg-accent/10 text-accent' },
      { id: 4, name: 'Dairy', icon: 'ri-milk-line', colorClass: 'bg-emerald-100 text-emerald-600' },
      { id: 5, name: 'Beverages', icon: 'ri-cup-line', colorClass: 'bg-amber-100 text-amber-600' },
      { id: 6, name: 'Masalas & Spices', icon: 'ri-seedling-line', colorClass: 'bg-rose-100 text-rose-600' },
      { id: 7, name: 'Atta & Rice', icon: 'ri-seed-line', colorClass: 'bg-yellow-100 text-yellow-600' },
      { id: 8, name: 'Household', icon: 'ri-home-gear-line', colorClass: 'bg-purple-100 text-purple-600' }
    ];
    
    categories.forEach(category => {
      this.categories.set(category.id, category as Category);
      this.categoryIdCounter = Math.max(this.categoryIdCounter, category.id + 1);
    });

    // Sample Vendor User
    const vendorUser: User = {
      id: 1,
      username: 'vendor1',
      password: 'password123',
      name: 'Rajesh Kumar',
      email: 'rajesh@grocerydukan.com',
      address: '42 M.G. Road, Bangalore, Karnataka 560001',
      phone: '9876543210',
      isVendor: true
    };
    this.users.set(vendorUser.id, vendorUser);
    this.userIdCounter = 2;

    // Sample Stores
    const stores = [
      {
        id: 1,
        vendorId: 1,
        name: 'Fresh Bazaar',
        description: 'Premium grocery store with fresh produce, dairy, and pantry essentials at affordable prices.',
        imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58',
        address: '23 Koramangala Main Road, Bangalore, Karnataka 560034',
        location: '12.9352,77.6245',
        rating: 4.8,
        reviewCount: 243,
        deliveryTime: '20-35 min',
        deliveryFee: 49,
        minOrder: 299,
        openingHours: '7AM - 10PM'
      },
      {
        id: 2,
        vendorId: 1,
        name: 'Organic India',
        description: 'Specializing in organic, pesticide-free vegetables and fruits sourced directly from local farmers.',
        imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d',
        address: '76 Indiranagar 100ft Road, Bangalore, Karnataka 560038',
        location: '12.9784,77.6408',
        rating: 4.6,
        reviewCount: 158,
        deliveryTime: '25-40 min',
        deliveryFee: 59,
        minOrder: 399,
        openingHours: '8AM - 9PM'
      },
      {
        id: 3,
        vendorId: 1,
        name: 'Kirana Express',
        description: 'Your neighborhood grocery store with all daily essentials delivered in under 30 minutes.',
        imageUrl: 'https://pixabay.com/get/gcf7cb827c648b7ccb499c8c97559278d1b2ee3c86b559293fb8d6050c4be518d9144fabdd937985cfdc4f6e15b6b311abc607c78441d6fb09dda152f15b29a39_1280.jpg',
        address: '112 JP Nagar 6th Phase, Bangalore, Karnataka 560078',
        location: '12.9063,77.5955',
        rating: 4.3,
        reviewCount: 92,
        deliveryTime: '15-25 min',
        deliveryFee: 29,
        minOrder: 199,
        openingHours: '6AM - 10PM'
      }
    ];
    
    stores.forEach(store => {
      this.stores.set(store.id, store as Store);
      this.storeIdCounter = Math.max(this.storeIdCounter, store.id + 1);
    });

    // Sample Products
    const products = [
      // Fresh Bazaar Products
      {
        id: 1,
        storeId: 1,
        categoryId: 1,
        name: 'Kashmiri Apples',
        description: 'Fresh, sweet and juicy apples from Kashmir valley.',
        price: 199,
        unit: 'kg',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
        stock: 48,
        sku: 'AP-1001',
        isActive: true
      },
      {
        id: 2,
        storeId: 1,
        categoryId: 4,
        name: 'Amul Full Cream Milk',
        description: 'Pasteurized full cream milk from Amul.',
        price: 68,
        unit: '1L',
        imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b',
        stock: 32,
        sku: 'ML-2045',
        isActive: true
      },
      {
        id: 3,
        storeId: 1,
        categoryId: 3,
        name: 'Whole Wheat Bread',
        description: 'Freshly baked whole wheat bread made with multigrain flour.',
        price: 49,
        unit: 'loaf',
        imageUrl: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec',
        stock: 8,
        sku: 'BR-3320',
        isActive: true
      },
      {
        id: 4,
        storeId: 1,
        categoryId: 6,
        name: 'MDH Garam Masala',
        description: 'Premium blend of aromatic spices for authentic Indian cooking.',
        price: 72,
        unit: '100g',
        imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578',
        stock: 23,
        sku: 'AV-9087',
        isActive: true
      },
      {
        id: 5,
        storeId: 1,
        categoryId: 4,
        name: 'Farm Fresh Brown Eggs',
        description: 'Naturally laid, free-range brown eggs from country farms.',
        price: 89,
        unit: '6pcs',
        imageUrl: 'https://pixabay.com/get/g787aa8184d5c21759dcab0cffb4bef7551f62ca39e69b02123ce6a8bdaa1857a0f43140784ba4e08153a4f123b38507ab3695f0346e6558a80d3d9ece665a864_1280.jpg',
        stock: 25,
        sku: 'EG-5623',
        isActive: true
      },
      {
        id: 6,
        storeId: 1,
        categoryId: 7,
        name: 'Aashirvaad Atta',
        description: 'Premium quality whole wheat flour for chapatis and rotis.',
        price: 249,
        unit: '5kg',
        imageUrl: 'https://images.unsplash.com/photo-1577069861033-55d04cec4ef5',
        stock: 15,
        sku: 'RS-6721',
        isActive: true
      },
      {
        id: 7,
        storeId: 1,
        categoryId: 2,
        name: 'Organic Broccoli',
        description: 'Fresh, crisp organic broccoli.',
        price: 2.49,
        unit: 'bunch',
        imageUrl: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c',
        stock: 30,
        sku: 'BR-7832',
        isActive: true
      },
      {
        id: 8,
        storeId: 1,
        categoryId: 2,
        name: 'Fresh Tomatoes',
        description: 'Vine-ripened tomatoes.',
        price: 3.29,
        unit: 'lb',
        imageUrl: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2',
        stock: 40,
        sku: 'TM-8943',
        isActive: true
      },
      {
        id: 9,
        storeId: 1,
        categoryId: 6,
        name: 'Organic Chicken Breast',
        description: 'Free-range organic chicken breast.',
        price: 8.99,
        unit: 'lb',
        imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791',
        stock: 18,
        sku: 'CH-9054',
        isActive: true
      },
      {
        id: 10,
        storeId: 1,
        categoryId: 3,
        name: 'Freshly Made Pasta',
        description: 'Artisanal freshly made pasta.',
        price: 6.49,
        unit: 'pack',
        imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14',
        stock: 12,
        sku: 'PA-1165',
        isActive: true
      },
      // Organic Market Products
      {
        id: 11,
        storeId: 2,
        categoryId: 1,
        name: 'Organic Bananas',
        description: 'Fresh organic bananas.',
        price: 1.99,
        unit: 'lb',
        imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919',
        stock: 50,
        sku: 'BN-2276',
        isActive: true
      },
      {
        id: 12,
        storeId: 2,
        categoryId: 2,
        name: 'Organic Spinach',
        description: 'Fresh organic spinach.',
        price: 3.99,
        unit: 'bag',
        imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb',
        stock: 20,
        sku: 'SP-3387',
        isActive: true
      },
      // QuickStop Mart Products
      {
        id: 13,
        storeId: 3,
        categoryId: 5,
        name: 'Bottled Water',
        description: 'Pure spring water.',
        price: 1.29,
        unit: 'bottle',
        imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad',
        stock: 100,
        sku: 'WT-4498',
        isActive: true
      },
      {
        id: 14,
        storeId: 3,
        categoryId: 7,
        name: 'Paper Towels',
        description: 'Absorbent paper towels.',
        price: 3.99,
        unit: 'roll',
        imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec',
        stock: 45,
        sku: 'PT-5509',
        isActive: true
      }
    ];
    
    products.forEach(product => {
      this.products.set(product.id, product as Product);
      this.productIdCounter = Math.max(this.productIdCounter, product.id + 1);
    });
  }
}

export const storage = new MemStorage();
