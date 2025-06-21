/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import RoomAvailabilityCalendar from "../components/rooms/RoomAvailabilityCalendar";
import RoomCard from "../components/rooms/RoomCard";
import SignupModal from "../components/SignupModal";
import { useUserContext } from "../contexts/AuthContext";
import { fetchAvailability } from "../services/Booking";

const ARRIVAL_DATE_KEY = "hotel_arrival_date";
const DEPARTURE_DATE_KEY = "hotel_departure_date";

const AvailabilityResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useUserContext();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);

  const [arrival, setArrival] = useState<string>(() => {
    const param = searchParams.get("arrival");
    if (param) return param;
    return localStorage.getItem(ARRIVAL_DATE_KEY) || "";
  });

  const [departure, setDeparture] = useState<string>(() => {
    const param = searchParams.get("departure");
    if (param) return param;
    return localStorage.getItem(DEPARTURE_DATE_KEY) || "";
  });

  useEffect(() => {
    if (arrival && departure) {
      const currentArrival = searchParams.get("arrival");
      const currentDeparture = searchParams.get("departure");

      if (currentArrival !== arrival || currentDeparture !== departure) {
        navigate(`/availability?arrival=${arrival}&departure=${departure}`, { replace: true });
      }
    } else if (!arrival || !departure) {
      const savedArrival = localStorage.getItem(ARRIVAL_DATE_KEY);
      const savedDeparture = localStorage.getItem(DEPARTURE_DATE_KEY);

      if (savedArrival && savedDeparture) {
        setArrival(savedArrival);
        setDeparture(savedDeparture);
        navigate(`/availability?arrival=${savedArrival}&departure=${savedDeparture}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [arrival, departure, navigate, searchParams]);

  const availabilityQuery = useQuery({
    queryKey: ["availability", arrival, departure],
    queryFn: () => fetchAvailability(arrival, departure),
    enabled: Boolean(arrival && departure)
  });

  const handleDatesChange = useCallback((newArrival: string, newDeparture: string) => {
    localStorage.setItem(ARRIVAL_DATE_KEY, newArrival);
    localStorage.setItem(DEPARTURE_DATE_KEY, newDeparture);

    setArrival(newArrival);
    setDeparture(newDeparture);

    queryClient.invalidateQueries({ queryKey: ["availability"] });
  }, [queryClient]);

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
    if (!availabilityQuery.data || !availabilityQuery.data.rooms) return [];
    return availabilityQuery.data.rooms.filter(
      (room: any) => room.status !== "reserved" && room.status !== "checked_in"
    );
  };

  const getAvailableAreas = () => {
    if (!availabilityQuery.data || !availabilityQuery.data.areas) return [];
    return availabilityQuery.data.areas.filter(
      (area: any) => area.status !== "reserved" && area.status !== "checked_in"
    );
  };

  const toggleLoginModal = useCallback(() => setShowLoginModal((prev) => !prev), []);
  const toggleSignupModal = useCallback(() => setShowSignupModal((prev) => !prev), []);

  const handleSuccessfulLogin = () => window.location.reload();

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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-12 mt-[120px] pb-16">
          <RoomAvailabilityCalendar onDatesChange={handleDatesChange} />

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
                <span className="font-semibold">
                  {formattedArrival} <span className="mx-2">→</span>{" "}
                  {formattedDeparture}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          <AnimatePresence>
            {availabilityQuery.isLoading && (
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
            {availabilityQuery.error && (
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
          {availabilityQuery.data && (
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
                        <RoomCard
                          id={room.id}
                          name={room.room_name}
                          image={room.room_image}
                          title={room.room_name}
                          price={room.room_price}
                          description={room.description}
                          discount_percent={room.discount_percent || 0}
                          discounted_price={room.discounted_price || room.room_price}
                        />
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
                      Rooms may be fully booked, reserved, or currently checked
                      in. Please try selecting different dates for your stay.
                    </p>
                  </motion.div>
                )}
              </motion.section>

              {/* Call to action footer */}
              {(getAvailableRooms().length > 0 ||
                getAvailableAreas().length > 0) && (
                  <motion.div
                    className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl p-6 text-center mt-12"
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
