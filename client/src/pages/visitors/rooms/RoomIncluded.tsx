import { motion } from "framer-motion";

const RoomIncluded = () => {
  const features = [
    "Large Bathroom",
    "Fast WiFi",
    "Soft and Clean Bed Sheets",
    "Smart TV",
    "24/7 Room Service",
    "Free Breakfast",
    "Air Conditioning",
    "Work Desk",
    "Free Toiletries",
    "Safe for Valuables",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.3,
      },
    },
  };

  const headerVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      clipPath: "inset(0 0 100% 0)",
    },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: "inset(0 0 0% 0)",
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const featureVariants = {
    hidden: {
      opacity: 0,
      rotateX: 90,
      y: 20,
    },
    visible: (i: number) => ({
      opacity: 1,
      rotateX: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 12,
        delay: i * 0.05,
      },
    }),
    hover: {
      scale: 1.05,
<<<<<<< HEAD
      color: "#1E40AF", // blue-800
      transition: { duration: 0.2 },
    },
=======
      color: "#1E40AF",
      transition: { duration: 0.2 }
    }
>>>>>>> 0f26c1f15b7b866c47f8aaa12748d29338d2391e
  };

  return (
    <motion.section
      className="py-12 bg-gray-50"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
    >
      <div className="max-w-6xl mx-auto text-center px-4">
        <motion.h2
          className="uppercase text-purple-800 text-lg md:text-lg tracking-wide mb-8"
          variants={headerVariants}
        >
          All hotels rooms come with:
        </motion.h2>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 xl:gap-4 2xl:gap-3">
          {features.map((feature, index) => (
            <motion.span
              key={index}
              custom={index}
              variants={featureVariants}
              whileHover="hover"
              className="text-base md:text-lg lg:text-3xl xl:text-3xl 2xl:text-4xl text-gray-800 font-serif xl:px-3 2xl:px-3.5 inline-block perspective-[1000px] origin-bottom transform-gpu"
              style={{ transformStyle: "preserve-3d" }}
            >
              {feature}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default RoomIncluded;
