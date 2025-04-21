import Hero from "../layout/Hero";
import AboutUs from "./visitors/home/AboutUs";
import ImageSlider from "./visitors/home/ImageSlider";
import Promotion from "./visitors/home/Promotion";
import Services from "./visitors/home/Services";

const Homepage = () => {
  return (
    <>
      <Hero />
      <Services />
      <ImageSlider />
    </>
  );
};

export default Homepage;
