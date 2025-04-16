/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { BookCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import Modal from '../components/Modal';
import SignupModal from '../components/SignupModal';
import { useUserContext } from '../contexts/AuthContext';
import EventLoader from '../motions/loaders/EventLoader';
import { BookingFormData, checkCanBookToday, createBooking, fetchRoomById } from '../services/Booking';
import { RoomData } from '../types/BookingClient';

const ConfirmBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useUserContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [savedFormData, setSavedFormData] = useState(null);

  const [canBookToday, setCanBookToday] = useState<boolean>(true);
  const [bookingLimitMessage, setBookingLimitMessage] = useState<string | null>(null);

  // Add animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const { register, handleSubmit: validateForm } = useForm();

  const roomId = searchParams.get('roomId');
  const arrival = searchParams.get('arrival');
  const departure = searchParams.get('departure');
  const priceParam = searchParams.get('totalPrice');

  const [selectedArrival, setSelectedArrival] = useState(arrival || '');
  const [selectedDeparture, setSelectedDeparture] = useState(departure || '');
  const [dateSelectionCompleted, setDateSelectionCompleted] = useState(!!arrival && !!departure);
  const [dateError, setDateError] = useState<string | null>(null);
  const [calculatedTotalPrice, setCalculatedTotalPrice] = useState<number>(priceParam ? parseInt(priceParam) : 0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '+63 ',
    emailAddress: '',
    validId: null as File | null,
    specialRequests: '',
    arrivalTime: '',
    numberOfGuests: '1'
  });

  const [validIdPreview, setValidIdPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    emailAddress?: string;
    validId?: string;
    numberOfGuests?: string;
    arrivalTime?: string;
    general?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const { data: roomData, isLoading } = useQuery<RoomData>({
    queryKey: ['room', roomId],
    queryFn: () => fetchRoomById(roomId),
    enabled: !!roomId
  });

  useEffect(() => {
    if (!isLoading && !roomData) {
      setError({ general: 'Failed to load room details. Please try again.' });
    }
  }, [isLoading, roomData]);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
    }
  }, [roomId, navigate]);

  useEffect(() => {
    if (priceParam) {
      setCalculatedTotalPrice(parseInt(priceParam));
    } else if (roomData && selectedArrival && selectedDeparture) {
      const start = new Date(selectedArrival);
      const end = new Date(selectedDeparture);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (roomData.room_price) {
        const priceString = roomData.room_price.replace(/[₱,]/g, '');
        const roomPrice = parseFloat(priceString);

        if (!isNaN(roomPrice)) {
          setCalculatedTotalPrice(roomPrice * nights);
        }
      }
    }
  }, [roomData, selectedArrival, selectedDeparture, priceParam]);

  useEffect(() => {
    if (isAuthenticated) {
      const checkBookingEligibility = async () => {
        try {
          const eligibility = await checkCanBookToday();
          setCanBookToday(eligibility.canBook);
          setBookingLimitMessage(eligibility.message || null);
        } catch (error) {
          console.error('Error checking booking eligibility:', error);
        }
      };

      checkBookingEligibility();
    }
  }, [isAuthenticated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      const cleaned = value.replace(/[^\d+]/g, '');

      if (!cleaned.startsWith('+63')) return;

      let formatted = '+63 ';
      const localNumber = cleaned.substring(3);

      if (localNumber.length > 0) {
        formatted += localNumber.substring(0, Math.min(localNumber.length, 1));
        if (localNumber.length > 1) {
          formatted += localNumber.substring(1, Math.min(localNumber.length, 4));
          if (localNumber.length > 4) {
            formatted += ' ' + localNumber.substring(4, Math.min(localNumber.length, 7));
            if (localNumber.length > 7) {
              formatted += ' ' + localNumber.substring(7, Math.min(localNumber.length, 11));
            }
          }
        }
      }

      setFormData({
        ...formData,
        [name]: formatted
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        validId: file
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setValidIdPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      if (validIdPreview) {
        URL.revokeObjectURL(validIdPreview);
      }
    };
  }, [validIdPreview]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'arrival-date') {
      setSelectedArrival(value);
      setDateError(null);
    } else if (name === 'departure-date') {
      setSelectedDeparture(value);
      setDateError(null);
    }
  };

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedArrival || !selectedDeparture) {
      setDateError('Please select both check-in and check-out dates');
      return;
    }

    const arrivalDate = new Date(selectedArrival);
    const departureDate = new Date(selectedDeparture);

    if (departureDate <= arrivalDate) {
      setDateError('Check-out date must be after check-in date');
      return;
    }

    setDateSelectionCompleted(true);
    setDateError(null);
  };

  const handleSuccessfulLogin = useCallback(async () => {
    if (!savedFormData || isSubmitting) return;

    setIsSubmitting(true);
    setError({});

    try {
      const response = await createBooking(savedFormData);
      setSuccess(true);
      setSavedFormData(null);
      navigate(`/booking-accepted?bookingId=${response.id}&isVenue=false`);
    } catch (err: any) {
      console.error(`Error creating booking after login: ${err}`);
      if (err.response && err.response.data && err.response.data.error) {
        if (typeof err.response.data.error === 'object') {
          setError(err.response.data.error);
        } else {
          setError({ general: err.response.data.error });
        }
      } else if (err.message) {
        setError({ general: err.message });
      } else {
        setError({ general: 'Failed to create booking. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, savedFormData, isSubmitting]);

  useEffect(() => {
    if (isAuthenticated && savedFormData && !isSubmitting && !success) {
      handleSuccessfulLogin();
    }
  }, [isAuthenticated, savedFormData, handleSuccessfulLogin, isSubmitting, success]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);

  const handleFormSubmit = async () => {
    if (!roomData || isSubmitting) return;

    if (isAuthenticated && !canBookToday) {
      setError({ general: bookingLimitMessage || 'You have already made a booking today. You can make another booking tomorrow.' });
      return;
    }

    const newFieldErrors: { [key: string]: string } = {};
    let hasErrors = false;

    if (!formData.firstName) {
      newFieldErrors.firstName = "First name is required";
      hasErrors = true;
    }

    if (!formData.lastName) {
      newFieldErrors.lastName = "Last name is required";
      hasErrors = true;
    }

    if (!formData.phoneNumber || formData.phoneNumber === '+63 ') {
      newFieldErrors.phoneNumber = "Phone number is required";
      hasErrors = true;
    } else {
      const cleaned = formData.phoneNumber.replace(/[^\d+]/g, '');
      const localNumber = cleaned.substring(3);

      if (!cleaned.startsWith('+63') || localNumber.length !== 10 || !localNumber.startsWith('9')) {
        newFieldErrors.phoneNumber = "Phone number must be in Philippine format: (+63) 9XX XXX XXXX";
        hasErrors = true;
      }
    }

    if (!formData.validId) {
      newFieldErrors.validId = "Please upload a valid ID";
      hasErrors = true;
    }

    if (!formData.arrivalTime) {
      newFieldErrors.arrivalTime = "Please specify your expected time of arrival";
      hasErrors = true;
    } else {
      const arrivalTime = new Date(`2000-01-01T${formData.arrivalTime}`);
      const minTime = new Date(`2000-01-01T14:00`);
      const maxTime = new Date(`2000-01-01T22:00`);

      if (arrivalTime < minTime) {
        newFieldErrors.arrivalTime = "Early check-in is not allowed. Arrival time must be after 2:00 PM.";
        hasErrors = true;
      } else if (arrivalTime > maxTime) {
        newFieldErrors.arrivalTime = "Late arrivals not accepted after 10:00 PM.";
        hasErrors = true;
      }
    }

    if (!formData.numberOfGuests || parseInt(formData.numberOfGuests) < 1) {
      newFieldErrors.numberOfGuests = "Please specify the number of guests";
      hasErrors = true;
    } else if (roomData?.max_guests && parseInt(formData.numberOfGuests) > roomData.max_guests) {
      newFieldErrors.numberOfGuests = `Maximum capacity for this room is ${roomData.max_guests} guests`;
      hasErrors = true;
    }

    if (hasErrors) {
      setError(newFieldErrors);
      return;
    }

    const bookingData: BookingFormData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      validId: formData.validId,
      specialRequests: formData.specialRequests,
      roomId: roomId,
      checkIn: selectedArrival,
      checkOut: selectedDeparture,
      arrivalTime: formData.arrivalTime,
      numberOfGuests: parseInt(formData.numberOfGuests),
      totalPrice: calculatedTotalPrice
    };

    setPendingFormData(bookingData);
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!pendingFormData) return;

    setShowConfirmModal(false);
    setIsSubmitting(true);
    setError({});

    try {
      const arrivalDate = new Date(pendingFormData.checkIn);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isBookingForToday = arrivalDate.getTime() === today.getTime();

      if (isAuthenticated && isBookingForToday) {
        const eligibility = await checkCanBookToday();
        if (!eligibility.canBook) {
          setCanBookToday(false);
          setBookingLimitMessage(eligibility.message || 'You have already made a booking today');
          setError({ general: eligibility.message || 'You have already made a booking today. You can make another booking tomorrow.' });
          setIsSubmitting(false);
          return;
        }
      }

      if (!isAuthenticated) {
        setSavedFormData(pendingFormData);
        setShowLoginModal(true);
        setIsSubmitting(false);
        return;
      }

      const response = await createBooking(pendingFormData);
      setSuccess(true);
      navigate(`/booking-accepted?bookingId=${response.id}&isVenue=false`);
    } catch (err: any) {
      console.error(`Error creating booking:`, err);

      if (err.response && err.response.data && err.response.data.error) {
        if (typeof err.response.data.error === 'object') {
          setError(err.response.data.error);
        } else {
          setError({ general: err.response.data.error });
        }
      } else if (err.message) {
        setError({ general: err.message });
      } else {
        setError({ general: 'Failed to create booking. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}, ${dayOfMonth} ${month}, ${year}`;
  };

  const calculateNights = () => {
    if (!selectedArrival || !selectedDeparture) return 1;

    const arrivalDate = new Date(selectedArrival);
    const departureDate = new Date(selectedDeparture);
    const diffTime = Math.abs(departureDate.getTime() - arrivalDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays || 1;
  };

  const nights = calculateNights();
  const formattedArrivalDate = formatDate(selectedArrival);
  const formattedDepartureDate = formatDate(selectedDeparture);

  const openSignupModal = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const openLoginModal = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  useEffect(() => {
    if (isSubmitting) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSubmitting]);

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto px-4 py-8 max-w-7xl mt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Confirm Booking
        </motion.h1>
        <motion.div
          className="text-center py-10"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] text-blue-600" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <motion.p
            className="mt-2 text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading room details...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  if (!dateSelectionCompleted) {
    return (
      <motion.div
        className="container mx-auto px-4 py-8 max-w-7xl mt-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
          variants={itemVariants}
        >
          Select Your Stay Dates
        </motion.h1>

        {/* Room Information */}
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 mb-6 max-w-2xl mx-auto backdrop-blur-sm bg-white/90 border border-gray-100"
          variants={itemVariants}
          whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
        >
          <div className="flex items-center space-x-4">
            <motion.div
              className="overflow-hidden rounded-md"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                loading="lazy"
                src={roomData?.room_image}
                alt={roomData?.room_name || "Room"}
                className="w-24 h-24 object-cover rounded-md"
              />
            </motion.div>
            <div>
              <motion.h2
                className="text-xl font-bold text-blue-800"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {roomData?.room_name}
              </motion.h2>
              <motion.p
                className="text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {roomData?.room_type}
              </motion.p>
              <motion.p
                className="text-lg font-semibold mt-1 text-blue-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {roomData?.room_price}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {dateError && (
            <motion.div
              className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded max-w-2xl mx-auto shadow-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <p>{dateError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto backdrop-blur-sm bg-white/90 border border-gray-100"
          variants={itemVariants}
          whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
        >
          <form onSubmit={handleDateSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <motion.div variants={itemVariants}>
                <label htmlFor="arrival-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="arrival-date"
                  name="arrival-date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50"
                  required
                  value={selectedArrival}
                  onChange={handleDateChange}
                  min={today}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="departure-date"
                  name="departure-date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50"
                  required
                  value={selectedDeparture}
                  onChange={handleDateChange}
                  min={selectedArrival || today}
                />
              </motion.div>
            </div>

            {/* Time of Arrival */}
            <motion.div className="mb-6" variants={itemVariants}>
              <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 mb-1">
                Expected Time of Arrival <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="arrivalTime"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleInputChange}
                required
                placeholder="Select arrival time"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-gray-50"
              />
              <p className="mt-1 text-sm text-gray-500">Please indicate your expected time of arrival</p>
            </motion.div>

            <AnimatePresence>
              {selectedArrival && selectedDeparture && (
                <motion.div
                  className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md shadow-md"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <div className="flex flex-col md:flex-row md:justify-between">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="text-blue-800 font-medium">Selected Stay:</span>
                      <span className="ml-2 text-blue-700">
                        {format(new Date(selectedArrival), 'MMM dd, yyyy')} to {format(new Date(selectedDeparture), 'MMM dd, yyyy')}
                      </span>
                    </motion.div>
                    <motion.div
                      className="mt-2 md:mt-0"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-blue-800 font-medium">Duration:</span>
                      <span className="ml-2 text-blue-700">{nights} day{nights !== 1 ? 's' : ''}</span>
                    </motion.div>
                  </div>
                  <motion.div
                    className="mt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="text-blue-800 font-medium">Estimated Price:</span>
                    <motion.span
                      className="ml-2 text-blue-700 font-semibold"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    >
                      ₱{calculatedTotalPrice.toLocaleString()}
                    </motion.span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <motion.button
                type="button"
                onClick={() => navigate('/rooms')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Back to Rooms
              </motion.button>
              <motion.button
                type="submit"
                className={`px-6 py-2 ${!selectedArrival || !selectedDeparture || !!dateError
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-all duration-300`}
                disabled={!selectedArrival || !selectedDeparture || !!dateError}
                whileHover={!selectedArrival || !selectedDeparture || !!dateError ? {} : {
                  scale: 1.03,
                  boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.3)",
                }}
                whileTap={!selectedArrival || !selectedDeparture || !!dateError ? {} : { scale: 0.97 }}
              >
                Continue to Booking
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isSubmitting && (
          <EventLoader
            text="Processing your booking..."
            type="reserve"
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <Modal
        icon='fa-solid fa-book'
        title="Confirm Your Room Booking"
        description={`You're about to book ${roomData?.room_name || 'this room'} for ${nights} night${nights !== 1 ? 's' : ''}. The total price is ₱${calculatedTotalPrice.toLocaleString()}. Would you like to proceed?`}
        cancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        confirmText={
          <div className="flex items-center">
            <BookCheck className="mr-2 h-5 w-5" />
            Book Now
          </div>
        }
        cancelText="Cancel"
        isOpen={showConfirmModal}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md uppercase font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 cursor-pointer flex items-center"
      />

      <motion.div
        className="container mx-auto px-4 py-8 max-w-7xl mt-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
          variants={itemVariants}
        >
          Confirm Booking
        </motion.h1>

        <AnimatePresence>
          {isAuthenticated && !canBookToday && (
            <motion.div
              className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg shadow-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Booking Limit Reached</h3>
                  <p className="text-sm mt-1">
                    {bookingLimitMessage || 'You have already made a booking today. You can make another booking tomorrow.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isAuthenticated && (
            <motion.div
              className="mb-6 p-4 bg-blue-50 border border-blue-300 text-blue-800 rounded-lg shadow-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Login Required</h3>
                  <p className="text-sm mt-1">
                    You'll need to log in or create an account to complete your booking. Don't worry - your booking information will be saved during the process.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div
              className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <p>Booking successfully created! You will be redirected to your booking details.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error.general && (
            <motion.div
              className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <p>{error.general}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - Takes 2/3 width on large screens */}
          <motion.div
            className="lg:col-span-2"
            variants={itemVariants}
          >
            <motion.form
              id="booking-form"
              onSubmit={validateForm(handleFormSubmit)}
              className="bg-white rounded-lg shadow-xl p-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h2
                className="text-xl font-semibold mb-4 text-blue-800"
                variants={itemVariants}
              >
                Your details
              </motion.h2>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <motion.div variants={itemVariants}>
                  <label htmlFor="firstName" className="block text-md font-medium text-gray-700 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    {...register("firstName")}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${error.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {error.firstName &&
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {error.firstName}
                    </motion.p>
                  }
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label htmlFor="lastName" className="block text-md font-medium text-gray-700 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    {...register("lastName")}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${error.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {error.lastName &&
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {error.lastName}
                    </motion.p>
                  }
                </motion.div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <motion.div variants={itemVariants}>
                  <label htmlFor="phoneNumber" className="block text-md font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    {...register("phoneNumber")}
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+63 9XX XXX XXXX"
                    className={`w-full px-3 py-2 border ${error.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {error.phoneNumber &&
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {error.phoneNumber}
                    </motion.p>
                  }
                  <p className="mt-1 text-xs text-gray-500">Format: +63 9XX XXX XXXX (Philippine number)</p>
                </motion.div>
                {/* Number of Guests */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="numberOfGuests" className="block text-md font-medium text-gray-700 mb-1">
                    Number of Guest(s) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col">
                    <input
                      type="number"
                      id="numberOfGuests"
                      {...register("numberOfGuests")}
                      name="numberOfGuests"
                      value={formData.numberOfGuests}
                      onChange={handleInputChange}
                      min="1"
                      max={roomData?.max_guests}
                      className={`w-full px-3 py-2 border ${error.numberOfGuests ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                    />
                    {error.numberOfGuests &&
                      <motion.p
                        className="text-red-500 text-sm mt-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {error.numberOfGuests}
                      </motion.p>
                    }
                    {roomData?.max_guests && (
                      <motion.p
                        className="mt-1 text-sm text-blue-600 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        Max. Guests Allowed: {roomData.max_guests}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              </div>


              {/* Address and Valid ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="validId" className="block text-md font-medium text-gray-700 mb-1">
                    Valid ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="validId"
                    name="validId"
                    onChange={handleFileChange}
                    accept="image/*"
                    required
                    className={`w-full py-2 ${error.validId ? 'border-red-500' : ''}`}
                  />
                  {error.validId && <p className="text-red-500 text-sm mt-1">{error.validId}</p>}

                  {/* Valid ID Preview Container */}
                  {validIdPreview && (
                    <div className="mt-2 relative">
                      <div className="relative border rounded-md overflow-hidden" style={{ height: '120px' }}>
                        <img
                          loading="lazy"
                          src={validIdPreview}
                          alt="ID Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setValidIdPreview(null);
                          setFormData({ ...formData, validId: null });
                        }}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        aria-label="Remove image"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Check-in/out Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="checkIn" className="block text-md font-medium text-gray-700 mb-1">
                    Check In <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="checkIn"
                    name="checkIn"
                    disabled
                    value={selectedArrival}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label htmlFor="checkOut" className="block text-md font-medium text-gray-700 mb-1">
                    Check Out <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="checkOut"
                    name="checkOut"
                    disabled
                    value={selectedDeparture}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  />
                </div>
              </div>

              {/* Time of Arrival */}
              <div className="mb-6">
                <label htmlFor="arrivalTime" className="block text-md font-medium text-gray-700 mb-1">
                  Expected Time of Arrival <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="arrivalTime"
                  {...register("arrivalTime")}
                  name="arrivalTime"
                  value={formData.arrivalTime}
                  onChange={handleInputChange}
                  placeholder="Select arrival time"
                  className={`w-full px-3 py-2 border ${error.arrivalTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50`}
                />
                {error.arrivalTime && <p className="text-red-500 text-sm mt-1">{error.arrivalTime}</p>}
                <p className="mt-1 text-sm text-gray-500">Please indicate your expected time of arrival</p>
              </div>

              {/* Special Requests */}
              <div className="mb-6">
                <label htmlFor="specialRequests" className="block text-md font-medium text-gray-700 mb-1">
                  Special requests to hotel
                </label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 resize-none"
                ></textarea>
              </div>

              {/* Submit Button for Mobile View */}
              <div className="lg:hidden mt-6">
                <motion.button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFormSubmit}
                  className={`w-full py-3 px-6 rounded-md text-white text-center cursor-pointer font-semibold ${isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg'
                    }`}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{
                    boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  {isSubmitting ? '' : isAuthenticated ? (
                    <div className="flex items-center justify-center">
                      <BookCheck className="w-5 h-5 mr-2" />
                      Complete Booking
                    </div>
                  ) : 'Continue to Login'}
                </motion.button>
              </div>
            </motion.form>
          </motion.div>

          {/* Sidebar - Takes 1/3 width on large screens */}
          <motion.div
            className="lg:col-span-1"
            variants={itemVariants}
          >
            {/* Room Information */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <div className="relative mb-4 overflow-hidden rounded-md">
                <motion.img
                  loading="lazy"
                  src={roomData?.room_image}
                  alt={roomData?.room_name || "Room"}
                  className="w-full h-40 object-cover rounded-md"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <motion.h3
                className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {roomData?.room_name || "Room"}
              </motion.h3>

              {/* Amenities */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-md font-semibold text-gray-700 mb-2">Room Amenities</h4>
                {roomData?.amenities && roomData.amenities.length > 0 ? (
                  roomData.amenities.map((amenity, index) => (
                    <motion.div
                      key={`amenity-${amenity.id}`}
                      className="flex items-center"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-md text-gray-600">{amenity.description}</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No amenities listed</p>
                )}
              </motion.div>
            </motion.div>

            {/* Booking Details */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              variants={itemVariants}
              whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h3
                className="text-lg font-semibold mb-4 text-blue-800"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Your booking details
              </motion.h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800 font-semibold">Check-in :</p>
                  <p className="font-semibold">{formattedArrivalDate}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-lg text-gray-800 font-semibold">Check-out :</p>
                  <p className="font-semibold">{formattedDepartureDate}</p>
                </motion.div>
              </div>

              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-lg text-gray-800 font-semibold">Arrival Time :</p>
                <p className="font-semibold">
                  {formData.arrivalTime
                    ? new Date(`2000-01-01T${formData.arrivalTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Not specified'}
                </p>
              </motion.div>

              <motion.div
                className="mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-md font-medium">{roomData?.room_name || "Deluxe Room"}</p>
                <p className="text-md text-gray-600">{nights} night{nights > 1 ? 's' : ''}</p>
              </motion.div>
            </motion.div>

            {/* Pricing Summary */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              variants={itemVariants}
              whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h3
                className="text-xl font-semibold mb-4 text-blue-800"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Pricing Summary
              </motion.h3>
              <motion.div
                className="text-md mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-gray-600">1 room x {nights} night{nights > 1 ? 's' : ''}</p>
              </motion.div>
              <motion.div
                className="text-md mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="font-medium">{roomData?.room_name || "Room"}</p>
                <p className="text-lg text-gray-700">
                  {roomData?.room_price} per night
                </p>
              </motion.div>
              <motion.div
                className="border-t pt-3 flex justify-between items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              >
                <span className="font-semibold text-2xl">Total Price :</span>
                <motion.span
                  className="font-bold text-blue-600 text-2xl"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  ₱{calculatedTotalPrice.toLocaleString()}
                </motion.span>
              </motion.div>
            </motion.div>

            <div className="hidden lg:block">
              <motion.button
                type="button"
                disabled={isSubmitting}
                onClick={handleFormSubmit}
                className={`w-full py-3 px-6 rounded-md text-white text-center text-xl font-semibold flex justify-center items-center ${isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg'
                  }`}
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                whileHover={{
                  boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.3)",
                }}
              >
                {isSubmitting ? '' : isAuthenticated ? (
                  <>
                    <BookCheck className="w-8 h-8 mr-2" />
                    Complete Booking
                  </>
                ) : 'Continue to Login'}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Login Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoginModal
                toggleLoginModal={() => setShowLoginModal(false)}
                openSignupModal={openSignupModal}
                onSuccessfulLogin={handleSuccessfulLogin}
                bookingInProgress={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signup Modal */}
        <AnimatePresence>
          {showSignupModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SignupModal
                toggleRegisterModal={() => setShowSignupModal(false)}
                openLoginModal={openLoginModal}
                onSuccessfulSignup={handleSuccessfulLogin}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default ConfirmBooking;