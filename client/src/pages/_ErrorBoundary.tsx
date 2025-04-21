import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faArrowRotateRight } from "@fortawesome/free-solid-svg-icons";

const Error = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    }
  };

  const circleVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl p-8 md:p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-red-400 via-red-500 to-red-600"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-100 rounded-full opacity-20"></div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Icon section */}
          <motion.div
            animate="pulse"
            className="relative"
          >
            <div className="relative h-32 w-32 flex items-center justify-center">
              <svg
                className="absolute top-0 left-0 h-full w-full"
                viewBox="0 0 100 100"
              >
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="6"
                  strokeLinecap="round"
                  variants={circleVariants}
                />
              </svg>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                size="7x"
                className="text-red-500 h-16 w-16"
              />
            </div>
          </motion.div>

          {/* Content section */}
          <div className="flex-1 text-center md:text-left">
            <motion.h1
              variants={itemVariants}
              className="text-3xl font-bold text-gray-800 mb-2"
            >
              Something went wrong
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-gray-600 mb-6"
            >
              We're experiencing some technical difficulties.
            </motion.p>

            {/* Button row */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
            >
              <motion.button
                onClick={() => window.location.reload()}
                className="p-3 cursor-pointer bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FontAwesomeIcon icon={faArrowRotateRight} className="mr-1" />
                Reload Now
              </motion.button>

              <motion.button
                onClick={() => window.history.back()}
                className="p-3 border border-gray-300 hover:border-gray-400 cursor-pointer text-gray-700 rounded-lg shadow-sm flex items-center justify-center transition-colors duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Go Back
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Error;