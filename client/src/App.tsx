import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import StorePage from "@/pages/StorePage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersPage from "@/pages/OrdersPage";
import VendorLoginPage from "@/pages/VendorLoginPage";
import VendorDashboardPage from "@/pages/VendorDashboardPage";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/cart/CartSidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/store/:id" component={StorePage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/vendor/login" component={VendorLoginPage} />
      <Route path="/vendor/dashboard" component={VendorDashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <CartProvider>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header />
          <main className="flex-grow container mx-auto px-4 pb-20 md:pb-10">
            <Router />
          </main>
          <MobileNav />
          <Footer />
          <CartSidebar />
          <Toaster />
        </div>
      </TooltipProvider>
    </CartProvider>
  );
}

export default App;
