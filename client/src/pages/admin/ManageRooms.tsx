import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { FC, memo, useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { IRoom } from "../../types/RoomAdmin";
import EditRoomModal from "../../components/admin/EditRoomModal";
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
import { Amenity, Room, AddRoomResponse, PaginationData } from "../../types/RoomClient";

const MemoizedImage = memo(({ src, alt, className }: { src: string, alt: string, className: string }) => {
  return (
    <img
      loading="lazy"
      src={src}
      alt={alt}
      className={className}
    />
  );
});

MemoizedImage.displayName = 'MemoizedImage';

const RoomCard = memo(({
  room,
  index,
  onView,
  onEdit,
  onDelete
}: {
  room: Room;
  index: number;
  onView: (room: Room) => void;
  onEdit: (room: Room) => void;
  onDelete: (id: number) => void;
}) => {
  const roomImageProps = useMemo(() => ({
    src: room.room_image,
    alt: room.room_name
  }), [room.room_image, room.room_name]);

  const handleView = useCallback(() => onView(room), [room, onView]);
  const handleEdit = useCallback(() => onEdit(room), [room, onEdit]);
  const handleDelete = useCallback(() => onDelete(room.id), [room.id, onDelete]);

  return (
    <motion.div
      className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        type: "spring",
        damping: 12
      }}
      whileHover={{
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      <MemoizedImage
        src={roomImageProps.src}
        alt={roomImageProps.alt}
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
        <p className="text-gray-600 text-sm mb-1 flex items-center">
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs uppercase font-semibold mr-2 ${room.room_type === 'premium'
            ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
            : 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20'
            }`}>
            {room.room_type === 'premium' ? 'Premium' : 'Suites'}
          </span>
          <span className="flex items-center">
            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs uppercase font-semibold mr-2 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
              {room.bed_type}
            </span>
            <span className="inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold mr-2 bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Max Guests: {room.max_guests}
            </span>
          </span>
        </p>
        {/* Limit the description to 2 lines */}
        <p className="text-gray-700 text-md mb-2 line-clamp-2">
          {room.description || "No description provided."}
        </p>

        <div className="mt-auto flex justify-between items-center">
          <p className="text-xl font-bold text-gray-900">
            {typeof room.room_price === 'string' ? room.room_price : room.room_price.toLocaleString()}
          </p>
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
});

RoomCard.displayName = 'RoomCard';

const RoomDetailsModal: FC<{
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

  const roomImage = useMemo(() => ({
    src: roomData.room_image,
    alt: roomData.room_name
  }), [roomData.room_image, roomData.room_name]);

  return (
    <AnimatePresence>
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
              mass: 0.8
            }}
          >
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 bg-white/80 hover:bg-white text-gray-700 hover:text-red-600 rounded-full p-2 transition-all duration-200 shadow-md cursor-pointer"
              whileTap={{ scale: 0.8 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[90vh]">
              {/* Left Column: Image with gradient overlay - FIXED, NO SCROLL */}
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

              {/* Right Column: Room Information - SCROLLABLE */}
              <div className="overflow-y-auto" style={{ maxHeight: "90vh" }}>
                <div className="p-6 flex flex-col">
                  <motion.div
                    className="hidden md:block mb-4"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-3xl font-bold text-gray-900">{roomData.room_name}</h1>
                    <div className="flex items-center mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${roomData.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {roomData.status === 'available' ? 'AVAILABLE' : 'MAINTENANCE'}
                      </span>
                    </div>
                  </motion.div>

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
                        <span className="text-lg font-bold text-gray-800">{roomData.room_type === 'premium' ? 'Premium' : 'Suites'}</span>
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

                  {/* Max Guests */}
                  <motion.div
                    className="bg-green-50 p-4 rounded-lg mb-5"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.42 }}
                  >
                    <h3 className="text-sm uppercase tracking-wider text-green-600 font-medium mb-2">Maximum Guests</h3>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-lg font-bold text-gray-800">{roomData.max_guests || 1} Guests</span>
                    </div>
                  </motion.div>

                  {/* Bed Type */}
                  <motion.div
                    className="bg-amber-50 p-4 rounded-lg mb-5"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.45 }}
                  >
                    <h3 className="text-sm uppercase tracking-wider text-amber-600 font-medium mb-2">Bed Type</h3>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-lg font-bold text-gray-800 capitalize">{roomData.bed_type}</span>
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
                            transition={{
                              delay: 0.5 + (index * 0.05),
                              type: "spring",
                              stiffness: 100
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700">{getAmenityDescription(Number(amenityId))}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Price Section - Fixed to ensure it always shows */}
                  <motion.div
                    className="mb-5 bg-amber-50 p-4 rounded-lg"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="text-sm uppercase tracking-wider text-amber-600 font-medium mb-2">Pricing</h3>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-800">
                        {typeof roomData.room_price === 'string' && roomData.room_price.trim() !== ''
                          ? roomData.room_price
                          : typeof roomData.room_price === 'number'
                            ? `₱${roomData.room_price.toLocaleString()}`
                            : '₱0'}
                      </span>
                    </div>
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
        predicate: (query) => query.queryKey[0] === "rooms"
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

  const handleViewRoom = useCallback((room: Room) => {
    setViewRoomData(room);
    setShowViewModal(true);
  }, []);

  const handleEditRoom = useCallback((room: Room) => {
    let parsedRoomPrice: number;

    if (typeof room.room_price === 'string') {
      const priceString = room.room_price.replace(/[₱,]/g, '');
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
      status:
        room.status === "available"
          ? "Available"
          : "Maintenance",
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
      console.error("Error saving room:", error);
      throw error;
    }
  };

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (roomsResponse?.pagination && currentPage < roomsResponse.pagination.total_pages) setCurrentPage(prev => prev + 1);
  }, [currentPage, roomsResponse]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, [currentPage]);

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
            <EventLoader text={loaderText} />
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
