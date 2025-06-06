import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import StorePage from "@/pages/StorePage";
import StoreBrowsePage from "@/pages/StoreBrowsePage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersPage from "@/pages/OrdersPage";
import VendorLoginPage from "@/pages/VendorLoginPage";
import VendorDashboardPage from "@/pages/VendorDashboardPage";
import CustomerDashboardPage from "@/pages/CustomerDashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import AuthPage from "@/pages/auth-page";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/cart/CartSidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/store/:id" component={StorePage} />
      <Route path="/stores" component={StoreBrowsePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/vendor/login" component={VendorLoginPage} />
      
      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/dashboard" component={CustomerDashboardPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/vendor/dashboard" component={VendorDashboardPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
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
          </div>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
