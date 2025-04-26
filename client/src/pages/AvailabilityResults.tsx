/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
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
  const { isAuthenticated } = useUserContext();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);

  const [arrival, setArrival] = useState<string>(
    searchParams.get("arrival") || ""
  );
  const [departure, setDeparture] = useState<string>(
    searchParams.get("departure") || ""
  );

  useEffect(() => {
    if (!arrival) {
      const savedArrival = localStorage.getItem(ARRIVAL_DATE_KEY);
      if (savedArrival) {
        setArrival(savedArrival);
        if (departure || localStorage.getItem(DEPARTURE_DATE_KEY)) {
          const depDate =
            departure || localStorage.getItem(DEPARTURE_DATE_KEY) || "";
          navigate(
            `/availability?arrival=${savedArrival}&departure=${depDate}`,
            { replace: true }
          );
        }
      }
    }

    if (!departure) {
      const savedDeparture = localStorage.getItem(DEPARTURE_DATE_KEY);
      if (savedDeparture) {
        setDeparture(savedDeparture);
        if (arrival || localStorage.getItem(ARRIVAL_DATE_KEY)) {
          const arrDate =
            arrival || localStorage.getItem(ARRIVAL_DATE_KEY) || "";
          navigate(
            `/availability?arrival=${arrDate}&departure=${savedDeparture}`,
            { replace: true }
          );
        }
      }
    }
  }, [arrival, departure, navigate]);

  useEffect(() => {
    if (!arrival || !departure) {
      const savedArrival = localStorage.getItem(ARRIVAL_DATE_KEY);
      const savedDeparture = localStorage.getItem(DEPARTURE_DATE_KEY);

      if (savedArrival && savedDeparture) {
        navigate(
          `/availability?arrival=${savedArrival}&departure=${savedDeparture}`,
          { replace: true }
        );
      } else if (!arrival || !departure) {
        navigate("/", { replace: true });
      }
    }
  }, [arrival, departure, navigate]);

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
    return data.rooms.filter(
      (room: any) => room.status !== "reserved" && room.status !== "checked_in"
    );
  };

  const getAvailableAreas = () => {
    if (!data || !data.areas) return [];
    return data.areas.filter(
      (area: any) => area.status !== "reserved" && area.status !== "checked_in"
    );
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

  const toggleLoginModal = useCallback(
    () => setShowLoginModal((prev) => !prev),
    []
  );
  const toggleSignupModal = useCallback(
    () => setShowSignupModal((prev) => !prev),
    []
  );

  const handleSuccessfulLogin = () => window.location.reload();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto py-12 mt-[85px] pb-16">
          <RoomAvailabilityCalendar />

          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
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

          {data && (
            <div className="space-y-16">
              <motion.section
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center mb-6">
                  <div className="h-10 w-2 bg-blue-600 rounded-full mr-3"></div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Rooms
                  </h2>
                </div>

                {getAvailableRooms().length > 0 ? (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
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

              {(getAvailableRooms().length > 0 ||
                getAvailableAreas().length > 0) && (
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl p-6 sm:p-8 text-center mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <h3 className="text-2xl font-bold mb-3">
                    Found your perfect stay?
                  </h3>
                  <p className="text-gray-100 mb-6 text-lg sm:text-xl max-w-2xl mx-auto">
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
