import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookCheck, Calendar, Check, Home, Landmark } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BookingAccepted = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const isVenueBooking = searchParams.get('isVenue') === 'true';

  useEffect(() => {
    if (!bookingId) navigate('/');
  }, [bookingId, navigate]);

  const viewBookingDetails = () => {
    navigate(`/guest/bookings?bookingId=${bookingId}&success=true`);
  };

  const goToHome = () => navigate('/');

  return (
    <AnimatePresence>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          className="max-w-2xl w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success Animation */}
          <div className="bg-blue-600 p-8 flex flex-col items-center justify-center">
            <motion.div
              className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Check className="w-12 h-12 text-blue-600" strokeWidth={3} />
              </motion.div>
            </motion.div>

            <motion.h1
              className="text-3xl font-bold text-white text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Booking Confirmed!
            </motion.h1>

            <motion.p
              className="text-blue-100 text-center mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Your {isVenueBooking ? 'venue' : 'room'} booking has been successfully processed.
            </motion.p>
          </div>

          {/* Booking Info */}
          <div className="p-8">
            <motion.div
              className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
            >
              <div className="flex items-start">
                <div className="bg-blue-600 p-2 rounded-md mr-4">
                  {isVenueBooking
                    ? <Landmark className="w-6 h-6 text-white" />
                    : <Calendar className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isVenueBooking ? 'Venue Reservation' : 'Room Booking'} Confirmed
                  </h3>
                  <p className="text-gray-600 text-md mt-1">
                    Booking ID: <span className="font-medium">{bookingId}</span>
                  </p>
                  <p className="text-gray-500 text-md mt-1">
                    You will receive a email if your booking is confirmed by admin.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              <h3 className="font-semibold text-gray-800">Next Steps:</h3>

              <div className="flex items-start">
                <div className="bg-gray-100 rounded-full p-2 mr-3 mt-1">
                  <span className="flex items-center justify-center w-4 h-4 text-xs font-bold text-gray-700">1</span>
                </div>
                <div>
                  <p className="text-gray-700">
                    Check your email for booking confirmation details.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-gray-100 rounded-full p-2 mr-3 mt-1">
                  <span className="flex items-center justify-center w-4 h-4 text-xs font-bold text-gray-700">2</span>
                </div>
                <div>
                  <p className="text-gray-700">
                    Review your booking details in the "My Bookings" section.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-gray-100 rounded-full p-2 mr-3 mt-1">
                  <span className="flex items-center justify-center w-4 h-4 text-xs font-bold text-gray-700">3</span>
                </div>
                <div>
                  <p className="text-gray-700">
                    Contact customer support if you need to make any changes.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              <button
                onClick={viewBookingDetails}
                className="flex items-center justify-center cursor-pointer bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <BookCheck className="w-5 h-5 mr-2" />
                View Booking Details
              </button>

              <button
                onClick={goToHome}
                className="flex items-center justify-center cursor-pointer bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </button>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            className="bg-gray-50 p-4 border-t border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
          >
            <p className="text-center text-gray-500 text-sm flex items-center justify-center">
              <span>Need help with your booking?</span>
              <motion.div
                className="inline-flex items-center text-blue-600 font-medium ml-2 hover:text-blue-700"
                whileHover={{ x: 5 }}
              >
                Contact support <ArrowRight className="w-4 h-4 ml-1" />
              </motion.div>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingAccepted;