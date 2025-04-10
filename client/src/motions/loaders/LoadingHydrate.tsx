import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";

const LoadingHydrate: FC = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Preparing your luxury experience");

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prevProgress + (1.5 - prevProgress / 100);
      });
    }, 40);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const messages = [
      "Preparing your luxury experience",
      "Setting up your perfect stay",
      "Arranging your accommodations",
      "Polishing the details",
      "Rolling out the red carpet"
    ];

    const textTimer = setInterval(() => {
      setLoadingText(messages[Math.floor(Math.random() * messages.length)]);
    }, 2500);

    return () => clearInterval(textTimer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 80, damping: 12 }
    }
  };

  const keyElements = [
    { rotation: 0, delay: 0 },
    { rotation: 120, delay: 0.4 },
    { rotation: 240, delay: 0.8 }
  ];

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Gold shimmer overlay */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            "radial-gradient(circle at 30% 40%, #f59e0b 0%, transparent 70%)",
            "radial-gradient(circle at 70% 60%, #f59e0b 0%, transparent 70%)",
            "radial-gradient(circle at 40% 50%, #f59e0b 0%, transparent 70%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }}
      />

      {/* Hotel Logo Animation */}
      <motion.div
        className="relative mb-16"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 20,
          delay: 0.2
        }}
      >
        <div className="relative">
          {/* Outer glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-500/20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />

          {/* Main logo container */}
          <motion.div
            className="relative z-10 w-28 h-28 flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)]"
            animate={{
              boxShadow: [
                "0 0 30px rgba(245,158,11,0.2)",
                "0 0 40px rgba(245,158,11,0.4)",
                "0 0 30px rgba(245,158,11,0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <div className="relative w-16 h-16">
              {/* Hotel key animation */}
              {keyElements.map((el, index) => (
                <motion.div
                  key={index}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ rotate: el.rotation }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: el.delay, duration: 0.5 }}
                >
                  <motion.div
                    className="absolute w-3 h-10 bg-amber-600 rounded-full left-1/2 -ml-1.5"
                    animate={{
                      backgroundColor: ["#d97706", "#f59e0b", "#d97706"],
                      y: [0, -2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: index * 0.4
                    }}
                  />
                  <motion.div
                    className="absolute w-5 h-5 bg-amber-600 rounded-full bottom-0 left-1/2 -ml-2.5"
                    animate={{
                      backgroundColor: ["#d97706", "#f59e0b", "#d97706"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: index * 0.4
                    }}
                  />
                </motion.div>
              ))}

              {/* Center circle */}
              <motion.div
                className="absolute rounded-full bg-amber-600 w-6 h-6 top-1/2 left-1/2 -ml-3 -mt-3"
                animate={{
                  backgroundColor: ["#d97706", "#f59e0b", "#d97706"],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="w-full max-w-md mb-8 bg-slate-700/60 rounded-full h-2 overflow-hidden backdrop-blur-sm"
        variants={itemVariants}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      {/* Loading text */}
      <motion.div
        className="text-center mb-8"
        variants={itemVariants}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={loadingText}
            className="text-xl font-medium text-amber-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {loadingText}
          </motion.p>
        </AnimatePresence>

        <motion.p
          className="mt-2 text-amber-400/80 text-sm"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {Math.floor(progress)}% complete
        </motion.p>
      </motion.div>

      {/* Amenity icons */}
      <motion.div
        className="flex justify-center space-x-10 mb-10"
        variants={itemVariants}
      >
        {/* Bed icon */}
        <motion.div
          className="flex flex-col items-center"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0 }}
        >
          <div className="w-12 h-12 rounded-full bg-slate-700/40 backdrop-blur-sm flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 19V14M3 14V8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V14M3 14H21M21 14V19M6 9H8M16 9H18M7 14V13C7 11.8954 7.89543 11 9 11H15C16.1046 11 17 11.8954 17 13V14H7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs text-amber-100/80">Rooms</span>
        </motion.div>

        {/* Service icon */}
        <motion.div
          className="flex flex-col items-center"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.3 }}
        >
          <div className="w-12 h-12 rounded-full bg-slate-700/40 backdrop-blur-sm flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L11.1815 3.80542C10.4521 5.41891 9.58743 6.92134 8.58335 8.28918L2 18H8M12 2L12.8185 3.80542C13.5479 5.41891 14.4126 6.92134 15.4167 8.28918L22 18H16M12 2V6M8 18C8 20.2091 9.79086 22 12 22C14.2091 22 16 20.2091 16 18M8 18H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xs text-amber-100/80">Service</span>
        </motion.div>

        {/* Keys icon */}
        <motion.div
          className="flex flex-col items-center"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.6 }}
        >
          <div className="w-12 h-12 rounded-full bg-slate-700/40 backdrop-blur-sm flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 7C16.1046 7 17 7.89543 17 9M21 9C21 12.3137 18.3137 15 15 15C14.3938 15 13.8087 14.9101 13.2571 14.7429L11 17H9V19H7V21H4C3.44772 21 3 20.5523 3 20V17.4142C3 17.149 3.10536 16.8946 3.29289 16.7071L9.25707 10.7429C9.08989 10.1914 9 9.60617 9 9C9 5.68629 11.6863 3 15 3C18.3137 3 21 5.68629 21 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xs text-amber-100/80">Check-in</span>
        </motion.div>
      </motion.div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Stars/glitter effect */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-400"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
              repeatDelay: Math.random() * 8
            }}
          />
        ))}

        {/* Subtle hotel elements */}
        {[...Array(5)].map((_, i) => {
          const icons = [
            // Suitcase
            <svg key="suitcase" className="w-full h-full text-amber-200/20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" />
              <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" />
              <path d="M12 12V16" stroke="#7c611e" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 12V16" stroke="#7c611e" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 12V16" stroke="#7c611e" strokeWidth="2" strokeLinecap="round" />
            </svg>,
            // Door
            <svg key="door" className="w-full h-full text-amber-200/20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21H21M6 21V4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V21" />
              <circle cx="15" cy="12" r="1" fill="#7c611e" />
            </svg>,
            // Bell
            <svg key="bell" className="w-full h-full text-amber-200/20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4C9.79086 4 8 5.79086 8 8V13L4.52786 16.4721C4.19071 16.8093 4 17.265 4 17.7408V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V17.7408C20 17.265 19.8093 16.8093 19.4721 16.4721L16 13V8C16 5.79086 14.2091 4 12 4Z" />
              <path d="M10 20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20" stroke="#7c611e" strokeWidth="2" />
            </svg>
          ];

          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: `${30 + Math.random() * 40}px`,
                height: `${30 + Math.random() * 40}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                rotate: `${Math.random() * 360}deg`
              }}
              initial={{
                opacity: 0.1,
                scale: 0.8
              }}
              animate={{
                opacity: [0.1, 0.15, 0.1],
                scale: [0.8, 1, 0.8],
                rotate: `${Math.random() > 0.5 ? 360 : -360}deg`
              }}
              transition={{
                duration: 15 + Math.random() * 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {icons[i % icons.length]}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LoadingHydrate;