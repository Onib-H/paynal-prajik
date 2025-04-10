/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, Check, DollarSign, Home, Info, Star, Users, X } from "lucide-react";
import { lazy, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReviewList from "../components/reviews/ReviewList";
import { useUserContext } from "../contexts/AuthContext";
import { fetchAmenities } from "../services/Admin";
import { fetchRoomReviews } from "../services/Booking";
import { fetchRoomDetail } from "../services/Room";

const LoadingDashboard = lazy(() => import("../motions/skeletons/AdminDashboardSkeleton"));
const Error = lazy(() => import("./_ErrorBoundary"));

const RoomDetails = () => {
  const { isAuthenticated } = useUserContext();
  const { id } = useParams<{ id: string }>();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const {
    data: roomData,
    isLoading: isLoadingRoom,
    error: roomError,
  } = useQuery({
    queryKey: ["room", id],
    queryFn: () => fetchRoomDetail(id as string),
    enabled: !!id,
  });

  const {
    data: allAmenitiesData,
    isLoading: isLoadingAmenities,
    error: amenitiesError,
  } = useQuery({
    queryKey: ["allAmenitiesForRoomDetails", 1, 100],
    queryFn: fetchAmenities,
  });

  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    error: reviewsError
  } = useQuery({
    queryKey: ["roomReviews", id],
    queryFn: () => fetchRoomReviews(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoadingRoom) return <LoadingDashboard />;
  if (roomError) return <Error />;

  const roomDetail = roomData?.data;
  if (!roomDetail) {
    return <div className="text-center mt-4">No room details available</div>;
  }

  const allAmenities = allAmenitiesData?.data || [];
  const getAmenityDescription = (amenityId: any) => {
    const found = allAmenities.find((a: any) => a.id === amenityId);
    return found ? found.description : `ID: ${amenityId}`;
  };

  const isBookingDisabled = (): boolean => {
    const status = roomDetail.status?.toLowerCase();
    return status === 'maintenance' || status === 'occupied' || status === 'reserved';
  };

  const reviews = reviewsData?.data || [];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 15
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 20,
        duration: 0.6
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
    >
      {/* Hero Banner */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: isImageLoaded ? 1 : 0,
            scale: isImageLoaded ? 1 : 1.1,
            transition: { duration: 1.2, ease: "easeOut" }
          }}
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10"
        />

        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          src={roomDetail.room_image}
          alt={roomDetail.room_name}
          onLoad={() => setIsImageLoaded(true)}
          className="absolute inset-0 h-full w-full object-cover z-0 transition-transform duration-10000"
        />

        <div className="relative z-20 h-full w-full flex flex-col justify-between">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="p-6"
          >
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Rooms</span>
            </Link>
          </motion.div>

          {/* Room Name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="p-10 md:p-16 text-center"
          >
            <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg mb-4">
              {roomDetail.room_name}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <motion.div
        variants={containerVariants}
        className="container mx-auto py-12 px-4 sm:px-6 relative z-10 -mt-20"
      >
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column - Room Details */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 space-y-8"
          >
            {/* Main Card */}
            <motion.div
              variants={imageVariants}
              className="bg-white rounded-xl overflow-hidden shadow-xl"
            >
              <div className="p-8">
                <h2 className="text-3xl font-playfair font-bold text-gray-800 mb-6 flex items-center">
                  <Info className="mr-3 text-blue-600" />
                  About This Room
                </h2>

                <p className="text-lg text-gray-700 leading-relaxed font-light mb-8">
                  {roomDetail.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Capacity</h3>
                      <p className="text-gray-600">{roomDetail.capacity} people</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Pricing</h3>
                      <p className="text-gray-600">{roomDetail.room_price}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Amenities Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-6">
                Amenities & Features
              </h2>

              {isLoadingAmenities ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : amenitiesError ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  Failed to load amenities
                </div>
              ) : roomDetail.amenities.length === 0 ? (
                <p className="text-gray-500 italic">No amenities listed for this room</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roomDetail.amenities.map((amenityId: any) => (
                    <div
                      key={amenityId}
                      className="flex items-start"
                    >
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{getAmenityDescription(amenityId)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Reviews Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-playfair font-bold text-gray-800 mb-6 flex items-center">
                <Star className="mr-3 text-yellow-500" />
                Guest Reviews
              </h2>

              <ReviewList
                reviews={reviews}
                isLoading={isLoadingReviews}
                error={reviewsError as Error | null}
              />
            </motion.div>
          </motion.div>

          {/* Right Column - Booking Card */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-1 space-y-6"
          >
            {/* Image */}
            <motion.div
              variants={imageVariants}
              className="bg-white p-4 rounded-xl shadow-lg overflow-hidden"
            >
              <img
                src={roomDetail.room_image}
                alt={roomDetail.room_name}
                className="w-full h-64 object-cover rounded-lg transition-all duration-500 hover:scale-105"
              />
            </motion.div>

            {/* Booking Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl overflow-hidden shadow-lg sticky top-24"
            >
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                <h3 className="text-4xl font-bold">Book Your Stay</h3>
              </div>

              <div className="p-6">
                {/* Room Information */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Home className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-800">Room Type</h4>
                      <p className="text-indigo-600 text-lg font-semibold">{roomDetail.room_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-800">Capacity</h4>
                      <p className="text-gray-900 text-lg font-semibold">{roomDetail.capacity || 2} guests</p>
                    </div>
                  </div>
                </div>

                {isBookingDisabled() ? (
                  <div className="relative">
                    <button
                      disabled
                      className="w-full py-4 bg-gray-400 text-white font-bold text-lg rounded-lg flex items-center justify-center cursor-not-allowed transition-all"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Currently Not Available
                    </button>
                    <div className="mt-2 text-center text-sm text-red-500">
                      This room is currently {roomDetail.status.toLowerCase()}
                    </div>
                  </div>
                ) : (
                  <Link to={`/booking/${roomDetail.id}`} className="block">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full py-4 px-6 ${isAuthenticated
                        ? "bg-gradient-to-r cursor-pointer from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        : "bg-gray-400 cursor-not-allowed"
                        } text-white font-bold text-lg rounded-lg transition-all duration-300 flex items-center justify-center`}
                      disabled={!isAuthenticated}
                    >
                      {isAuthenticated ? (
                        <>
                          <Bookmark className="w-5 h-5 mr-2" />
                          Book Now
                        </>
                      ) : (
                        "Login to Book"
                      )}
                    </motion.button>
                  </Link>
                )}

                {!isAuthenticated && !isBookingDisabled() && (
                  <p className="mt-3 text-center text-sm text-gray-500">
                    Please login to make a reservation
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default RoomDetails;
