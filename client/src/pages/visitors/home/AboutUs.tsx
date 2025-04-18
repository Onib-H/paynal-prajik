import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import aboutUs_bg from "../../../assets/aboutUs_bg.jpg";
import philosophy from "../../../assets/philosophy.jpg";

const AboutUs = () => {
  const titleVariants = {
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
      color: "#1E40AF",
      scale: 1.03,
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

  const subtitleVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.8,
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.2 },
    },
  };

  const aboutUsTitle = "Experience Luxury and Comfort at Azurea Hotel".split(
    " "
  );
  const aboutUsText =
    "Discover a place where elegance meets comfort. Azurea Hotel offers top-notch amenities, personalized services, and a welcoming atmosphere that makes every stay unforgettable. Whether for business or leisure, Azurea is your perfect destination.".split(
      " "
    );

  const philosophyTitle = "Creating Memorable Experiences".split(" ");
  const philosophyText =
    "We believe in offering more than just a place to stay. Azurea Hotel is a place where memories are made — whether you're on a romantic getaway, a family vacation, or a business trip.".split(
      " "
    );

  return (
    <section className="py-16 px-8 bg-white">
      {/* First Section */}
      <div className="max-w-[90%] lg:max-w-[85%] mx-auto flex flex-col md:flex-row-reverse gap-12 items-stretch mb-16">
        <div
          className="w-full md:w-1/2 flex justify-center"
          data-aos="fade-left"
        >
          <img
            loading="lazy"
            src={aboutUs_bg}
            alt="About Us"
            className="w-[90%] sm:w-[90%] md:w-full lg:w-[90%] xl:w-[85%] h-full object-cover rounded-2xl shadow-lg transition-all duration-300"
          />
        </div>
        <div className="w-full md:w-1/2 flex-col justify-center space-y-6">
          <motion.h3
            className="text-purple-800 uppercase text-sm sm:text-base md:text-lg font-light font-montserrat tracking-widest flex items-center gap-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={subtitleVariants}
          >
            <i className="fa fa-moon"></i> About Us
          </motion.h3>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-playfair text-gray-800 leading-snug perspective-[1000px]">
            {aboutUsTitle.map((word, index) => (
              <motion.span
                key={`about-title-${index}`}
                custom={index}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true }}
                variants={titleVariants}
                className="inline-block origin-top transform-gpu mr-[0.25em]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <p className="text-gray-600 font-montserrat text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed flex flex-wrap">
            {aboutUsText.map((word, index) => (
              <motion.span
                key={`about-text-${index}`}
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
          <motion.button
            className="mt-6 inline-block font-montserrat bg-gradient-to-r from-blue-800 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg rounded-full shadow-md hover:bg-blue-700 transition-all"
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
            variants={buttonVariants}
          >
            More about us &rarr;
          </motion.button>
        </div>
      </div>

      {/* Second Section */}
      <div className="max-w-[90%] lg:max-w-[85%] mx-auto flex flex-col md:flex-row gap-12 items-stretch">
        <div
          className="w-full md:w-1/2 flex justify-center"
          data-aos="fade-right"
        >
          <img
            loading="lazy"
            src={philosophy}
            alt="Our Philosophy"
            className="w-[90%] sm:w-[90%] md:w-full lg:w-[90%] xl:w-[85%] h-full object-cover rounded-2xl shadow-lg transition-all duration-300"
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
          <motion.h3
            className="text-purple-800 uppercase text-sm sm:text-base md:text-lg font-light font-montserrat tracking-widest flex items-center gap-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={subtitleVariants}
          >
            <i className="fa fa-moon"></i> Our Philosophy
          </motion.h3>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold font-playfair text-gray-800 leading-snug perspective-[1000px]">
            {philosophyTitle.map((word, index) => (
              <motion.span
                key={`philosophy-title-${index}`}
                custom={index}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true }}
                variants={titleVariants}
                className="inline-block origin-top transform-gpu mr-[0.25em]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <p className="text-gray-600 font-montserrat text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed flex flex-wrap">
            {philosophyText.map((word, index) => (
              <motion.span
                key={`philosophy-text-${index}`}
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
          <Link to="/">
            <motion.button
              className="mt-6 inline-block font-montserrat bg-gradient-to-r from-blue-800 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg rounded-full shadow-md hover:bg-blue-700 transition-all"
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true }}
              variants={buttonVariants}
            >
              Book with us &rarr;
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
