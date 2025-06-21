/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { Edit, Eye, Trash2 } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { Room } from "../types/RoomClient";
import { MemoizedImage } from "./MemoizedImage";

export const RoomCard = memo(
    ({
        room,
        index,
        onView,
        onEdit,
        onDelete,
    }: {
        room: Room;
        index: number;
        onView: (room: Room) => void;
        onEdit: (room: Room) => void;
        onDelete: (id: number) => void;
    }) => {
        // Show the first image from room.images if available, else fallback to room.room_image
        const firstImage =
            Array.isArray((room as any).images) && (room as any).images.length > 0
                ? (room as any).images[0].room_image
                : room.room_image;
        const roomImageProps = useMemo(
            () => ({
                src: firstImage,
                alt: room.room_name,
            }),
            [firstImage, room.room_name]
        );
        const handleView = useCallback(() => onView(room), [room, onView]);
        const handleEdit = useCallback(() => onEdit(room), [room, onEdit]);
        const handleDelete = useCallback(() => onDelete(room.id), [room.id, onDelete]);

        if (!room) return null;

        return (
            <motion.div
                className="bg-white shadow-md rounded-lg flex flex-col h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    type: "spring",
                    damping: 12,
                }}
                whileHover={{
                    y: -5,
                    boxShadow:
                        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
            >
                <div className="relative">
                    <MemoizedImage
                        src={roomImageProps.src}
                        alt={roomImageProps.alt}
                        className="w-full h-40 object-cover"
                    />
                    {room.discount_percent > 0 && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-base font-extrabold px-4 py-2 rounded-full shadow-lg z-10 border-4 border-white drop-shadow-lg tracking-wide uppercase">
                            -{room.discount_percent}% OFF
                        </span>
                    )}
                </div>
                <div className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {room.room_name}
                        </h2>
                        <span
                            className={`text-md font-semibold ${room.status === "available"
                                ? "text-green-600"
                                : "text-amber-600"
                                } uppercase`}
                        >
                            {room.status === "available" ? "AVAILABLE" : "MAINTENANCE"}
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1 flex items-center">
                        <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs uppercase font-semibold mr-2 ${room.room_type === "premium"
                                ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                                : "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20"
                                }`}
                        >
                            {room.room_type === "premium" ? "Premium" : "Suites"}
                        </span>
                        <span className="flex items-center">
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs uppercase font-semibold mr-2 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                {room.bed_type}
                            </span>
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold mr-2 bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                Max Guests: {room.max_guests}
                            </span>
                        </span>
                    </p>
                    {/* Limit the description to 2 lines */}
                    <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                        {room.description || "No description provided."}
                    </p>

                    <div className="mt-auto flex justify-between items-center">
                        <div className="flex flex-col">
                            {room.discount_percent > 0 ? (
                                <>
                                    <span className="text-sm font-bold text-gray-500 line-through">{room.room_price}</span>
                                    <span className="text-xl font-bold text-green-600">
                                        {room.discounted_price}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xl font-bold text-gray-900">
                                    {room.room_price}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <motion.button
                                onClick={handleView}
                                className="px-3 py-2 uppercase font-semibold bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-700 transition-colors duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Eye />
                            </motion.button>
                            <motion.button
                                onClick={handleEdit}
                                className="px-3 py-2 uppercase font-semibold bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Edit />
                            </motion.button>
                            <motion.button
                                onClick={handleDelete}
                                className="px-3 py-2 uppercase font-semibold bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Trash2 />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }
);

RoomCard.displayName = "RoomCard";