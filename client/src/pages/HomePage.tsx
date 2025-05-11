import HeroSection from "@/components/home/HeroSection";
import CategoryNav from "@/components/home/CategoryNav";
import NearbyStores from "@/components/home/NearbyStores";
import PopularItems from "@/components/home/PopularItems";
import DeliveryBanner from "@/components/home/DeliveryBanner";
import StoreFeatured from "@/components/home/StoreFeatured";
import { Helmet } from "react-helmet";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>QuickMart - Grocery Delivery</title>
        <meta name="description" content="Order groceries from your favorite local stores with fast delivery right to your doorstep." />
      </Helmet>
      
      <HeroSection />
      <CategoryNav />
      <NearbyStores />
      <PopularItems />
      <DeliveryBanner />
      <StoreFeatured />
    </>
  );
}
