import Hero from "../layout/Hero";
import AboutUs from "./visitors/home/AboutUs";
import Promotion from "./visitors/home/Promotion";
import Values from "./visitors/home/Values";

const Homepage = () => {
  return (
    <>
      <Hero />
      <Promotion />
      <AboutUs />
      <Values />
    </>
  );
};

export default Homepage;
