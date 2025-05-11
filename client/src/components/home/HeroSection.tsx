import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HeroSection() {
  return (
    <section className="py-6 md:py-10">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 md:p-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
              Groceries Delivered in 30 Minutes
            </h1>
            <p className="text-gray-600 mb-6">
              Order from your favorite local stores with fast delivery right to your doorstep.
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary-dark text-white font-medium">
              <Link href="#stores">Shop Now</Link>
            </Button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
              alt="Person with grocery delivery" 
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
