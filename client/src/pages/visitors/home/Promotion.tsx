import { motion } from "framer-motion";
import resort from "../../../assets/resort.jpg";

const Promotion = () => {
  const headingVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      rotateX: 90,
      scale: 0.8,
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.7,
        type: "spring",
        stiffness: 100,
        damping: 8,
      },
    }),
    hover: {
      y: -5,
      color: "#4F46E5",
      scale: 1.1,
      transition: { duration: 0.2 },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    }),
  };

  // Split heading into words, not characters, to maintain better readability
  const headingText = "Unparalleled luxury, timeless comfort";
  const headingWords = headingText.split(" ");

  // Split paragraph text into words
  const paragraphText =
    "Elevate the guest experience with a seamless and sophisticated hotel management solution. Designed for premium resorts and luxury accommodations, it streamlines operations while delivering unparalleled comfort, efficiency, and elegance.";
  const paragraphWords = paragraphText.split(" ");

  return (
    <div className=" bg-gray-50 p-5 py-10">
      <div className="flex flex-col md:flex-row items-center p-8 mx-4 sm:mx-6 md:mx-8 lg:mx-12 xl:mx-16 2xl:mx-20">
        {/* Image - Fluid Scaling */}
        <div
          className="w-full md:w-[750px] md:h-[620px] flex justify-center mb-8 md:mb-0 md:mr-8"
          data-aos="fade-right"
        >
          <img
            src={resort}
            alt="Luxury Hotel Experience"
            className="rounded-lg shadow-md w-full md:w-auto h-auto object-cover"
            loading="lazy"
            width="750"
            height="620"
          />
        </div>

        {/* Text Content */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <div className="py-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl text-gray-900 mb-6 font-playfair font-medium perspective-[1000px]">
              {headingWords.map((word, index) => (
                <motion.span
                  key={`word-${index}`}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  whileHover="hover"
                  viewport={{ once: true, margin: "-50px 0px" }}
                  variants={headingVariants}
                  className="inline-block origin-top transform-gpu mr-[0.25em]"
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </h2>
            <p className="text-gray-600 font-montserrat text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed flex flex-wrap">
              {paragraphWords.map((word, index) => (
                <motion.span
                  key={`word-${index}`}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={textVariants}
                  className="inline-block mr-[0.3em]"
                >
                  {word}
                </motion.span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promotion;
