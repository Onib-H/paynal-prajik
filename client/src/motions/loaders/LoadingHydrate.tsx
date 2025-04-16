import { motion } from "framer-motion";
import { FC, memo } from "react";

const LoadingHydrate: FC = () => {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px)`,
            backgroundSize: "30px 30px"
          }}
        />
      </div>

      {/* Content container */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-6 flex flex-col items-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hotel logo animation */}
        <div className="relative mb-12">
          <motion.div
            className="w-24 h-24 rounded-lg bg-white shadow-xl flex items-center justify-center overflow-hidden"
            animate={{
              boxShadow: [
                "0 10px 25px -5px rgba(79, 70, 229, 0.2)",
                "0 20px 25px -5px rgba(79, 70, 229, 0.3)",
                "0 10px 25px -5px rgba(79, 70, 229, 0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
          >
            {/* Hotel tower icon */}
            <motion.div
              className="relative"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            >
              <motion.div
                className="absolute top-2 left-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600 -translate-x-1/2"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
              />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.path
                  d="M19 21H5V8H19V21Z"
                  stroke="#4F46E5"
                  strokeWidth="1.5"
                  fill="rgba(79, 70, 229, 0.1)"
                  animate={{ fill: ["rgba(79, 70, 229, 0.1)", "rgba(79, 70, 229, 0.2)", "rgba(79, 70, 229, 0.1)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.path
                  d="M9 21V17H15V21"
                  stroke="#4F46E5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ strokeWidth: [1.5, 2, 1.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.path
                  d="M10 13H14"
                  stroke="#4F46E5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.path
                  d="M10 9H14"
                  stroke="#4F46E5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                />
                <motion.path
                  d="M12 8V3L4 8H20L12 8Z"
                  stroke="#4F46E5"
                  strokeWidth="1.5"
                  fill="rgba(79, 70, 229, 0.1)"
                  animate={{ fill: ["rgba(79, 70, 229, 0.1)", "rgba(79, 70, 229, 0.2)", "rgba(79, 70, 229, 0.1)"] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* Orbiting elements */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-indigo-600/10 flex items-center justify-center"
              style={{ top: "-5%", left: "50%" }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            </motion.div>

            <motion.div
              className="absolute w-5 h-5 rounded-full bg-purple-600/10 flex items-center justify-center"
              style={{ bottom: "-5%", left: "50%" }}
              animate={{
                rotate: [360, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            </motion.div>

            <motion.div
              className="absolute w-4 h-4 rounded-full bg-blue-600/10 flex items-center justify-center"
              style={{ left: "-5%", top: "50%" }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 9, repeat: Infinity, ease: "linear" },
                scale: { duration: 2.5, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            </motion.div>

            <motion.div
              className="absolute w-5 h-5 rounded-full bg-indigo-600/10 flex items-center justify-center"
              style={{ right: "-5%", top: "50%" }}
              animate={{
                rotate: [360, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 11, repeat: Infinity, ease: "linear" },
                scale: { duration: 3.5, repeat: Infinity, repeatType: "reverse" }
              }}
            >
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            </motion.div>
          </div>
        </div>

        <div className="w-full mb-8">
          <div className="flex justify-center text-lg text-gray-500 mb-1.5">
            <span>Loading system resources...</span>
          </div>
        </div>

        {/* Hotel Services icons */}
        <motion.div
          className="flex justify-center space-x-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Rooms */}
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: 0
            }}
          >
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2 shadow-md">
              <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H3V18H21V12H19M7 12V2H17V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M19 18V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">Rooms</span>
          </motion.div>

          {/* Reservations */}
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: 0.7
            }}
          >
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2 shadow-md">
              <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
                <path d="M9 14H7V16H9V14Z" fill="currentColor" />
                <path d="M9 14V16H7V14H9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">Bookings</span>
          </motion.div>

          {/* Services */}
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
              delay: 1.4
            }}
          >
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2 shadow-md">
              <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C12 4.10457 10 6.10457 10 6.10457C10 6.10457 8 4.10457 8 3C8 1.89543 8.89543 1 10 1C11.1046 1 12 1.89543 12 3Z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 13C12 11.8954 12.8954 11 14 11C15.1046 11 16 11.8954 16 13C16 14.1046 14 16.1046 14 16.1046C14 16.1046 12 14.1046 12 13Z" stroke="currentColor" strokeWidth="2" />
                <path d="M20 5C20 6.10457 18 8.10457 18 8.10457C18 8.10457 16 6.10457 16 5C16 3.89543 16.8954 3 18 3C19.1046 3 20 3.89543 20 5Z" stroke="currentColor" strokeWidth="2" />
                <path d="M4 15C4 13.8954 4.89543 13 6 13C7.10457 13 8 13.8954 8 15C8 16.1046 6 18.1046 6 18.1046C6 18.1046 4 16.1046 4 15Z" stroke="currentColor" strokeWidth="2" />
                <path d="M15 19L9 19C7.89543 19 7 19.8954 7 21L17 21C17 19.8954 16.1046 19 15 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">Services</span>
          </motion.div>
        </motion.div>

        {/* Floating elements in the background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-indigo-500/10"
              style={{
                width: `${3 + Math.random() * 10}px`,
                height: `${3 + Math.random() * 10}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                y: { duration: 3, repeat: Infinity },
                opacity: { duration: 3, repeat: Infinity },
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default memo(LoadingHydrate);