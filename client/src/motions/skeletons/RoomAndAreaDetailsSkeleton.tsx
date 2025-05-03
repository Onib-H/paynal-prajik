import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { motion } from "framer-motion";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            delayChildren: 0.3,
            staggerChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 80,
            damping: 15
        }
    }
};

const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 60,
            damping: 20,
            duration: 0.6
        }
    }
};

const RoomAndAreaDetailsSkeleton = () => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
        >
            {/* Hero Banner Skeleton */}
            <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
                <motion.div
                    variants={imageVariants}
                    className="absolute inset-0 bg-gray-200"
                >
                    <Skeleton className="h-full w-full" />
                </motion.div>
            </div>

            {/* Content Section */}
            <motion.div
                variants={containerVariants}
                className="container mx-auto py-12 px-4 sm:px-6 relative z-10 -mt-20"
            >
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Left Column */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2 space-y-8"
                    >
                        {/* Main Card Skeleton */}
                        <motion.div variants={itemVariants} className="bg-white rounded-xl p-8 shadow-xl">
                            <Skeleton className="h-8 w-1/3 mb-6" />
                            <Skeleton className="h-4 w-full mb-4" count={4} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <Skeleton className="h-16 rounded-lg" count={2} />
                            </div>
                        </motion.div>

                        {/* Amenities/Features Skeleton */}
                        <motion.div variants={itemVariants} className="bg-white rounded-xl p-8 shadow-lg">
                            <Skeleton className="h-8 w-1/3 mb-6" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-6" count={6} />
                            </div>
                        </motion.div>

                        {/* Reviews Skeleton */}
                        <motion.div variants={itemVariants} className="bg-white rounded-xl p-8 shadow-lg">
                            <Skeleton className="h-8 w-1/3 mb-6" />
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="mb-6">
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right Column */}
                    <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                        {/* Image Skeleton */}
                        <motion.div variants={imageVariants} className="bg-white p-4 rounded-xl shadow-lg">
                            <Skeleton className="h-64 w-full rounded-lg" />
                        </motion.div>

                        {/* Booking Card Skeleton */}
                        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg p-6">
                            <Skeleton className="h-12 w-full mb-6 rounded-lg" />
                            <div className="space-y-4 mb-6">
                                <Skeleton className="h-16 rounded-lg" count={2} />
                            </div>
                            <Skeleton className="h-14 w-full rounded-lg" />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default RoomAndAreaDetailsSkeleton;