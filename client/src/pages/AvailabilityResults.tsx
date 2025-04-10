/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Book, Calendar } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RoomAvailabilityCalendar from "../components/rooms/RoomAvailabilityCalendar";
import SignupModal from "../components/SignupModal";
import { useUserContext } from "../contexts/AuthContext";
import { fetchAvailability } from "../services/Booking";

const AvailabilityResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useUserContext();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);
  const arrival = searchParams.get("arrival") || "";
  const departure = searchParams.get("departure") || "";

  if (!arrival || !departure) {
    navigate("/");
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["availability", arrival, departure],
    queryFn: () => fetchAvailability(arrival, departure),
    enabled: !!arrival && !!departure,
  });

  const formatDisplayDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const formattedArrival = formatDisplayDate(arrival);
  const formattedDeparture = formatDisplayDate(departure);

  const getAvailableRooms = () => {
    if (!data || !data.rooms) return [];
    return data.rooms.filter((room: any) =>
      room.status !== "reserved" &&
      room.status !== "checked_in"
    );
  };

  const getAvailableAreas = () => {
    if (!data || !data.areas) return [];
    return data.areas.filter((area: any) =>
      area.status !== "reserved" &&
      area.status !== "checked_in"
    );
  };

  const handleBookVenue = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    navigate(`/venue-booking/${id}?arrival=${arrival}&departure=${departure}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        damping: 15,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const toggleLoginModal = useCallback(() => setShowLoginModal((prev) => !prev), []);
  const toggleSignupModal = useCallback(() => setShowSignupModal((prev) => !prev), []);

  const handleSuccessfulLogin = () => window.location.reload();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-12 mt-[120px] pb-16">
          <RoomAvailabilityCalendar />
          {/* Page Header with Animation */}
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Available Accommodations
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-gray-600 mt-3">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <Calendar className="text-blue-600 h-5 w-5" />
                <span className="font-medium">
                  {formattedArrival} <span className="mx-2">→</span>{" "}
                  {formattedDeparture}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="flex justify-center items-center h-60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col items-center">
                  <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  <p className="mt-4 text-lg text-gray-600">
                    Finding perfect accommodations for you...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg text-center max-w-2xl mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-lg font-medium">
                  Unable to fetch availability
                </p>
                <p className="mt-1">
                  Please try different dates or contact our support team
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          {data && (
            <div className="space-y-16">
              {/* Rooms Section */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center mb-6">
                  <div className="h-10 w-2 bg-blue-600 rounded-full mr-3"></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Rooms
                  </h2>
                </div>

                {getAvailableRooms().length > 0 ? (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {getAvailableRooms().map((room: any) => (
                      <motion.div
                        key={room.id}
                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                        variants={itemVariants}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <Link to={`/rooms/${room.id}`} className="block">
                          <div className="relative">
                            <img
                              loading="lazy"
                              src={room.room_image || "/default-room.jpg"}
                              alt={room.room_name}
                              className="w-full h-56 object-cover"
                            />
                          </div>

                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {room.room_name}
                            </h3>

                            <div className="flex justify-between items-end mt-3">
                              <div>
                                <p className="text-2xl font-bold text-blue-600">
                                  {room.room_price}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                {isAuthenticated ? (
                                  <Link
                                    to={`/confirm-booking?roomId=${room.id}&arrival=${arrival}&departure=${departure}`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-md uppercase font-semibold"
                                  >
                                    <Book size={16} /> <span>Book</span>
                                  </Link>
                                ) : (
                                  <button
                                    disabled
                                    className="bg-gray-400 text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-not-allowed text-md"
                                    title="Please login to book"
                                  >
                                    <Book size={16} /> <span>Book</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
                  >
                    <p className="text-gray-600 text-lg">
                      No rooms available for these dates.
                    </p>
                    <p className="text-gray-500 mt-2">
                      Rooms may be fully booked, reserved, or currently checked in.
                      Please try selecting different dates for your stay.
                    </p>
                  </motion.div>
                )}
              </motion.section>

              {/* Areas/Venues Section */}
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center mb-6">
                  <div className="h-10 w-2 bg-green-600 rounded-full mr-3"></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Venues
                  </h2>
                </div>

                {getAvailableAreas().length > 0 ? (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {getAvailableAreas().map((area: any) => (
                      <motion.div
                        key={area.id}
                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                        variants={itemVariants}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <Link to={`/venues/${area.id}`} className="block">
                          <div className="relative">
                            <img
                              loading="lazy"
                              src={area.area_image || "/default-venue.jpg"}
                              alt={area.area_name}
                              className="w-full h-56 object-cover"
                            />
                          </div>

                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {area.area_name}
                            </h3>

                            <div className="flex justify-between items-end mt-3">
                              <div>
                                <p className="text-2xl font-bold text-green-600">
                                  {area.price_per_hour}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                {isAuthenticated ? (
                                  <button
                                    onClick={(e) => handleBookVenue(e, area.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-md uppercase font-semibold"
                                  >
                                    <Book size={16} /> <span>Book</span>
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="bg-gray-400 text-white px-3 py-2 rounded-lg flex items-center gap-1 cursor-not-allowed text-md"
                                    title="Please login to book"
                                  >
                                    <Book size={16} /> <span>Book</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
                  >
                    <p className="text-gray-600 text-lg">
                      No venues available for these dates.
                    </p>
                    <p className="text-gray-500 mt-2">
                      Venues may be fully booked, reserved, or currently in use.
                      Please try selecting different dates for your event.
                    </p>
                  </motion.div>
                )}
              </motion.section>

              {/* Call to action footer */}
              {(getAvailableRooms().length > 0 || getAvailableAreas().length > 0) && (
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl p-6 text-center mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <h3 className="text-2xl font-bold mb-3">
                    Found your perfect stay?
                  </h3>
                  <p className="text-gray-100 mb-6 min-w-2xl text-2xl mx-auto">
                    Book now to secure your preferred accommodation for{" "}
                    {formattedArrival} to {formattedDeparture}.
                  </p>
                  {!isAuthenticated && (
                    <motion.button
                      onClick={() => setShowLoginModal(true)}
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg shadow-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Login to Book
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <LoginModal
            toggleLoginModal={toggleLoginModal}
            openSignupModal={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}
            onSuccessfulLogin={handleSuccessfulLogin}
            bookingInProgress={true}
          />
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <SignupModal
            toggleRegisterModal={toggleSignupModal}
            openLoginModal={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
            onSuccessfulSignup={handleSuccessfulLogin}
          />
        </div>
      )}
    </>
  );
};

export default AvailabilityResults;
