import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
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
        stiffness: 100
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  const textVariants = {
    animate: {
      rotateY: [0, 10, 0, -10, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center px-4 py-12 overflow-hidden">
      <motion.div
        className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 3D 404 Error Code - Left Side */}
        <motion.div 
          className="w-full md:w-1/2 relative flex justify-center md:justify-end mb-8 md:mb-0"
          variants={itemVariants}
        >
          <div className="relative">
            <motion.h1
              className="text-[150px] sm:text-[180px] md:text-[18rem] font-extrabold text-red-700 bg-clip-text bg-transparent "
              variants={textVariants}
              animate="animate"
              style={{
                textShadow: "0 0 1px rgba(66, 153, 225, 0.5), 0 0 5px rgba(66, 153, 225, 0.3), 0 5px 10px rgba(104, 117, 245, 0.3), 0 15px 20px rgba(66, 0, 255, 0.2)",
                transformStyle: "preserve-3d",
                perspective: 3000
              }}
            >
              404
            </motion.h1>

            {/* Shadow effect */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4/5 h-6 bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-30 blur-md rounded-full"></div>

            {/* Floating eyes */}
            <motion.div
              className="absolute -top-12 right-0"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            >
              <span className="text-6xl">👀</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Text Content - Right Side */}
        <motion.div 
          className="w-full md:w-1/2 text-center md:text-left md:pl-8"
          variants={itemVariants}
        >
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4"
            variants={itemVariants}
          >
            Page Not Found
          </motion.h2>

          <motion.p
            className="text-gray-600 text-lg mb-8"
            variants={itemVariants}
          >
            The page you are looking for doesn't exist or has been moved.
          </motion.p>

          {/* Button */}
          <motion.button
            onClick={() => navigate("/")}
            className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-2xl text-white font-bold cursor-pointer rounded-full shadow-lg hover:shadow-xl"
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            Return to Homepage
          </motion.button>
        </motion.div>

        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-70"
            style={{
              width: Math.random() * 30 + 10,
              height: Math.random() * 30 + 10,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? '#6366F1' : '#8B5CF6',
              zIndex: -1,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default NotFound;