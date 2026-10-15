import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategorySlider from "@/components/CategorySlider";
import HomeCategorySections from "@/components/HomeCategorySections";
import TopSellingProducts from "@/components/TopSellingProducts";
import PromoBanners from "@/components/PromoBanners";
import AllProducts from "@/components/AllProducts";
import CustomerReviews from "@/components/CustomerReviews";
import VideoGallery from "@/components/VideoGallery";
import KeyPoints from "@/components/KeyPoints";
import MoneyBackBanner from "@/components/MoneyBackBanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <CategorySlider />
        <HomeCategorySections />
        <TopSellingProducts />
        <AllProducts />
        <PromoBanners />
        <CustomerReviews />
        <VideoGallery />
        <KeyPoints />
        <MoneyBackBanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
