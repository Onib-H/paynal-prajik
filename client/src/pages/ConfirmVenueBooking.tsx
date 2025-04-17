import { useQuery } from '@tanstack/react-query';
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
import { ReservationFormData, checkCanBookToday, createReservation, fetchAreaById } from '../services/Booking';
import { AreaData, FormData } from '../types/BookingClient';

const ConfirmVenueBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useUserContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [savedFormData, setSavedFormData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ReservationFormData | null>(null);

  const areaId = searchParams.get('areaId');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const totalPrice = searchParams.get('totalPrice');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '+63 ',
      emailAddress: '',
      specialRequests: '',
      numberOfGuests: '1'
    }
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '+63 ',
    emailAddress: '',
    validId: null as File | null,
    specialRequests: '',
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
    general?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  const [canBookToday, setCanBookToday] = useState<boolean>(true);
  const [bookingLimitMessage, setBookingLimitMessage] = useState<string | null>(null);

  const { data: areaData, isLoading } = useQuery<AreaData>({
    queryKey: ['area', areaId],
    queryFn: () => fetchAreaById(areaId as string),
    enabled: !!areaId
  });

  useEffect(() => {
    if (!isLoading && !areaData) {
      setError({ general: 'Failed to load venue details. Please try again.' });
    }
  }, [isLoading, areaData]);

  useEffect(() => {
    if (!areaId || !startTime || !endTime) {
      navigate('/venues');
    }
  }, [areaId, navigate, startTime, endTime]);

  useEffect(() => {
    if (isAuthenticated) {
      const checkBookingEligibility = async () => {
        try {
          const eligibility = await checkCanBookToday();
          setCanBookToday(eligibility.canBook);
          setBookingLimitMessage(eligibility.message || null);
        } catch (error) {
          console.error(`Error checking booking eligibility: ${error}`);
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

      setValue(name as keyof FormData, formatted);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });

      setValue(name as keyof FormData, value);
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
      if (validIdPreview) URL.revokeObjectURL(validIdPreview);
    };
  }, [validIdPreview]);

  const handleSuccessfulLogin = useCallback(async () => {
    if (!savedFormData || isSubmitting) return;

    setIsSubmitting(true);
    setError({});

    try {
      const response = await createReservation(savedFormData);
      setSuccess(true);
      setSavedFormData(null);
      navigate(`/booking-accepted?bookingId=${response.id}&isVenue=true`);
    } catch (err: any) {
      console.error(`Error creating venue booking: ${err}`);
      const errorMessage = 'Failed to create venue booking. Please try again.';

      if (err.response && err.response.data && err.response.data.error) {
        if (typeof err.response.data.error === 'string') {
          setError({ general: err.response.data.error });
        } else if (typeof err.response.data.error === 'object') {
          setError(err.response.data.error);
        }
      } else {
        setError({ general: errorMessage });
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

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return;

    if (isAuthenticated && !canBookToday) {
      setError({ general: bookingLimitMessage || 'You have already made a booking today. You can make another booking tomorrow.' });
      return;
    }

    if (!areaId || !startTime || !endTime || !totalPrice) {
      setError({ general: "Missing required booking information" });
      return;
    }

    const parsedStartTime = startTime ? new Date(startTime).toISOString() : null;
    const parsedEndTime = endTime ? new Date(endTime).toISOString() : null;

    const validIdFile = formData.validId;
    if (!validIdFile) {
      setError({ validId: "Please upload a valid ID" });
      return;
    }

    const cleanedPhoneNumber = data.phoneNumber.replace(/\s+/g, '');

    const reservationData: ReservationFormData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: cleanedPhoneNumber,
      emailAddress: data.emailAddress,
      specialRequests: data.specialRequests,
      validId: validIdFile,
      areaId: areaId,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      totalPrice: parseFloat(totalPrice || '0'),
      status: 'pending',
      isVenueBooking: true,
      numberOfGuests: parseInt(data.numberOfGuests)
    };

    setPendingFormData(reservationData);
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!pendingFormData) return;

    setShowConfirmModal(false);
    setIsSubmitting(true);
    setError({});

    try {
      const bookingDate = pendingFormData.startTime ? new Date(pendingFormData.startTime) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isBookingForToday = bookingDate ?
        bookingDate.getFullYear() === today.getFullYear() &&
        bookingDate.getMonth() === today.getMonth() &&
        bookingDate.getDate() === today.getDate() : false;

      if (isAuthenticated && isBookingForToday) {
        try {
          const eligibility = await checkCanBookToday();
          if (!eligibility.canBook) {
            setCanBookToday(false);
            setBookingLimitMessage(eligibility.message || 'You have already made a booking today');
            setError({ general: eligibility.message || 'You have already made a booking today. You can make another booking tomorrow.' });
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          console.error(`Error checking booking eligibility: ${error}`);
        }
      }

      if (!isAuthenticated) {
        setSavedFormData(pendingFormData);
        setShowLoginModal(true);
        setIsSubmitting(false);
        return;
      }

      const response = await createReservation(pendingFormData);
      setSuccess(true);
      setSavedFormData(null);
      navigate(`/booking-accepted?bookingId=${response.id}&isVenue=true`);
    } catch (err: any) {
      console.error(`Error creating venue booking: ${err}`);
      const errorMessage = 'Failed to create venue booking. Please try again.';

      if (err.response && err.response.data && err.response.data.error) {
        if (typeof err.response.data.error === 'string') {
          setError({ general: err.response.data.error });
        } else if (typeof err.response.data.error === 'object') {
          setError(err.response.data.error);
        }
      } else if (err.message) {
        setError({ general: err.message });
      } else {
        setError({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '';

    const date = new Date(dateTimeString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${day}, ${dayOfMonth} ${month}, ${year} at ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const formattedStartTime = formatDateTime(startTime);
  const formattedEndTime = formatDateTime(endTime);

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl mt-16">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">Confirm Area Booking</h1>
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600">Loading area details...</p>
        </div>
      </div>
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
        title="Confirm Your Area Booking"
        description={`You're about to book ${areaData?.area_name} for ${formattedStartTime} to ${formattedEndTime}. The total price is ₱${parseFloat(totalPrice || '0').toLocaleString()}. Would you like to proceed?`}
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
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-lg shadow-xl p-6 backdrop-blur-sm bg-white/90 border border-gray-100"
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
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    {...register("firstName", {
                      required: "First name is required",
                      pattern: {
                        value: /^[A-Za-z\s]+$/,
                        message: "Name should contain only letters and spaces"
                      },
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters long"
                      }
                    })}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.firstName || error.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.firstName &&
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.firstName.message}
                    </motion.p>
                  }
                  {!errors.firstName && error.firstName &&
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
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    {...register("lastName", {
                      required: "Last name is required",
                      pattern: {
                        value: /^[A-Za-z\s]+$/,
                        message: "Name should contain only letters and spaces"
                      },
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters long"
                      }
                    })}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${errors.lastName || error.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.lastName &&
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.lastName.message}
                    </motion.p>
                  }
                  {!errors.lastName && error.lastName &&
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
                <div>
                  <label htmlFor="phoneNumber" className="block text-md font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    {...register("phoneNumber", {
                      required: "Phone number is required",
                      validate: (value) => {
                        const cleaned = value.replace(/[^\d+]/g, '');
                        const localNumber = cleaned.substring(3);
                        if (!cleaned.startsWith('+63') || localNumber.length !== 10 || !localNumber.startsWith('9')) {
                          return "Phone number must be in Philippine format: (+63) 9XX XXX XXXX";
                        }
                        return true;
                      }
                    })}
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+63 9XX XXX XXXX"
                    className={`w-full px-3 py-2 border ${errors.phoneNumber || error.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>}
                  {!errors.phoneNumber && error.phoneNumber && <p className="text-red-500 text-sm mt-1">{error.phoneNumber}</p>}
                  <p className="mt-1 text-xs text-gray-500">Format: +63 9XXX XXX XXX</p>
                </div>

                {/* Number of Guests */}
                <div>
                  <label htmlFor="numberOfGuests" className="block text-md font-medium text-gray-700 mb-1">
                    Number of Guests <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="numberOfGuests"
                    {...register("numberOfGuests", {
                      required: "Number of guests is required",
                      min: {
                        value: 1,
                        message: "At least 1 guest is required"
                      },
                      max: {
                        value: areaData?.capacity || 100,
                        message: `Maximum capacity is ${areaData?.capacity} guests`
                      }
                    })}
                    name="numberOfGuests"
                    value={formData.numberOfGuests}
                    onChange={handleInputChange}
                    min="1"
                    max={areaData?.capacity}
                    className={`w-full px-3 py-2 border ${errors.numberOfGuests || error.numberOfGuests ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.numberOfGuests && <p className="text-red-500 text-sm mt-1">{errors.numberOfGuests.message}</p>}
                  {!errors.numberOfGuests && error.numberOfGuests && <p className="text-red-500 text-sm mt-1">{error.numberOfGuests}</p>}
                  {areaData?.capacity && (
                    <p className="mt-1 text-sm text-gray-500">Max guests: {areaData.capacity} guests</p>
                  )}
                </div>
              </div>

              {/* Valid ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="validId" className="block text-md font-medium text-gray-700 mb-1">
                    Valid ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="validId"
                    {...register("validId", { required: "Valid ID is required" })}
                    name="validId"
                    onChange={handleFileChange}
                    accept="image/*"
                    className={`w-full py-2 ${errors.validId || error.validId ? 'border-red-500' : ''}`}
                  />
                  {errors.validId && <p className="text-red-500 text-sm mt-1">{errors.validId.message}</p>}
                  {!errors.validId && error.validId && <p className="text-red-500 text-sm mt-1">{error.validId}</p>}

                  {/* Valid ID Preview Container */}
                  {validIdPreview && (
                    <div className="mt-2 relative">
                      <div className="relative border rounded-md overflow-hidden" style={{ height: '120px' }}>
                        <img
                          loading='lazy'
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

              {/* Booking Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="startTime" className="block text-md font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="startTime"
                    name="startTime"
                    disabled
                    value={formattedStartTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-md font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="endTime"
                    name="endTime"
                    disabled
                    value={formattedEndTime}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div className="mb-6">
                <label htmlFor="specialRequests" className="block text-md font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  id="specialRequests"
                  {...register("specialRequests")}
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none"
                ></textarea>
              </div>

              {/* Submit Button for Mobile View */}
              <div className="lg:hidden mt-6">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
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
            {/* Venue Information */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <div className="relative mb-4 overflow-hidden rounded-md">
                <motion.img
                  loading='lazy'
                  src={areaData?.area_image}
                  alt={areaData?.area_name || "Venue"}
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
                {areaData?.area_name || "Venue"}
              </motion.h3>

              {/* Additional Venue Details */}
              <motion.div
                className="border-t pt-3 space-y-2 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-semibold">{areaData?.capacity} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">{areaData?.price_per_hour}</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Booking Details */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
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
                  <p className="text-lg text-gray-800 font-semibold">Start:</p>
                  <p className="font-semibold">{formattedStartTime}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-lg text-gray-800 font-semibold">End:</p>
                  <p className="font-semibold">{formattedEndTime}</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Pricing Summary */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
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
                className="border-t pt-3 flex justify-between items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              >
                <span className="font-semibold text-2xl">Total Price:</span>
                <motion.span
                  className="font-bold text-blue-600 text-2xl"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  ₱{parseFloat(totalPrice || '0').toLocaleString()}
                </motion.span>
              </motion.div>
            </motion.div>

            <div className="hidden lg:block">
              <motion.button
                type="submit"
                form="booking-form"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-md text-white text-center text-xl font-semibold flex items-center justify-center ${isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg'
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

export default ConfirmVenueBooking;
