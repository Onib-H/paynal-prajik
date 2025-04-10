/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import EditRoomModal, { IRoom } from "../../components/admin/EditRoomModal";
import Modal from "../../components/Modal";
import EventLoader from "../../motions/loaders/EventLoader";
import DashboardSkeleton from "../../motions/skeletons/AdminDashboardSkeleton";
import {
  addNewRoom,
  deleteRoom,
  editRoom,
  fetchAmenities,
  fetchRooms,
} from "../../services/Admin";
import Error from "../_ErrorBoundary";

import { ChevronLeft, ChevronRight, Edit, Eye, Trash2 } from "lucide-react";

interface Amenity {
  id: number;
  description: string;
}

interface Room {
  id: number;
  room_name: string;
  room_image: string;
  room_type: string;
  status: "maintenance" | "occupied" | "available";
  room_price: number;
  description: string;
  capacity: string;
  amenities: number[];
}

interface AddRoomResponse {
  data: any;
}

interface PaginationData {
  total_pages: number;
  current_page: number;
  total_items: number;
  page_size: number;
}

const ViewRoomModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  roomData: Room | null;
  allAmenities: Amenity[];
}> = ({ isOpen, onClose, roomData, allAmenities }) => {
  if (!roomData) return null;

  const getAmenityDescription = (id: number) => {
    const found = allAmenities.find((a) => a.id === id);
    return found ? found.description : `ID: ${id}`;
  };

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
                {roomData.room_image ? (
                  <div className="relative h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
                    <motion.img
                      loading="lazy"
                      src={roomData.room_image}
                      alt={roomData.room_name}
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
                        {roomData.room_name}
                      </motion.h1>
                      <motion.div
                        className="flex items-center"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${roomData.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {roomData.status === 'available' ? 'AVAILABLE' : 'MAINTENANCE'}
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

              {/* Right Column: Room Information */}
              <div className="p-6 flex flex-col">
                <motion.div
                  className="hidden md:block mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-3xl font-bold text-gray-900">{roomData.room_name}</h1>
                  <div className="flex items-center mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${roomData.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                      {roomData.status === 'available' ? 'AVAILABLE' : 'MAINTENANCE'}
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
                    {roomData.description || "No description available."}
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
                    <span className="block text-gray-500 text-sm">Room Type</span>
                    <div className="flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="text-lg font-bold text-gray-800">{roomData.room_type}</span>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <span className="block text-gray-500 text-sm">Capacity</span>
                    <div className="flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-lg font-bold text-gray-800">{roomData.capacity}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Amenities Section */}
                <motion.div
                  className="bg-indigo-50 p-4 rounded-lg mb-5"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-sm uppercase tracking-wider text-indigo-500 font-medium mb-2">Amenities</h3>
                  {roomData.amenities.length === 0 ? (
                    <p className="text-gray-500 italic">No amenities available for this room</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1">
                      {roomData.amenities.map((amenityId, index) => (
                        <motion.div
                          key={amenityId}
                          className="flex items-center py-1"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + (index * 0.05) }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">{getAmenityDescription(amenityId)}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Price Section */}
                <motion.div
                  className="mb-5 bg-amber-50 p-4 rounded-lg"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-sm uppercase tracking-wider text-amber-600 font-medium mb-2">Pricing</h3>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-800">{roomData.room_price.toLocaleString()}</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ManageRooms: FC = () => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editRoomData, setEditRoomData] = useState<IRoom | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRoomData, setViewRoomData] = useState<Room | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState("");

  const queryClient = useQueryClient();

  const {
    data: roomsResponse,
    isLoading,
    isError
  } = useQuery<{
    data: Room[];
    pagination: PaginationData;
  }>({
    queryKey: ["rooms", currentPage, pageSize],
    queryFn: fetchRooms,
  });

  const { data: allAmenitiesData } = useQuery<{ data: Amenity[] }>({
    queryKey: ["allAmenitiesForView", 1, 100],
    queryFn: fetchAmenities,
  });
  const allAmenities = allAmenitiesData?.data || [];

  const addRoomMutation = useMutation<AddRoomResponse, unknown, FormData>({
    mutationFn: addNewRoom,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Adding room...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "rooms"
      });
      setShowFormModal(false);
      toast.success("Room added successfully!");
      setCurrentPage(1);
    },
    onError: (error: any) => {
      toast.error(`Failed to add room.`);
      console.error(`Error adding room: ${error}`);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const editRoomMutation = useMutation<
    AddRoomResponse,
    unknown,
    { roomId: number; formData: FormData }
  >({
    mutationFn: ({ roomId, formData }) => editRoom(roomId, formData),
    onMutate: () => {
      setLoading(true);
      setLoaderText("Updating room...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "rooms"
      });
      setShowFormModal(false);
      toast.success("Room updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update room.`);
      console.error(`Error updating room: ${error}`);
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const deleteRoomMutation = useMutation<any, unknown, number>({
    mutationFn: deleteRoom,
    onMutate: () => {
      setLoading(true);
      setLoaderText("Deleting room...");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "rooms"
      });
      setShowModal(false);

      if (rooms.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    },
    onSettled: () => {
      setLoading(false);
      setLoaderText("");
    },
  });

  const handleAddNew = () => {
    setEditRoomData(null);
    setShowFormModal(true);
  };

  const handleEdit = (room: Room) => {
    setEditRoomData({
      id: room.id,
      roomName: room.room_name,
      roomImage: room.room_image,
      roomType: room.room_type,
      status:
        room.status === "maintenance"
          ? "Maintenance"
          : "Available",
      roomPrice: room.room_price,
      description: room.description,
      capacity: room.capacity,
      amenities: room.amenities ?? [],
    });
    setShowFormModal(true);
  };

  const handleView = (room: Room) => {
    setViewRoomData(room);
    setShowViewModal(true);
  };

  const handleDelete = (roomId: number) => {
    setDeleteRoomId(roomId);
    setShowModal(true);
  };
  const confirmDelete = () => {
    if (deleteRoomId !== null) {
      deleteRoomMutation.mutate(deleteRoomId);
    }
  };
  const cancelDelete = () => {
    setDeleteRoomId(null);
    setShowModal(false);
  };

  const handleSave = async (roomData: IRoom): Promise<void> => {
    const formData = new FormData();
    formData.append("room_name", roomData.roomName);
    formData.append("room_type", roomData.roomType);
    formData.append("status", roomData.status.toLowerCase());
    formData.append("room_price", String(roomData.roomPrice || 0));
    formData.append("description", roomData.description || "");
    formData.append("capacity", roomData.capacity || "");

    if (roomData.amenities && roomData.amenities.length > 0) {
      roomData.amenities.forEach((amenityId) => {
        formData.append("amenities", String(amenityId));
      });
    }

    if (roomData.roomImage instanceof File) {
      formData.append("room_image", roomData.roomImage);
    }

    try {
      if (!roomData.id) {
        await addRoomMutation.mutateAsync(formData);
      } else {
        await editRoomMutation.mutateAsync({ roomId: roomData.id, formData });
      }
    } catch (error) {
      console.error("Error saving room:", error);
      throw error;
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (roomsResponse?.pagination && currentPage < roomsResponse.pagination.total_pages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <Error />;

  const rooms = roomsResponse?.data || [];
  const pagination = roomsResponse?.pagination;

  return (
    <div className="overflow-y-auto h-[calc(100vh-25px)]">
      <div className="p-3 container mx-auto">
        {/* Loader Overlay */}
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-[500]">
            <EventLoader size="80px" text={loaderText} />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-row items-center mb-5 justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Manage Rooms</h1>
            {pagination && (
              <p className="text-gray-500 mt-1">
                Total: {pagination.total_items} room{pagination.total_items !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors duration-300"
          >
            + Add New Room
          </button>
        </div>

        {/* Grid of Room Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full"
            >
              <img
                loading="lazy"
                src={room.room_image}
                alt={room.room_name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {room.room_name}
                  </h2>
                  <span className={`text-sm font-semibold ${room.status === 'available' ? 'text-green-600' : 'text-amber-600'
                    } uppercase`}>
                    {room.status === 'available' ? 'AVAILABLE' : 'MAINTENANCE'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-1">
                  {room.room_type} | Capacity: {room.capacity}
                </p>
                {/* Limit the description to 2 lines */}
                <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                  {room.description || "No description provided."}
                </p>

                <div className="mt-auto flex justify-between items-center">
                  <p className="text-lg font-bold text-gray-900">
                    {typeof room.room_price === 'string' ? room.room_price : room.room_price.toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(room)}
                      className="px-3 py-2 uppercase font-semibold bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-700 transition-colors duration-300"
                    >
                      <Eye />
                    </button>
                    <button
                      onClick={() => handleEdit(room)}
                      className="px-3 py-2 uppercase font-semibold bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors duration-300"
                    >
                      <Edit />
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
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

        {/* Edit/Add Room Modal */}
        {showFormModal && (
          <AnimatePresence mode="wait">
            <EditRoomModal
              isOpen={showFormModal}
              cancel={() => setShowFormModal(false)}
              onSave={handleSave}
              roomData={editRoomData}
              loading={addRoomMutation.isPending || editRoomMutation.isPending}
            />
          </AnimatePresence>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showModal}
          icon="fas fa-trash"
          title="Delete Room"
          description="Are you sure you want to delete this room?"
          cancel={cancelDelete}
          onConfirm={confirmDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md uppercase font-bold hover:bg-red-700 transition-all duration-300"
          cancelText="Cancel"
          confirmText="Delete Room"
        />

        {/* View (Read) Modal */}
        <ViewRoomModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          roomData={viewRoomData}
          allAmenities={allAmenities}
        />
      </div>
    </div>
  );
};

export default ManageRooms;
