import { FC, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Area } from "../../types/AreaClient";
import { MemoizedImage } from "../../memo/MemoizedImage";

interface ViewAreaModalProps {
    isOpen: boolean;
    onClose: () => void;
    areaData: Area | null;
}

const ViewAreaModal: FC<ViewAreaModalProps> = ({ isOpen, onClose, areaData }) => {
    const areaImage = useMemo(() => {
        if (!areaData) return { src: "", alt: "" };
        return {
            src: areaData.area_image,
            alt: areaData.area_name,
        };
    }, [areaData]);

    if (!areaData) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative max-h-[90vh] overflow-hidden"
                        initial={{ scale: 0.9, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 50, opacity: 0 }}
                        transition={{
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8,
                        }}
                    >
                        {/* Close button - positioned on top right */}
                        <motion.button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 bg-white/80 hover:bg-white text-gray-700 hover:text-red-600 rounded-full p-2 transition-all duration-200 shadow-md cursor-pointer"
                            whileTap={{ scale: 0.8 }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </motion.button>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            {/* Left Column: Image with gradient overlay */}
                            <div className="relative h-64 md:h-auto">
                                <div className="relative h-full">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="h-full"
                                    >
                                        <MemoizedImage
                                            src={areaImage.src}
                                            alt={areaImage.alt}
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                    <div className="absolute bottom-4 left-4 z-20 md:hidden">
                                        <motion.h1
                                            className="text-2xl font-bold text-white mb-1"
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            {areaData.area_name}
                                        </motion.h1>
                                        <motion.div
                                            className="flex items-center"
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${areaData.status === "available"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-amber-100 text-amber-800"
                                                    }`}
                                            >
                                                {areaData.status === "available"
                                                    ? "AVAILABLE"
                                                    : "MAINTENANCE"}
                                            </span>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Area Information */}
                            <div className="p-6 flex flex-col">
                                <motion.div
                                    className="hidden md:block mb-4"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {areaData.area_name}
                                    </h1>
                                    <div className="flex items-center mt-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${areaData.status === "available"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-amber-100 text-amber-800"
                                                }`}
                                        >
                                            {areaData.status === "available"
                                                ? "AVAILABLE"
                                                : "MAINTENANCE"}
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Description with a nice background */}
                                <motion.div
                                    className="bg-gray-50 p-4 rounded-lg mb-5 shadow-inner"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h3 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-2">
                                        Description
                                    </h3>
                                    <p className="text-gray-700">
                                        {areaData.description || "No description available."}
                                    </p>
                                </motion.div>

                                {/* Details in a grid */}
                                <motion.div
                                    className="grid grid-cols-2 gap-4 mb-6"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <span className="block text-gray-500 text-sm">
                                            Maximum No. of Guests
                                        </span>
                                        <div className="flex items-center mt-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-blue-600 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            </svg>
                                            <span className="text-xl font-bold text-gray-800">
                                                {areaData.capacity}{" "}
                                                <span className="text-sm font-normal text-gray-600">
                                                    people
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <span className="block text-gray-500 text-sm">Price</span>
                                        <div className="flex items-center mt-1">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 text-green-600 mr-1"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <span className="text-xl font-bold text-gray-800">
                                                {areaData.price_per_hour.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Booking Info */}
                                <motion.div
                                    className="bg-indigo-50 p-4 rounded-lg mb-5"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <h3 className="text-sm uppercase tracking-wider text-indigo-500 font-medium mb-2">
                                        Booking Information
                                    </h3>
                                    <p className="text-gray-700 text-sm">
                                        This venue is available for fixed hours (8:00 AM - 5:00 PM)
                                        and can be booked for
                                        <span className="font-medium">
                                            {" "}
                                            {areaData.price_per_hour.toLocaleString()}
                                        </span>{" "}
                                        per booking.
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ViewAreaModal;