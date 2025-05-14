/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import EditAmenityModal from "../../components/admin/EditAmenityModal";
import { IAmenity } from "../../types/AmenityAdmin";
import Modal from "../../components/Modal";
import ManageRoomLoader from "../../motions/loaders/EventLoader";
import { createAmenity, deleteAmenity, fetchAmenities, updateAmenity } from "../../services/Admin";
import Error from "../_ErrorBoundary";
import { Amenity, PaginatedAmenities, AddAmenityResponse } from "../../types/AmenityClient";
import ManageAmenitiesSkeleton from "../../motions/skeletons/ManageAmenitiesSkeleton";

const ManageAmenities = () => {
  const [search, setSearch] = useState<string>("");
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [selectedAmenity, setSelectedAmenity] = useState<IAmenity | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteAmenityId, setDeleteAmenityId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loaderText, setLoaderText] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const pageSize = 8;

  const queryClient = useQueryClient();

  const { data: amenitiesResponse, isLoading, isError } = useQuery<PaginatedAmenities, Error>({
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
    if (page > 1) setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (amenitiesResponse && page < amenitiesResponse.pages) {
      setPage((prev) => (prev < amenitiesResponse.pages ? prev + 1 : prev));
    }
  };

  if (isLoading) return <ManageAmenitiesSkeleton />;
  if (isError) return <Error />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-2 container mx-auto p-3"
    >
      <h1 className="text-3xl font-bold text-gray-800">Manage Amenities</h1>

      {/* Search and Add Button */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search amenities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAddAmenity}
          className="bg-purple-600 hover:bg-purple-700 cursor-pointer text-white px-4 py-1 uppercase rounded-full font-semibold shadow-md flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add Amenity</span>
        </motion.button>
      </div>

      {/* Amenities Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-3">
          {filteredAmenities.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <AnimatePresence>
                      {filteredAmenities.map((amenity) => (
                        <motion.tr
                          key={amenity.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-center text-xl text-gray-900">
                            {amenity.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditAmenity(amenity)}
                                className="bg-blue-600 text-xl hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center gap-1"
                              >
                                <Edit size={18} />
                                <span>Edit</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteAmenity(amenity.id)}
                                className="bg-red-600 text-xl hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center gap-1"
                              >
                                <Trash2 size={18} />
                                <span>Delete</span>
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {amenitiesResponse && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrevPage}
                      disabled={page === 1}
                      className={`px-3 py-1 rounded-l-md border ${page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 cursor-pointer hover:bg-purple-50'
                        }`}
                    >
                      <ChevronLeft size={20} />
                    </motion.button>

                    <motion.div
                      className="text-gray-700 text-lg border rounded-lg p-1 border-purple-600 font-medium"
                      whileHover={{ y: -2 }}
                    >
                      Page <span className="text-purple-600">{page}</span> of{" "}
                      <span className="text-purple-600">{amenitiesResponse.pages}</span>
                    </motion.div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNextPage}
                      disabled={page >= amenitiesResponse.pages}
                      className={`px-3 py-1 rounded-r-md border ${page >= amenitiesResponse.pages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 cursor-pointer hover:bg-purple-50'
                        }`}
                    >
                      <ChevronRight size={20} />
                    </motion.button>
                  </nav>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                className="bg-gray-100 p-4 rounded-full mb-4"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Search size={50} className="text-purple-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No Amenities Found
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                {search ? (
                  "No amenities match your search criteria. Try a different search term."
                ) : (
                  "No amenities available. Start by adding new amenities using the button above."
                )}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Keep existing modals the same */}
      <AnimatePresence>
        {showFormModal && (
          <EditAmenityModal
            isOpen={showFormModal}
            amenityData={selectedAmenity}
            onSave={handleSaveAmenity}
            cancel={() => setShowFormModal(false)}
            loading={
              createAmenityMutation.isPending || updateAmenityMutation.isPending
            }
          />
        )}
      </AnimatePresence>

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

      {/* Loader Overlay remains the same */}
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
    </motion.div>
  );
};

export default ManageAmenities;
