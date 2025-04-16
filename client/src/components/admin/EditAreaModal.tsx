/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { parsePriceValue } from "../../utils/formatters";

export interface IArea {
  id: number;
  area_name: string;
  description: string;
  capacity: number;
  price_per_hour: number;
  status: "available" | "maintenance";
  area_image: File | string;
}

interface IAreaFormModalProps {
  isOpen: boolean;
  cancel: () => void;
  onSave: (data: IArea) => Promise<void>;
  areaData: IArea | null;
  loading?: boolean;
}

const EditAreaModal: FC<IAreaFormModalProps> = ({
  onSave,
  areaData,
  isOpen,
  cancel,
  loading = false,
}) => {
  const [formState, setFormState] = useState<IArea>({
    id: areaData?.id || 0,
    area_name: areaData?.area_name || "",
    description: areaData?.description || "",
    capacity: areaData?.capacity || 0,
    price_per_hour: areaData?.price_per_hour ? parsePriceValue(areaData.price_per_hour) : 0,
    status: areaData?.status || "available",
    area_image: areaData?.area_image || "",
  });

  // State for preview URL and errors
  const [previewUrl, setPreviewUrl] = useState<string | null>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const fieldMapping: { [key: string]: string } = {
    area_name: "area_name",
    description: "description",
    capacity: "capacity",
    price_per_hour: "price_per_hour",
    status: "status",
  };

  useEffect(() => {
    if (areaData) {
      setFormState({
        id: areaData.id || 0,
        area_name: areaData.area_name || "",
        description: areaData.description || "",
        capacity: areaData.capacity || 0,
        price_per_hour: areaData.price_per_hour ? parsePriceValue(areaData.price_per_hour) : 0,
        status: areaData.status || "available",
        area_image: areaData.area_image || "",
      });
    }
  }, [areaData]);

  useEffect(() => {
    if (formState.area_image instanceof File) {
      const objectUrl = URL.createObjectURL(formState.area_image);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (typeof formState.area_image === "string" && formState.area_image !== "") {
      if (formState.area_image.startsWith("http")) {
        setPreviewUrl(formState.area_image);
      } else {
        setPreviewUrl(`https://res.cloudinary.com/dxxzqzq0y/image/upload/${formState.area_image}`);
      }
    } else {
      setPreviewUrl("");
    }
  }, [formState.area_image]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormState((prev) => ({ ...prev, area_image: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!areaData?.id) {
        setFormState(prev => ({ ...prev, status: "available" }));
        await onSave({ ...formState, status: "available" });
      } else {
        await onSave(formState);
      }
      setErrors({});
    } catch (error: any) {
      setErrors(error.response?.data?.error || {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel();
      }
    };

    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancel, isOpen]);

  // Animation variants for staggered children
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
            className="bg-white w-full max-w-3xl rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
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
              {areaData ? "Edit Area" : "Add New Area"}
            </motion.h2>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Area Name */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Area Name
                    </label>
                    <input
                      type="text"
                      name="area_name"
                      value={formState.area_name}
                      onChange={handleChange}
                      placeholder="Enter Area Name"
                      className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                    {errors[fieldMapping.name] && (
                      <motion.p
                        className="text-red-500 text-xs mt-1"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors[fieldMapping.name]}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Grid layout for Capacity and Price */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Capacity */}
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Maximum No. of Guests
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        value={formState.capacity}
                        onChange={handleChange}
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

                    {/* Price Per Hour */}
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Price (₱)
                      </label>
                      <input
                        type="number"
                        name="price_per_hour"
                        value={formState.price_per_hour}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      />
                      {errors[fieldMapping.price_per_hour] && (
                        <motion.p
                          className="text-red-500 text-xs mt-1"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors[fieldMapping.price_per_hour]}
                        </motion.p>
                      )}
                    </motion.div>
                  </div>

                  {/* Status - Only show for editing existing areas */}
                  {areaData?.id ? (
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
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
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
                  ) : null}

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
                      placeholder="Enter description"
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
                  {/* Area Image */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Area Image
                    </label>
                    <div className="border border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-500 transition-colors duration-200">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="area-image-upload"
                      />
                      <motion.label
                        htmlFor="area-image-upload"
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
                        <button
                          type="button"
                          onClick={() => setFormState(prev => ({ ...prev, area_image: "" }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </motion.div>
                    )}

                    {errors["area_image"] && (
                      <motion.p
                        className="text-red-500 text-xs mt-1"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors["area_image"]}
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
                  ) : areaData ? "Update Area" : "Create Area"}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditAreaModal;
