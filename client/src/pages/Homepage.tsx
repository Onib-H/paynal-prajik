import Hero from "../layout/Hero";
import ImageSlider from "./visitors/home/ImageSlider";
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
