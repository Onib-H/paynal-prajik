/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import EditAmenityModal from "../../components/admin/EditAmenityModal";
import { IAmenity } from "../../types/AmenityAdmin";
import Modal from "../../components/Modal";
import ManageRoomLoader from "../../motions/loaders/EventLoader";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import { createAmenity, deleteAmenity, fetchAmenities, updateAmenity } from "../../services/Admin";
import Error from "../_ErrorBoundary";
import { Amenity, PaginatedAmenities, AddAmenityResponse } from "../../types/AmenityClient";

const ManageAmenities = () => {
  const [search, setSearch] = useState<string>("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<IAmenity | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAmenityId, setDeleteAmenityId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState("");
  const [pageTransition, setPageTransition] = useState<"next" | "prev" | null>(null);

  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  const queryClient = useQueryClient();

  const {
    data: amenitiesResponse,
    isLoading,
    isError,
  } = useQuery<PaginatedAmenities, Error>({
    queryKey: ["amenities", page, pageSize],
    queryFn: fetchAmenities,
  });

  const createAmenityMutation = useMutation<
    AddAmenityResponse,
    unknown,
    { description: string }
  >({
    mutationFn: createAmenity,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Creating amenity...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      setShowFormModal(false);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const updateAmenityMutation = useMutation<
    AddAmenityResponse,
    unknown,
    { amenityId: number; payload: { description: string } }
  >({
    mutationFn: ({ amenityId, payload }) => updateAmenity(amenityId, payload),
    onMutate: () => {
      setLoading(true);
      setLoaderText("Updating amenity...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      setShowFormModal(false);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const deleteAmenityMutation = useMutation<any, unknown, number>({
    mutationFn: deleteAmenity,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Deleting amenity...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      setShowDeleteModal(false);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <Error />;

  const amenities: Amenity[] = amenitiesResponse?.data || [];

  const filteredAmenities = amenities.filter((amenity: Amenity) => {
    const matchesSearch = amenity.description
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleAddAmenity = () => {
    setSelectedAmenity(null);
    setShowFormModal(true);
  };

  const handleEditAmenity = (amenity: IAmenity) => {
    setSelectedAmenity(amenity);
    setShowFormModal(true);
  };

  const handleDeleteAmenity = (amenityId: number) => {
    setDeleteAmenityId(amenityId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAmenity = () => {
    if (deleteAmenityId !== null) {
      deleteAmenityMutation.mutate(deleteAmenityId);
    }
  };

  const cancelDeleteAmenity = () => {
    setDeleteAmenityId(null);
    setShowDeleteModal(false);
  };

  const handleSaveAmenity = async (amenity: IAmenity) => {
    const payload = { description: amenity.description };
    if (amenity.id === 0) {
      await createAmenityMutation.mutateAsync(payload);
    } else {
      await updateAmenityMutation.mutateAsync({
        amenityId: amenity.id,
        payload,
      });
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPageTransition("prev");
      setPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleNextPage = () => {
    if (amenitiesResponse && page < amenitiesResponse.pages) {
      setPageTransition("next");
      setPage((prev) => (prev < amenitiesResponse.pages ? prev + 1 : prev));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const pageVariants = {
    enter: (direction: "next" | "prev" | null) => ({
      x: direction === "next" ? 50 : direction === "prev" ? -50 : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    exit: (direction: "next" | "prev" | null) => ({
      x: direction === "next" ? -50 : direction === "prev" ? 50 : 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    }),
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="overflow-y-auto h-[calc(100vh-25px)] bg-gray-50"
    >
      <div className="p-3 container mx-auto">
        {/* Loader Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-[500] backdrop-blur-sm"
            >
              <ManageRoomLoader text={loaderText} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          variants={fadeIn}
          className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
        >
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-3xl font-bold text-gray-800"
          >
            Manage Amenities
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddAmenity}
            className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer font-semibold py-2.5 px-5 rounded-lg shadow-md transition-colors duration-300 flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Add Amenity</span>
          </motion.button>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div variants={fadeIn} className="mb-8">
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-gray-500">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search amenities..."
              className="p-3.5 ps-10 ring-1 ring-gray-300 rounded-lg w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Grid of Amenity Cards */}
        <AnimatePresence mode="wait" custom={pageTransition}>
          <motion.div
            key={page}
            custom={pageTransition}
            initial="enter"
            animate="center"
            exit="exit"
            variants={pageVariants}
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {filteredAmenities.map((amenity: Amenity) => (
                <motion.div
                  key={amenity.id}
                  variants={itemVariants}
                  layout
                  className="bg-white shadow-md hover:shadow-lg rounded-xl border border-gray-100 transition-all duration-300"
                >
                  <div className="p-5 flex flex-col space-y-3">
                    {/* Display description as main text */}
                    <p className="text-gray-700 text-lg font-semibold">
                      {amenity.description}
                    </p>
                    {/* Action Buttons */}
                    <div className="flex items-center justify-end mt-3 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditAmenity(amenity)}
                        className="p-2.5 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors duration-300 flex items-center gap-2"
                      >
                        <Edit size={18} />
                        <span className="hidden sm:inline">Edit</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteAmenity(amenity.id)}
                        className="p-2.5 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 transition-colors duration-300 flex items-center gap-2"
                      >
                        <Trash2 size={18} />
                        <span className="hidden sm:inline">Delete</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Empty state */}
            {filteredAmenities.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-gray-500"
              >
                <svg
                  className="w-16 h-16 mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <p className="text-xl">No amenities found</p>
                <p className="text-sm mt-2">
                  Try adjusting your search or add new amenities
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination Controls */}
        {amenitiesResponse && filteredAmenities.length > 0 && (
          <motion.div
            variants={fadeIn}
            className="flex justify-center items-center mt-10 gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevPage}
              disabled={page === 1}
              className="px-5 py-2.5 cursor-pointer bg-white border border-gray-300 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </motion.button>

            <motion.div
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center gap-1"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              <motion.span
                key={`page-${page}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                Page {amenitiesResponse.page} of {amenitiesResponse.pages}
              </motion.span>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextPage}
              disabled={page >= amenitiesResponse.pages}
              className="px-5 py-2.5 cursor-pointer bg-white border border-gray-300 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200 shadow-sm"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </motion.button>
          </motion.div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showFormModal && (
            <EditAmenityModal
              isOpen={showFormModal}
              amenityData={selectedAmenity}
              onSave={handleSaveAmenity}
              cancel={() => setShowFormModal(false)}
              loading={
                createAmenityMutation.isPending ||
                updateAmenityMutation.isPending
              }
            />
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <Modal
              isOpen={showDeleteModal}
              icon="fas fa-trash"
              title="Delete Amenity"
              description="Are you sure you want to delete this amenity?"
              cancel={cancelDeleteAmenity}
              onConfirm={confirmDeleteAmenity}
              className="px-4 py-2 bg-red-600 text-white rounded-md uppercase font-bold hover:bg-red-700 transition-all duration-300"
              cancelText="No"
              confirmText="Delete Amenity"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ManageAmenities;
