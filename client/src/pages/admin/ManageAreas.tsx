/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import EditAreaModal, {
  IArea as IEditArea,
} from "../../components/admin/EditAreaModal";
import Modal from "../../components/Modal";
import EventLoader from "../../motions/loaders/EventLoader";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import {
  addNewArea,
  deleteArea,
  editArea,
  fetchAreas,
} from "../../services/Admin";
import Error from "../_ErrorBoundary";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit, Eye, MapPin, Trash2 } from "lucide-react";

interface Area {
  id: number;
  area_name: string;
  area_image: string;
  description?: string;
  capacity: number;
  price_per_hour: number;
  status: "available" | "maintenance";
}

interface AddAreaResponse {
  data: any;
}

interface PaginationData {
  total_pages: number;
  current_page: number;
  total_items: number;
  page_size: number;
}

// View Area Modal Component
const ViewAreaModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  areaData: Area | null;
}> = ({ isOpen, onClose, areaData }) => {
  if (!areaData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close button - positioned on top right */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 bg-white/80 hover:bg-white text-gray-700 hover:text-red-600 rounded-full p-2 transition-all duration-200 shadow-md"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column: Image with gradient overlay */}
              <div className="relative h-64 md:h-auto">
                {areaData.area_image ? (
                  <div className="relative h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                    <motion.img
                      loading="lazy"
                      src={areaData.area_image}
                      alt={areaData.area_name}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    />
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
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${areaData.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {areaData.status === 'available' ? 'AVAILABLE' : 'MAINTENANCE'}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </motion.svg>
                  </div>
                )}
              </div>

              {/* Right Column: Area Information */}
              <div className="p-6 flex flex-col">
                <motion.div
                  className="hidden md:block mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-3xl font-bold text-gray-900">{areaData.area_name}</h1>
                  <div className="flex items-center mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${areaData.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                      {areaData.status === 'available' ? 'AVAILABLE' : 'MAINTENANCE'}
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
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-2">Description</h3>
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
                    <span className="block text-gray-500 text-sm">Capacity</span>
                    <div className="flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-xl font-bold text-gray-800">{areaData.capacity} <span className="text-sm font-normal text-gray-600">people</span></span>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <span className="block text-gray-500 text-sm">Price</span>
                    <div className="flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xl font-bold text-gray-800">{areaData.price_per_hour.toLocaleString()}</span>
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
                  <h3 className="text-sm uppercase tracking-wider text-indigo-500 font-medium mb-2">Booking Information</h3>
                  <p className="text-gray-700 text-sm">
                    This venue is available for fixed hours (8:00 AM - 5:00 PM) and can be booked for
                    <span className="font-medium"> {areaData.price_per_hour.toLocaleString()}</span> per booking.
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

const ManageAreas = () => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editAreaData, setEditAreaData] = useState<IEditArea | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewAreaData, setViewAreaData] = useState<Area | null>(null);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [deleteAreaId, setDeleteAreaId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loaderText, setLoaderText] = useState<string>("");
  const queryClient = useQueryClient();

  const {
    data: areasResponse,
    isLoading,
    isError,
  } = useQuery<{
    data: Area[];
    pagination: PaginationData;
  }>({
    queryKey: ["areas", currentPage, pageSize],
    queryFn: fetchAreas,
  });

  const areas = areasResponse?.data || [];
  const pagination = areasResponse?.pagination;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.total_pages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const addAreaMutation = useMutation<AddAreaResponse, unknown, FormData>({
    mutationFn: addNewArea,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Adding area...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "areas"
      });
      setShowFormModal(false);
      toast.success("Area added successfully!");

      setCurrentPage(1);
    },
    onError: (error: any) => {
      console.error(`Error adding area: ${error}`);
      toast.error(`Failed to add area.`);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const editAreaMutation = useMutation<
    AddAreaResponse,
    unknown,
    { areaId: number; formData: FormData }
  >({
    mutationFn: ({ areaId, formData }) => editArea(areaId, formData),
    onMutate: () => {
      setLoading(true);
      setLoaderText("Updating area...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "areas"
      });
      setShowFormModal(false);
      toast.success("Area updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update area: ${error.message || 'Unknown error'}`);
      console.error("Error updating area:", error);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const deleteAreaMutation = useMutation<any, unknown, number>({
    mutationFn: deleteArea,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Deleting area...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "areas"
      });
      setShowModal(false);

      if (areas.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const handleAddNew = () => {
    setEditAreaData(null);
    setShowFormModal(true);
  };

  const handleView = (area: Area) => {
    setViewAreaData(area);
    setShowViewModal(true);
  };

  const handleEdit = (area: Area) => {
    setEditAreaData({
      id: area.id,
      area_name: area.area_name,
      area_image:
        typeof area.area_image === "string" ? area.area_image : area.area_image,
      description: area.description || "",
      capacity: area.capacity,
      price_per_hour: area.price_per_hour,
      status: area.status,
    });
    setShowFormModal(true);
  };

  const handleDelete = (areaId: number) => {
    setDeleteAreaId(areaId);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (deleteAreaId != null) {
      deleteAreaMutation.mutate(deleteAreaId);
    }
  };

  const cancelDelete = () => {
    setDeleteAreaId(null);
    setShowModal(false);
  };

  const handleSave = async (areaData: IEditArea): Promise<void> => {
    const formData = new FormData();
    formData.append("area_name", areaData.area_name);
    formData.append("description", areaData.description || "");
    formData.append("capacity", areaData.capacity.toString());
    formData.append("price_per_hour", areaData.price_per_hour.toString());
    formData.append("status", areaData.status);

    if (areaData.area_image instanceof File) {
      formData.append("area_image", areaData.area_image);
    }

    try {
      if (!areaData.id) {
        await addAreaMutation.mutateAsync(formData);
      } else {
        await editAreaMutation.mutateAsync({ areaId: areaData.id, formData });
      }
    } catch (error) {
      console.error("Error saving area:", error);
      throw error;
    }
  };

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <Error />;

  return (
    <div className="overflow-y-auto h-[calc(100vh-25px)]">
      <div className="p-3 container mx-auto">
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-[500]">
            <EventLoader size="80px" text={loaderText} />
          </div>
        )}

        {/* Add New Area Button */}
        <div className="flex flex-row items-center mb-5 justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Manage Areas</h1>
            {pagination && (
              <p className="text-gray-500 mt-1">
                Total: {pagination.total_items} area{pagination.total_items !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors duration-300"
          >
            + Add New Area
          </button>
        </div>

        {/* Areas Grid or Empty State */}
        {areas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {areas.map((area) => (
              <div
                key={area.id}
                className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full"
              >
                <img
                  loading="lazy"
                  src={area.area_image}
                  alt={area.area_name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {area.area_name}
                    </h2>
                    <span className={`text-sm font-semibold ${area.status === 'available' ? 'text-green-600' : 'text-amber-600'
                      } uppercase`}>
                      {area.status === 'available' ? 'AVAILABLE' : 'MAINTENANCE'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">
                    Capacity: {area.capacity} people
                  </p>
                  <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                    {area.description || "No description provided."}
                  </p>

                  <div className="mt-auto flex justify-between items-center">
                    <p className="text-lg font-bold text-gray-900">
                      {area.price_per_hour.toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(area)}
                        className="px-3 py-2 uppercase font-semibold bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-700 transition-colors duration-300"
                      >
                        <Eye />
                      </button>
                      <button
                        onClick={() => handleEdit(area)}
                        className="px-3 py-2 uppercase font-semibold bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors duration-300"
                      >
                        <Edit />
                      </button>
                      <button
                        onClick={() => handleDelete(area.id)}
                        className="px-3 py-2 uppercase font-semibold bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition-colors duration-300"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-16">
            <MapPin className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-2xl font-semibold">No Areas Found</p>
            <p className="mt-2 text-gray-500 text-center max-w-md">
              It looks like you haven't added any areas yet. Click the button
              below to create your first area.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-2 my-5">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${currentPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: pagination.total_pages }).map((_, index) => {
                const pageNumber = index + 1;
                // Show current page, first page, last page, and pages around current
                const isVisible =
                  pageNumber === 1 ||
                  pageNumber === pagination.total_pages ||
                  Math.abs(pageNumber - currentPage) <= 1;

                // Show ellipsis for gaps
                if (!isVisible) {
                  // Show ellipsis only once between gaps
                  if (pageNumber === 2 || pageNumber === pagination.total_pages - 1) {
                    return <span key={`ellipsis-${pageNumber}`} className="px-3 py-1">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => goToPage(pageNumber)}
                    className={`w-8 h-8 rounded-full ${currentPage === pageNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-blue-100"
                      }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextPage}
              disabled={pagination && currentPage === pagination.total_pages}
              className={`p-2 rounded-full ${pagination && currentPage === pagination.total_pages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Edit/Add Area Modal */}
        {showFormModal && (
          <AnimatePresence mode="wait">
            <EditAreaModal
              isOpen={showFormModal}
              cancel={() => setShowFormModal(false)}
              onSave={handleSave}
              areaData={editAreaData}
              loading={addAreaMutation.isPending || editAreaMutation.isPending}
            />
          </AnimatePresence>
        )}

        {/* View Area Modal */}
        <ViewAreaModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          areaData={viewAreaData}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showModal}
          icon="fas fa-trash"
          title="Delete Area"
          description="Are you sure you want to delete this area?"
          cancel={cancelDelete}
          onConfirm={confirmDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md uppercase font-bold hover:bg-red-700 transition-all duration-300"
          cancelText="No"
          confirmText="Delete Area"
        />
      </div>
    </div>
  );
};

export default ManageAreas;