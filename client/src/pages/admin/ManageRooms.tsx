/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FC, useCallback, useState } from "react";
import { toast } from "react-toastify";
import EditRoomModal from "../../components/admin/EditRoomModal";
import Modal from "../../components/Modal";
import EventLoader from "../../motions/loaders/EventLoader";
import ManageSkeleton from "../../motions/skeletons/ManageSkeleton";
import { addNewRoom, deleteRoom, editRoom, fetchAmenities, fetchRooms } from "../../services/Admin";
import { IRoom } from "../../types/RoomAdmin";
import { AddRoomResponse, Amenity, PaginationData, Room } from "../../types/RoomClient";
import Error from "../_ErrorBoundary";
import { RoomCard } from "../../memo/RoomCard";
import RoomDetailsModal from "../../components/admin/RoomDetailsModal";

const ManageRooms: FC = () => {
  const [pageSize] = useState(9);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editRoomData, setEditRoomData] = useState<IRoom | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRoomData, setViewRoomData] = useState<Room | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState("");

  const queryClient = useQueryClient();

  const { data: roomsResponse, isLoading, isError } = useQuery<{
    data: Room[];
    pagination: PaginationData;
  }>({
    queryKey: ["rooms", currentPage, pageSize],
    queryFn: () => fetchRooms(currentPage, pageSize),
    staleTime: 1000 * 60 * 5
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
        predicate: (query) => query.queryKey[0] === "rooms",
      });
      setShowFormModal(false);
      toast.success("Room added successfully!");
      setCurrentPage(1);
    },
    onError: () => {
      toast.error(`Failed to add room.`);
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
        predicate: (query) => query.queryKey[0] === "rooms",
      });
      setShowFormModal(false);
      toast.success("Room updated successfully!");
    },
    onError: () => {
      toast.error(`Failed to update room.`);
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
        predicate: (query) => query.queryKey[0] === "rooms",
      });
      setShowModal(false);

      if (rooms.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
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

  const handleViewRoom = useCallback((room: Room) => {
    setViewRoomData(room);
    setShowViewModal(true);
  }, []);

  const handleEditRoom = useCallback((room: Room) => {
    let parsedRoomPrice: number;

    if (typeof room.room_price === "string") {
      const priceString = room.room_price.replace(/[₱,]/g, "");
      parsedRoomPrice = parseFloat(priceString);
    } else {
      parsedRoomPrice = room.room_price;
    }

    setEditRoomData({
      id: room.id,
      roomName: room.room_name,
      roomImage: room.room_image,
      roomType: room.room_type,
      bedType: room.bed_type,
      status: room.status === "available" ? "Available" : "Maintenance",
      roomPrice: parsedRoomPrice,
      description: room.description,
      capacity: room.capacity,
      amenities: room.amenities || [],
      maxGuests: room.max_guests || 1,
    });
    setShowFormModal(true);
  }, []);

  const handleDeleteRoom = useCallback((roomId: number) => {
    setDeleteRoomId(roomId);
    setShowModal(true);
  }, []);

  const confirmDelete = () => {
    if (deleteRoomId !== null) deleteRoomMutation.mutate(deleteRoomId);
  };
  const cancelDelete = () => {
    setDeleteRoomId(null);
    setShowModal(false);
  };

  const handleSave = async (roomData: IRoom): Promise<void> => {
    const formData = new FormData();
    formData.append("room_name", roomData.roomName);
    formData.append("room_type", roomData.roomType);
    formData.append("bed_type", roomData.bedType);
    formData.append("status", roomData.status.toLowerCase());
    formData.append("room_price", String(roomData.roomPrice || 0));
    formData.append("description", roomData.description || "");
    formData.append("capacity", roomData.capacity || "");
    formData.append("max_guests", String(roomData.maxGuests || 1));

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
      console.error(`Error saving room ${error}`);
      throw error;
    }
  };

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (
      roomsResponse?.pagination &&
      currentPage < roomsResponse.pagination.total_pages
    )
      setCurrentPage((prev) => prev + 1);
  }, [currentPage, roomsResponse]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  if (isLoading) return <ManageSkeleton type="room" />;
  if (isError) return <Error />;

  const rooms = roomsResponse?.data || [];
  const pagination = roomsResponse?.pagination;

  return (
    <div className="overflow-y-hidden h-full">
      <div className="p-3 container mx-auto">
        {/* Loader Overlay */}
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 z-[500]">
            <EventLoader text={loaderText} />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-row items-center mb-5 justify-between">
          <h1 className="text-3xl font-semibold">Manage Rooms</h1>
          <motion.button
            onClick={handleAddNew}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer font-semibold transition-colors duration-300"
            whileHover={{ scale: 1.05, backgroundColor: "#7c3aed" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            + Add New Room
          </motion.button>
        </div>

        {/* Grid of Room Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {rooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              index={index}
              onView={handleViewRoom}
              onEdit={handleEditRoom}
              onDelete={handleDeleteRoom}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.total_pages > 1 && (
          <motion.div
            className="flex justify-center items-center gap-2 my-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <motion.button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${currentPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              whileHover={currentPage !== 1 ? { scale: 1.1 } : {}}
              whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
            >
              <ChevronLeft size={20} />
            </motion.button>

            <div className="flex gap-1">
              {Array.from({ length: pagination.total_pages }).map(
                (_, index) => {
                  const pageNumber = index + 1;
                  const isVisible =
                    pageNumber === 1 ||
                    pageNumber === pagination.total_pages ||
                    Math.abs(pageNumber - currentPage) <= 1;

                  if (!isVisible) {
                    if (
                      pageNumber === 2 ||
                      pageNumber === pagination.total_pages - 1
                    ) {
                      return (
                        <span
                          key={`ellipsis-${pageNumber}`}
                          className="px-3 py-1"
                        >
                          ...
                        </span>
                      );
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
                }
              )}
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
          </motion.div>
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
        {viewRoomData && (
          <RoomDetailsModal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            roomData={viewRoomData}
            allAmenities={allAmenities}
          />
        )}
      </div>
    </div>
  );
};

export default ManageRooms;
