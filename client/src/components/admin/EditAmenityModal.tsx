/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useState, useEffect, FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IAmenity, IEditAmenityModalProps } from "../../types/AmenityAdmin";

const EditAmenityModal: FC<IEditAmenityModalProps> = ({ isOpen, amenityData, onSave, cancel, loading = false }) => {
  const [formState, setFormState] = useState<IAmenity>({
    id: 0,
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (amenityData) {
      setFormState({
        id: amenityData.id,
        description: amenityData.description,
      });
    } else {
      setFormState({ id: 0, description: "" });
    }
  }, [amenityData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formState);
      setErrors({});
    } catch (error: any) {
      setErrors(error.response?.data?.error || {});
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="amenityModal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto"
        >
          <motion.div
            key="amenityModalContent"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            transition={{ duration: 0.3 }}
            className="bg-white w-full max-w-md mx-2 my-10 rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              {amenityData ? "Edit Amenity" : "Add Amenity"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <input 
                  type="text" 
                  name="description" 
                  id="description" 
                  value={formState.description}
                  onChange={(e) => 
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {errors["description"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["description"]}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cancel}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 uppercase font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 uppercase font-semibold"
                >
                  {amenityData ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditAmenityModal;
