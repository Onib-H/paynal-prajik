/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion } from "framer-motion";
import { FC, useMemo } from "react";
import { MemoizedImage } from "../../memo/MemoizedImage";
import { Amenity } from "../../types/AmenityClient";
import { Room } from "../../types/RoomClient";
import { AmenityObject } from "../../types/BookingClient";
import { Bed } from "lucide-react";

interface RoomDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomData: Room | null;
    allAmenities: Amenity[];
}

const RoomDetailsModal: FC<RoomDetailsModalProps> = ({ isOpen, onClose, roomData }) => {
    const isAmenityObject = (amenity: any): amenity is AmenityObject => {
        return amenity && typeof amenity === 'object' && 'description' in amenity;
    }

    const roomImage = useMemo(() => ({
        src: roomData.room_image,
        alt: roomData.room_name || roomData.room_image,
    }), [roomData.room_image, roomData.room_name]);

    if (!roomData) return null;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[90vh]">
                            <div className="relative h-64 md:h-full">
                                {roomData.room_image ? (
                                    <div className="relative h-full">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="h-full"
                                        >
                                            <MemoizedImage
                                                src={roomImage.src}
                                                alt={roomImage.alt}
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
                                                {roomData.room_name}
                                            </motion.h1>
                                            <motion.div
                                                className="flex items-center"
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${roomData.status === "available"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-amber-100 text-amber-800"
                                                        }`}
                                                >
                                                    {roomData.status === "available"
                                                        ? "AVAILABLE"
                                                        : "MAINTENANCE"}
                                                </span>
                                            </motion.div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                                        <motion.svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-20 w-20 opacity-50"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.5 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </motion.svg>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Room Information - SCROLLABLE */}
                            <div className="overflow-y-auto" style={{ maxHeight: "90vh" }}>
                                <div className="p-6 flex flex-col">
                                    <motion.div
                                        className="hidden md:block mb-4"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <h1 className="text-3xl font-bold text-gray-900">
                                            {roomData.room_name}
                                        </h1>
                                        <div className="flex items-center mt-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${roomData.status === "available"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-amber-100 text-amber-800"
                                                    }`}
                                            >
                                                {roomData.status === "available"
                                                    ? "AVAILABLE"
                                                    : "MAINTENANCE"}
                                            </span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-gray-50 p-4 rounded-lg mb-5 shadow-inner border border-gray-400"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <h3 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-2">
                                            Description
                                        </h3>
                                        <p className="text-gray-700">
                                            {roomData.description || "No description available."}
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        className="grid grid-cols-2 gap-4 mb-6"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-300">
                                            <span className="block text-amber-600 text-sm uppercase">
                                                Room Type
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
                                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                                    />
                                                </svg>
                                                <span className="text-lg capitalize font-bold text-gray-800">
                                                    {roomData.room_type}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 p-3 rounded-lg border border-green-400">
                                            <span className="block text-amber-600 text-sm uppercase">
                                                Max Guests
                                            </span>
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
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                    />
                                                </svg>
                                                <span className="text-lg font-bold text-gray-800">
                                                    {roomData.max_guests} guests
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Bed Type */}
                                    <motion.div className="grid grid-cols-2 gap-4 mb-2">
                                        <motion.div
                                            className="bg-amber-50 p-4 rounded-lg mb-5 border border-amber-400"
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.45 }}
                                        >
                                            <h3 className="text-sm uppercase tracking-wider text-amber-600 font-medium mb-2">
                                                Bed Type
                                            </h3>
                                            <div className="flex items-center">
                                                <Bed className="h-5 w-5 text-amber-600 mr-2" />
                                                <span className="text-lg font-bold text-gray-800 capitalize">
                                                    {roomData.bed_type}
                                                </span>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="bg-amber-50 p-4 rounded-lg mb-5 border border-amber-400"
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <h3 className="text-sm uppercase tracking-wider text-amber-600 font-medium mb-2">
                                                Pricing
                                            </h3>
                                            <div className="flex items-center">
                                                <span className="text-2xl font-bold text-gray-800">
                                                    {typeof roomData.room_price === "string" &&
                                                        roomData.room_price.trim() !== ""
                                                        ? roomData.room_price
                                                        : typeof roomData.room_price === "number"
                                                            ? `₱${roomData.room_price.toLocaleString()}`
                                                            : "₱0"}
                                                </span>
                                            </div>
                                        </motion.div>
                                    </motion.div>

                                    {/* Amenities Section */}
                                    <motion.div
                                        className="bg-indigo-50 p-4 rounded-lg mb-5"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <h3 className="text-sm uppercase tracking-wider text-indigo-500 font-medium mb-2">
                                            Amenities
                                        </h3>
                                        {roomData.amenities.length === 0 ? (
                                            <p className="text-gray-500 italic">
                                                No amenities available for this room
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-1">
                                                {roomData.amenities.map((amenityId, index) => (
                                                    <motion.div
                                                        key={amenityId.id}
                                                        className="flex items-center py-1"
                                                        initial={{ x: -10, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        transition={{
                                                            delay: 0.5 + index * 0.05,
                                                            type: "spring",
                                                            stiffness: 100,
                                                        }}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4 text-indigo-600 mr-2"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                        <span className="text-gray-700">
                                                            {isAmenityObject(amenityId) ? amenityId.description : String(amenityId)}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RoomDetailsModal;