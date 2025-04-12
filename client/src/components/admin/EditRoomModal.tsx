/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { fetchAmenities } from "../../services/Admin";
import { parsePriceValue } from "../../utils/formatters";

export interface IRoom {
    id: number;
    roomName: string;
    roomType: string;
    bedType: string;
    capacity: string;
    amenities: number[];
    roomPrice: number;
    roomImage: File | string;
    status: "Available" | "Maintenance";
    description: string;
}

interface IRoomFormModalProps {
    isOpen: boolean;
    cancel: () => void;
    onSave: (data: IRoom) => Promise<void>;
    roomData: IRoom | null;
    loading?: boolean;
}

const EditRoomModal: FC<IRoomFormModalProps> = ({
    isOpen,
    cancel,
    onSave,
    roomData,
    loading = false,
}) => {
    const [formState, setFormState] = useState<IRoom>({
        id: roomData?.id || 0,
        roomName: roomData?.roomName || "",
        roomType: roomData?.roomType || "premium",
        bedType: roomData?.bedType || "single",
        capacity: roomData?.capacity || "",
        amenities: roomData?.amenities || [],
        roomPrice: roomData?.roomPrice ? parsePriceValue(roomData.roomPrice) : 0,
        status: roomData?.status || "Available",
        description: roomData?.description || "",
        roomImage: roomData?.roomImage || "",
    });
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (roomData) {
            setFormState({
                id: roomData.id || 0,
                roomName: roomData.roomName || "",
                roomType: roomData.roomType || "premium",
                bedType: roomData.bedType || "single",
                capacity: roomData.capacity || "",
                amenities: roomData.amenities || [],
                roomPrice: roomData.roomPrice ? parsePriceValue(roomData.roomPrice) : 0,
                status: roomData.status || "Available",
                description: roomData.description || "",
                roomImage: roomData.roomImage || "",
            });
        }
    }, [roomData]);

    const {
        data: amenitiesData,
        isLoading: isLoadingAmenities,
        isError: isErrorAmenities,
    } = useQuery({
        queryKey: ["amenities", 1, 100],
        queryFn: fetchAmenities,
        enabled: isOpen,
    });

    const availableAmenities = amenitiesData?.data || [];

    const fieldMapping: Record<string, string> = {
        roomName: "room_name",
        roomType: "room_type",
        bedType: "bed_type",
        capacity: "capacity",
        amenities: "amenities",
        roomPrice: "room_price",
        status: "status",
        description: "description",
        roomImage: "room_image",
    };

    useEffect(() => {
        if (formState.roomImage instanceof File) {
            const objectUrl = URL.createObjectURL(formState.roomImage);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (typeof formState.roomImage === "string") {
            setPreviewUrl(formState.roomImage);
        } else {
            setPreviewUrl("");
        }
    }, [formState.roomImage]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleAmenityChange = (amenityId: number) => {
        setFormState((prev) => {
            const amenitySet = new Set(prev.amenities);
            if (amenitySet.has(amenityId)) {
                amenitySet.delete(amenityId);
            } else {
                amenitySet.add(amenityId);
            }
            return { ...prev, amenities: Array.from(amenitySet) };
        });
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFormState((prev) => ({ ...prev, roomImage: file }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSave(formState);
            setErrors({});
        } catch (error: any) {
            setErrors(error.response?.data?.error || {});
        }
    };

    useEffect(() => {
        const handleKeyDown = (evt: KeyboardEvent) => {
            if (evt.key === "Escape") cancel();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cancel, isOpen]);

    const formVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.07,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    const checkboxVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: (custom: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: 0.5 + (custom * 0.03),
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        })
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 overflow-y-auto p-4"
                    onClick={cancel}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white w-full max-w-4xl rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button - positioned on top right */}
                        <motion.button
                            onClick={cancel}
                            className="absolute top-4 right-4 z-50 bg-white/80 hover:bg-white text-gray-700 hover:text-red-600 rounded-full p-2 transition-all duration-200 shadow-md"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>

                        <motion.h2
                            className="text-2xl font-bold mb-6 text-gray-800"
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {roomData ? "Edit Room" : "Add New Room"}
                        </motion.h2>

                        <motion.form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                            variants={formVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* 2-column grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Room Name */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Room Name
                                        </label>
                                        <input
                                            type="text"
                                            name="roomName"
                                            value={formState.roomName}
                                            onChange={handleChange}
                                            placeholder="Enter Room Name"
                                            className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        />
                                        {errors[fieldMapping.roomName] && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors[fieldMapping.roomName]}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Room Type */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Room Type
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="roomType"
                                                value={formState.roomType}
                                                onChange={handleChange}
                                                className="appearance-none border border-gray-300 rounded-md w-full p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                                            >
                                                <option value="" disabled>Select Room Type</option>
                                                <option value="premium">Premium</option>
                                                <option value="suites">Suites</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        {errors[fieldMapping.roomType] && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors[fieldMapping.roomType]}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Bed Type */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Bed Type
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="bedType"
                                                value={formState.bedType}
                                                onChange={handleChange}
                                                className="appearance-none border border-gray-300 rounded-md w-full p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
                                            >
                                                <option value="" disabled>Select Bed Type</option>
                                                <option value="single">Single</option>
                                                <option value="twin">Twin</option>
                                                <option value="double">Double</option>
                                                <option value="queen">Queen</option>
                                                <option value="king">King</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        {errors["bed_type"] && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors["bed_type"]}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Capacity */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Capacity
                                        </label>
                                        <input
                                            type="text"
                                            name="capacity"
                                            value={formState.capacity}
                                            onChange={handleChange}
                                            placeholder="e.g., 2 Adults, 1 Child"
                                            className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        />
                                        {errors[fieldMapping.capacity] && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors[fieldMapping.capacity]}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Status (Only when editing) */}
                                    {roomData && (
                                        <motion.div variants={itemVariants}>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={formState.status}
                                                onChange={handleChange}
                                                className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                            >
                                                <option value="Available">Available</option>
                                                <option value="Maintenance">Maintenance</option>
                                            </select>
                                            {errors[fieldMapping.status] && (
                                                <motion.p
                                                    className="text-red-500 text-xs mt-1"
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {errors[fieldMapping.status]}
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Room Price */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Room Price (₱)
                                        </label>
                                        <input
                                            type="number"
                                            name="roomPrice"
                                            value={formState.roomPrice}
                                            onChange={handleChange}
                                            className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        />
                                        {errors[fieldMapping.roomPrice] && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors[fieldMapping.roomPrice]}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Description */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formState.description}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="Enter room description"
                                            className="border border-gray-300 rounded-md w-full p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                        />
                                        {errors[fieldMapping.description] && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors[fieldMapping.description]}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Room Image */}
                                    <motion.div variants={itemVariants}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Room Image
                                        </label>
                                        <div className="border border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-500 transition-colors duration-200">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                                id="room-image-upload"
                                            />
                                            <motion.label
                                                htmlFor="room-image-upload"
                                                className="cursor-pointer flex flex-col items-center justify-center"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm text-gray-500">Click to upload an image</span>
                                            </motion.label>
                                        </div>

                                        {previewUrl && (
                                            <motion.div
                                                className="mt-4 relative"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ type: "spring", damping: 20 }}
                                            >
                                                <img
                                                    loading="lazy"
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-48 object-cover border border-gray-200 rounded-md shadow-sm"
                                                />
                                                <motion.button
                                                    type="button"
                                                    onClick={() => setFormState(prev => ({ ...prev, roomImage: "" }))}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </motion.button>
                                            </motion.div>
                                        )}

                                        {errors[fieldMapping.roomImage] && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors[fieldMapping.roomImage]}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Amenities Section */}
                                    <motion.div variants={itemVariants} className="mt-4">
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            Amenities
                                        </label>
                                        <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                                            {isLoadingAmenities ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex justify-center p-4"
                                                >
                                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                                </motion.div>
                                            ) : isErrorAmenities ? (
                                                <p className="text-red-500">Failed to load amenities</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                                    {availableAmenities.map((amenity: any, index: number) => (
                                                        <motion.div
                                                            key={amenity.id}
                                                            className="flex items-center"
                                                            custom={index}
                                                            variants={checkboxVariants}
                                                        >
                                                            <motion.div
                                                                className="flex items-center space-x-2"
                                                                whileHover={{ scale: 1.02 }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    id={`amenity-${amenity.id}`}
                                                                    checked={formState.amenities.includes(amenity.id)}
                                                                    onChange={() => handleAmenityChange(amenity.id)}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                                                />
                                                                <label
                                                                    htmlFor={`amenity-${amenity.id}`}
                                                                    className="text-sm text-gray-700 cursor-pointer"
                                                                >
                                                                    {amenity.description}
                                                                </label>
                                                            </motion.div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {errors[fieldMapping.amenities] && (
                                            <motion.p
                                                className="text-red-500 text-xs mt-1"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {errors[fieldMapping.amenities]}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <motion.div
                                className="flex justify-end space-x-3 pt-6 border-t border-gray-100 mt-6"
                                variants={itemVariants}
                            >
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 font-medium ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    whileHover={loading ? {} : { scale: 1.05 }}
                                    whileTap={loading ? {} : { scale: 0.95 }}
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : roomData ? "Update Room" : "Create Room"}
                                </motion.button>
                            </motion.div>
                        </motion.form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditRoomModal;
