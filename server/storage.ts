import {
  User, InsertUser, Store, InsertStore, Category, InsertCategory,
  Product, InsertProduct, Order, InsertOrder, OrderItem, InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./utils/passwordUtils";

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
  searchStores(query: string): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, storeData: Partial<Store>): Promise<Store | undefined>;
  deleteStore(id: number): Promise<boolean>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsByStore(storeId: number): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
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
  sessionStore: session.Store;
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
  
  sessionStore: session.Store;

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
    const user: User = { 
      ...userData, 
      id, 
      isVendor: userData.isVendor ?? false,
      address: userData.address || null,
      phone: userData.phone || null
    };
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
      reviewCount: 0,
      description: storeData.description || null,
      imageUrl: storeData.imageUrl || null,
      openingHours: storeData.openingHours || null,
      minOrder: storeData.minOrder || 0
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

  async deleteStore(id: number): Promise<boolean> {
    // First check if store exists
    const store = this.stores.get(id);
    if (!store) {
      console.log(`Store ${id} not found`);
      return false;
    }

    try {
      // Delete all products associated with this store
      const products = await this.getProductsByStore(id);
      console.log(`Deleting ${products.length} products for store ${id}`);
      for (const product of products) {
        const deleted = this.products.delete(product.id);
        console.log(`Product ${product.id} deleted: ${deleted}`);
      }

      // Delete all orders associated with this store
      const orders = await this.getOrdersByStore(id);
      console.log(`Deleting ${orders.length} orders for store ${id}`);
      for (const order of orders) {
        // Delete order items first
        const orderItems = await this.getOrderItems(order.id);
        console.log(`Deleting ${orderItems.length} order items for order ${order.id}`);
        for (const item of orderItems) {
          const deleted = this.orderItems.delete(item.id);
          console.log(`Order item ${item.id} deleted: ${deleted}`);
        }
        // Then delete the order
        const deleted = this.orders.delete(order.id);
        console.log(`Order ${order.id} deleted: ${deleted}`);
      }

      // Finally delete the store
      const deleted = this.stores.delete(id);
      console.log(`Store ${id} deleted: ${deleted}`);
      
      // Verify deletion
      const storeStillExists = this.stores.has(id);
      console.log(`Store ${id} still exists: ${storeStillExists}`);
      
      return deleted && !storeStillExists;
    } catch (error) {
      console.error('Error deleting store:', error);
      return false;
    }
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
    const product: Product = { 
      ...productData, 
      id,
      description: productData.description || null,
      imageUrl: productData.imageUrl || null,
      categoryId: productData.categoryId || null,
      stock: productData.stock || 0,
      sku: productData.sku || null,
      isActive: productData.isActive !== undefined ? productData.isActive : true
    };
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
    // Initialize categories
    const categories = [
      { name: "Dairy", icon: "ri-cup-fill", colorClass: "bg-blue-100 text-blue-600" },
      { name: "Bakery", icon: "ri-cake-2-line", colorClass: "bg-blue-100 text-blue-600" },
      { name: "Groceries", icon: "ri-shopping-bag-2-line", colorClass: "bg-blue-100 text-blue-600" },
      { name: "Beverages", icon: "ri-cup-line", colorClass: "bg-blue-100 text-blue-600" },
      { name: "Snacks", icon: "ri-restaurant-2-line", colorClass: "bg-blue-100 text-blue-600" },
      { name: "Fruits", icon: "ri-apple-line", colorClass: "bg-blue-100 text-blue-600" },
      { name: "Vegetables", icon: "ri-plant-line", colorClass: "bg-blue-100 text-blue-600" },
      { name: "Spices", icon: "ri-flask-line", colorClass: "bg-blue-100 text-blue-600" }
    ];

    // Initialize stores
    const stores = [
      {
        vendorId: 1,
        name: "More SuperMarket",
        description: "Your one-stop shop for all grocery needs",
        imageUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
        address: "123 Main Street",
        location: "12.9716,77.5946",
        deliveryTime: "20-35 min",
        deliveryFee: 30,
        minOrder: 100,
        openingHours: "7AM - 10PM"
      },
      {
        vendorId: 1,
        name: "Super Bazaar",
        description: "Traditional grocery store with authentic products",
        imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
        address: "456 Market Road",
        location: "12.9716,77.5946",
        deliveryTime: "15-30 min",
        deliveryFee: 25,
        minOrder: 50,
        openingHours: "6AM - 9PM"
      },
      {
        vendorId: 1,
        name: "Iyenger Bakery",
        description: "Fresh and delicious bakery items",
        imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
        address: "789 Bakery Lane",
        location: "12.9716,77.5946",
        deliveryTime: "10-25 min",
        deliveryFee: 20,
        minOrder: 30,
        openingHours: "6AM - 8PM"
      }
    ];

    // Initialize products
    const products = [
      // More SuperMarket Products
      {
        storeId: 1,
        categoryId: 1, // Dairy
        name: "Amul Butter",
        description: "Pure and creamy butter",
        price: 110,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        stock: 50,
        sku: "AMUL-BTR-200",
        isActive: true
      },
      {
        storeId: 1,
        categoryId: 1, // Dairy
        name: "Amul Paneer",
        description: "Fresh and soft paneer",
        price: 90,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 30,
        sku: "AMUL-PNR-200",
        isActive: true
      },
      {
        storeId: 1,
        categoryId: 3, // Groceries
        name: "India Gate Basmati Rice",
        description: "Premium quality basmati rice",
        price: 180,
        unit: "kg",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c",
        stock: 100,
        sku: "IG-RICE-1KG",
        isActive: true
      },
      {
        storeId: 1,
        categoryId: 4, // Beverages
        name: "Horlicks Original Refill",
        description: "Nutritious health drink",
        price: 230,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 40,
        sku: "HOR-REF-500",
        isActive: true
      },
      {
        storeId: 1,
        categoryId: 5, // Snacks
        name: "Kellogg's Corn Flakes (Honey)",
        description: "Crunchy honey flavored corn flakes",
        price: 120,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 35,
        sku: "KEL-CF-300",
        isActive: true
      },
      {
        storeId: 1,
        categoryId: 6, // Fruits
        name: "Fresh Apples",
        description: "Sweet and juicy apples",
        price: 200,
        unit: "kg",
        imageUrl: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb",
        stock: 25,
        sku: "FR-APP-1KG",
        isActive: true
      },
      {
        storeId: 1,
        categoryId: 6, // Fruits
        name: "Fresh Bananas",
        description: "Ripe and sweet bananas",
        price: 60,
        unit: "dozen",
        imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e",
        stock: 40,
        sku: "FR-BAN-DOZ",
        isActive: true
      },
      {
        storeId: 1,
        categoryId: 6, // Fruits
        name: "Fresh Oranges",
        description: "Juicy and tangy oranges",
        price: 150,
        unit: "kg",
        imageUrl: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9",
        stock: 30,
        sku: "FR-ORG-1KG",
        isActive: true
      },

      // Super Bazaar Products
      {
        storeId: 2,
        categoryId: 3, // Groceries
        name: "Ashirwad Atta",
        description: "Premium quality wheat flour",
        price: 75,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 60,
        sku: "ASH-ATTA-1",
        isActive: true
      },
      {
        storeId: 2,
        categoryId: 3, // Groceries
        name: "Sugar",
        description: "Pure white sugar",
        price: 45,
        unit: "kg",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 100,
        sku: "SUG-1KG",
        isActive: true
      },
      {
        storeId: 2,
        categoryId: 3, // Groceries
        name: "Rice",
        description: "Premium quality rice",
        price: 60,
        unit: "kg",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c",
        stock: 150,
        sku: "RICE-1KG",
        isActive: true
      },
      {
        storeId: 2,
        categoryId: 3, // Groceries
        name: "Cooking Oil",
        description: "Pure refined cooking oil",
        price: 130,
        unit: "liter",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 40,
        sku: "OIL-1L",
        isActive: true
      },
      {
        storeId: 2,
        categoryId: 4, // Beverages
        name: "Tea Powder",
        description: "Premium quality tea powder",
        price: 200,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 30,
        sku: "TEA-500G",
        isActive: true
      },
      {
        storeId: 2,
        categoryId: 8, // Spices
        name: "Red Chilli Powder",
        description: "Pure red chilli powder",
        price: 150,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 25,
        sku: "CHILLI-500G",
        isActive: true
      },
      {
        storeId: 2,
        categoryId: 3, // Groceries
        name: "Surf Excel",
        description: "Premium washing powder",
        price: 130,
        unit: "kg",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 35,
        sku: "SURF-1KG",
        isActive: true
      },
      {
        storeId: 2,
        categoryId: 3, // Groceries
        name: "Salt",
        description: "Iodized salt",
        price: 15,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 80,
        sku: "SALT-1",
        isActive: true
      },

      // Iyenger Bakery Products
      {
        storeId: 3,
        categoryId: 2, // Bakery
        name: "Vegetable Puffs",
        description: "Fresh and crispy vegetable puffs",
        price: 15,
        unit: "item",
        imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e505484ba",
        stock: 50,
        sku: "PUFF-1",
        isActive: true
      },
      {
        storeId: 3,
        categoryId: 2, // Bakery
        name: "Samosa",
        description: "Spicy and crispy samosas",
        price: 5,
        unit: "item",
        imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e505484ba",
        stock: 100,
        sku: "SAM-1",
        isActive: true
      },
      {
        storeId: 3,
        categoryId: 2, // Bakery
        name: "Cake Slice",
        description: "Delicious cake slices",
        price: 10,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e505484ba",
        stock: 40,
        sku: "SLICE-1",
        isActive: true
      },
      {
        storeId: 3,
        categoryId: 2, // Bakery
        name: "Biscuits",
        description: "Crispy and tasty biscuits",
        price: 10,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e505484ba",
        stock: 60,
        sku: "BISC-1",
        isActive: true
      },
      {
        storeId: 3,
        categoryId: 1, // Dairy
        name: "Milk",
        description: "Fresh and pure milk",
        price: 27,
        unit: "pack",
        imageUrl: "https://images.unsplash.com/photo-1589985273617-ee8e4f4d2b1e",
        stock: 30,
        sku: "MILK-1",
        isActive: true
      }
    ];

    // Initialize data
    async function initializeStorage(this: MemStorage) {
      // Create categories
      for (const category of categories) {
        await this.createCategory(category);
      }

      // Create stores
      for (const store of stores) {
        await this.createStore(store);
      }

      // Create products
      for (const product of products) {
        await this.createProduct(product);
      }
    }

    initializeStorage.call(this);
  }

  async searchStores(query: string): Promise<Store[]> {
    console.log('Searching stores with query:', query);
    const searchQuery = query.toLowerCase();
    const results = Array.from(this.stores.values()).filter(store => 
      store.name.toLowerCase().includes(searchQuery) ||
      (store.description?.toLowerCase().includes(searchQuery) ?? false)
    );
    console.log('Found stores:', results);
    return results;
  }

  async searchProducts(query: string): Promise<Product[]> {
    console.log('Searching products with query:', query);
    const searchQuery = query.toLowerCase();
    const results = Array.from(this.products.values()).filter(product => 
      product.name.toLowerCase().includes(searchQuery) ||
      (product.description?.toLowerCase().includes(searchQuery) ?? false)
    );
    console.log('Found products:', results);
    return results;
  }
}

export const storage = new MemStorage();
