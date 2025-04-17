import { motion } from "framer-motion";

const RoomAbout = () => {
  const handleViewRoomsClick = () => {
    const roomListElement = document.getElementById('room-list');
    if (roomListElement) {
      roomListElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const iconTitleVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const headingVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      filter: "blur(8px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const paragraphVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 15,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  const lineVariants = {
    hidden: {
      scaleX: 0,
      originX: 0,
    },
    visible: {
      scaleX: 1,
      transition: {
        delay: 0.2,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    hover: {
      scaleX: 1.1,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.section
      className="py-16 px-4 sm:px-8 md:px-16 lg:px-32 bg-white text-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      {/* Small Title with Icon */}
      <motion.div
        className="flex flex-col justify-center items-center mb-6"
        variants={iconTitleVariants}
      >
        <i className="fa fa-moon text-2xl sm:text-3xl text-purple-800 mb-3"></i>
        <h3 className="text-gray-500 uppercase tracking-widest text-sm sm:text-base md:text-lg">
          Hotel Rooms
        </h3>
      </motion.div>

      {/* Main Heading */}
      <motion.h1
        className="font-playfair font-bold text-gray-900 mb-6 leading-tight"
        style={{
          fontSize: "clamp(2rem, 5vw, 3.8rem)",
          lineHeight: "1.2",
        }}
        variants={headingVariants}
      >
        A Blend of Comfort and Elegance
      </motion.h1>

      {/* Description */}
      <motion.p
        className="text-gray-600 font-montserrat mx-auto mb-10"
        style={{
          maxWidth: "70ch",
          fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
          lineHeight: "1.7",
        }}
        variants={paragraphVariants}
      >
        Our rooms are designed to offer a peaceful retreat with a perfect mix of
        style and comfort. Enjoy a restful stay enhanced by modern amenities and
        thoughtful details, all crafted to make you feel at home.
      </motion.p>

      {/* Button */}
      <motion.button
<<<<<<< HEAD
        className="relative inline-flex items-center text-purple-800 hover:text-purple-900 font-semibold text-lg tracking-wide group"
=======
        className="relative inline-flex uppercase cursor-pointer items-center text-blue-800 hover:text-blue-900 font-semibold text-lg tracking-wide group"
>>>>>>> 62d490912c96215e7a7ad41a9f069e3641b5cb10
        variants={buttonVariants}
        whileHover="hover"
        onClick={handleViewRoomsClick}
      >
        View Rooms
        <motion.span
          className="ml-2 group-hover:translate-x-1 transition-transform duration-200"
          animate={{ x: [0, 3, 0] }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          &rarr;
        </motion.span>
        <motion.span
          className="absolute left-0 bottom-[-4px] w-full h-[1px] bg-purple-800"
          variants={lineVariants}
        ></motion.span>
      </motion.button>
    </motion.section>
  );
};

export default RoomAbout;
