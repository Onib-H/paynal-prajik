import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Services = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="w-full min-h-[80vh] py-8 bg-gray-50 flex items-center">
      <div className="w-[85vw] mx-auto">
        {/* Section Title with animation */}
        <motion.h2
          className="font-playfair font-bold text-gray-900 mb-12 text-3xl md:text-5xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={titleVariants}
        >
          Our Services
        </motion.h2>

        {/* Services Grid with staggered animations */}
        <motion.div
          className="grid grid-cols-1 xl:grid-cols-2 gap-12 h-full"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          {/* Room Booking */}
          <motion.div
            className="flex flex-col items-center text-center p-9 hover:bg-white hover:shadow-lg rounded-xl transition-all duration-300 h-full"
            variants={itemVariants}
          >
            <motion.div
              className="w-24 h-24 bg-gradient-to-r from-indigo-800 to-purple-800 text-white flex justify-center items-center rounded-full mb-6"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <i className="fas fa-bed text-4xl"></i>
            </motion.div>
            <h3 className="font-playfair text-3xl font-semibold mb-6">
              Room Booking
            </h3>
            <p className="text-gray-700 font-medium font-montserrat leading-relaxed flex-grow">
              Discover our luxury suites and rooms featuring real-time
              availability, instant confirmation, premium amenities, and
              personalized check-in services for your perfect stay
            </p>
            <Link to={"/rooms"}>
              <motion.button
                className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-800 to-purple-800 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Rooms
              </motion.button>
            </Link>
          </motion.div>

          {/* Venue Reservation */}
          <motion.div
            className="flex flex-col items-center text-center p-9 hover:bg-white hover:shadow-lg rounded-xl transition-all duration-300 h-full"
            variants={itemVariants}
          >
            <motion.div
              className="w-24 h-24 bg-gradient-to-r from-indigo-800 to-purple-800 text-white flex justify-center items-center rounded-full mb-6"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <i className="fas fa-map-marked-alt text-4xl"></i>
            </motion.div>
            <h3 className="font-playfair text-3xl font-semibold mb-6">
              Area Reservation
            </h3>
            <p className="text-gray-700 font-medium font-montserrat leading-relaxed flex-grow">
              Celebrate memorable occasions in our exquisite venues, featuring
              tailored event planning, premium catering, and spaces for intimate
              to large gatherings.
            </p>
            <Link to={"/areas"}>
              <motion.button
                className="mt-6 px-6 py-2 bg-gradient-to-r from-indigo-800 to-purple-800 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Areas
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;
