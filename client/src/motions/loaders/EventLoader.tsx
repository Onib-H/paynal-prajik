import { motion } from "framer-motion";
import { AlertCircle, BookOpen, Calendar, CheckCircle, LogOut } from "lucide-react";
import { FC, useEffect, useState } from "react";

interface LoaderProps {
  size?: string;
  text?: string;
  type?: "default" | "reserve" | "checkin" | "checkout" | "noshow";
}

const EventLoader: FC<LoaderProps> = ({
  size = "80px",
  text = "Processing...",
  type = "default"
}) => {
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; scale: number; speed: number }>>([]);

  useEffect(() => {
    const newParticles = Array(30).fill(0).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      scale: 0.5 + Math.random() * 1.5,
      speed: 0.5 + Math.random() * 2
    }));
    setParticles(newParticles);

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (1 - prev / 100) * 3;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const getColors = () => {
    switch (type) {
      case "reserve":
        return {
          primary: "#4f46e5",
          secondary: "#10b981",
          bgFrom: "from-indigo-600/20",
          bgTo: "to-emerald-500/20",
          accent: "bg-indigo-600",
          text: "text-indigo-600",
          icon: <BookOpen className="w-full h-full p-1.5 text-indigo-600" />
        };
      case "checkin":
        return {
          primary: "#3b82f6",
          secondary: "#60a5fa",
          bgFrom: "from-blue-600/20",
          bgTo: "to-blue-400/20",
          accent: "bg-blue-600",
          text: "text-blue-600",
          icon: <CheckCircle className="w-full h-full p-1.5 text-blue-600" />
        };
      case "checkout":
        return {
          primary: "#8b5cf6",
          secondary: "#a78bfa",
          bgFrom: "from-purple-600/20",
          bgTo: "to-purple-400/20",
          accent: "bg-purple-600",
          text: "text-purple-600",
          icon: <LogOut className="w-full h-full p-1.5 text-purple-600" />
        };
      case "noshow":
        return {
          primary: "#d97706",
          secondary: "#fbbf24",
          bgFrom: "from-amber-600/20",
          bgTo: "to-amber-400/20",
          accent: "bg-amber-600",
          text: "text-amber-600",
          icon: <AlertCircle className="w-full h-full p-1.5 text-amber-600" />
        };
      default:
        return {
          primary: "#4f46e5",
          secondary: "#6366f1",
          bgFrom: "from-indigo-600/20",
          bgTo: "to-indigo-400/20",
          accent: "bg-indigo-600",
          text: "text-indigo-600",
          icon: <Calendar className="w-full h-full p-1.5 text-indigo-600" />
        };
    }
  };

  const { primary, secondary, bgFrom, bgTo, accent, text: textColor, icon } = getColors();
  const displayedProgress = Math.floor(progress);

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  const iconVariants = {
    initial: { scale: 0.8, opacity: 0, rotate: -10 },
    animate: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.3
      }
    }
  };

  const pathLength = (2 * Math.PI * 40);
  const circleVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: progress / 100,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background overlay with blur */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Animated Gradient Background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${bgFrom} ${bgTo} opacity-30`}
        animate={{
          background: [
            `linear-gradient(135deg, ${primary}30 0%, ${secondary}20 100%)`,
            `linear-gradient(225deg, ${primary}20 0%, ${secondary}30 100%)`,
            `linear-gradient(315deg, ${primary}30 0%, ${secondary}20 100%)`
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, index) => (
          <motion.div
            key={index}
            className={`absolute rounded-full ${accent} opacity-20`}
            style={{
              width: `${particle.scale * 15}px`,
              height: `${particle.scale * 15}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [`${particle.y}%`, `${(particle.y - particle.speed * 20) % 100}%`],
              opacity: [0.1, 0.3, 0.1],
              scale: [particle.scale, particle.scale * 1.2, particle.scale]
            }}
            transition={{
              duration: 5 + particle.speed * 3,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <motion.div
        className="relative z-10 flex flex-col items-center max-w-md p-8"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Loader Circle */}
        <motion.div
          className="relative"
          style={{ width: size, height: size }}
          variants={itemVariants}
        >
          {/* Background Circle */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              strokeWidth="4"
              stroke="rgba(255,255,255,0.1)"
            />
          </svg>

          {/* Progress Circle */}
          <svg
            className="absolute inset-0 -rotate-90 w-full h-full"
            viewBox="0 0 100 100"
          >
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              strokeWidth="4"
              stroke={primary}
              strokeLinecap="round"
              variants={circleVariants}
              style={{
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength * (1 - progress / 100)
              }}
            />
          </svg>

          {/* Glowing Effect on Track */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                `0 0 15px 1px ${primary}30`,
                `0 0 20px 3px ${primary}50`,
                `0 0 15px 1px ${primary}30`
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "mirror"
            }}
          />

          {/* Center Icon Container */}
          <motion.div
            className="absolute inset-0 m-auto w-3/5 h-3/5 rounded-full bg-white/95 shadow-xl flex items-center justify-center"
            variants={iconVariants}
          >
            {icon}
          </motion.div>

          {/* Progress Percentage */}
          <motion.div
            className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${textColor} font-semibold text-lg bg-white/90 px-3 py-1 rounded-full shadow-md`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {displayedProgress}%
          </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          className="mt-10 text-center"
          variants={itemVariants}
        >
          <motion.h3
            className="text-white text-xl font-medium mb-2"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {text}
          </motion.h3>

          {/* Animated Dots */}
          <div className="flex space-x-2 justify-center">
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                className="w-2 h-2 rounded-full bg-white"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: dot * 0.3,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default EventLoader;
