/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { BookCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import Modal from "../components/Modal";
import SignupModal from "../components/SignupModal";
import { useUserContext } from "../contexts/AuthContext";
import EventLoader from "../motions/loaders/EventLoader";
import { checkCanBookToday, createBooking, fetchRoomById } from "../services/Booking";
import { BookingFormData, ConfirmBookingFormValues, RoomData } from "../types/BookingClient";
import { formatTime } from "../utils/formatters";
import GCashPaymentModal from "../components/bookings/GCashPaymentModal";
import GCashLogo from "../assets/GCash-Logo.png"

const ConfirmBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, userDetails } = useUserContext();

  const roomId = searchParams.get("roomId");
  const arrival = searchParams.get("arrival");
  const departure = searchParams.get("departure");
  const priceParam = searchParams.get("totalPrice");

  const today = new Date().toISOString().split("T")[0];

  const [selectedArrival, setSelectedArrival] = useState(arrival || "");
  const [selectedDeparture, setSelectedDeparture] = useState(departure || "");
  const [dateSelectionCompleted, setDateSelectionCompleted] = useState(!!arrival && !!departure);
  const [dateError, setDateError] = useState<string | null>(null);
  const [calculatedTotalPrice, setCalculatedTotalPrice] = useState<number>(priceParam ? parseInt(priceParam) : 0);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);
  const [canBookToday, setCanBookToday] = useState<boolean>(true);
  const [bookingLimitMessage, setBookingLimitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);
  const [validIdPreview, setValidIdPreview] = useState<string | null>(null);
  const [gcashProof, setGcashProof] = useState<File | null>(null);
  const [gcashPreview, setGcashPreview] = useState<string | null>(null);
  const [showGCashModal, setShowGCashModal] = useState<boolean>(false);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const {
    register,
    handleSubmit: validateForm,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<ConfirmBookingFormValues>({
    mode: "onBlur",
    defaultValues: {
      firstName: userDetails.first_name || "",
      lastName: userDetails.last_name || "",
      phoneNumber: "",
      numberOfGuests: 1,
      arrivalTime: "",
      specialRequests: "",
      paymentMethod: 'physical',
    },
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const phoneNumber = watch("phoneNumber");
  const numberOfGuests = watch("numberOfGuests");
  const arrivalTime = watch("arrivalTime");
  const paymentMethod = watch("paymentMethod");

  const { data: roomData, isLoading } = useQuery<RoomData>({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoomById(roomId),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!isLoading && !roomData) setGeneralError("Failed to load room details");
  }, [isLoading, roomData]);

  useEffect(() => {
    if (!roomId) {
      navigate("/");
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
        const priceString = roomData.room_price.replace(/[₱,]/g, "");
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
          console.error(`Error checking booking eligibility: ${error}`);
        }
      };

      checkBookingEligibility();
    }
  }, [isAuthenticated]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setValidIdPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setValidIdPreview(null);
    }
  };

  useEffect(() => {
    return () => {
      if (validIdPreview) URL.revokeObjectURL(validIdPreview);
    };
  }, [validIdPreview]);

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);

    if (!selectedArrival || !selectedDeparture) {
      return setDateError("Please select both dates.");
    }

    if (new Date(selectedDeparture) <= new Date(selectedArrival)) {
      return setDateError("Check-out date must be after check-in date.");
    }

    setDateSelectionCompleted(true);
  };

  const onSubmit: SubmitHandler<ConfirmBookingFormValues> = (data) => {
    console.table({
      ...data
    });
    setGeneralError(null);
    if (isSubmitting) return;
    if (isAuthenticated && !canBookToday) {
      setGeneralError(bookingLimitMessage || "Booking limit reached");
      return;
    }

    const booking: BookingFormData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      validId: data.validId[0],
      specialRequests: data.specialRequests,
      roomId: roomId!,
      checkIn: selectedArrival,
      checkOut: selectedDeparture,
      arrivalTime: data.arrivalTime,
      numberOfGuests: data.numberOfGuests,
      totalPrice: calculatedTotalPrice,
      paymentMethod: data.paymentMethod,
      paymentProof: gcashProof
    };
    setPendingFormData(booking);
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!pendingFormData) return;

    if (paymentMethod === 'gcash') {
      if (!gcashProof) {
        setGeneralError('Please upload your GCash payment proof');
        return;
      }
      if (typeof gcashProof === 'string') {
        setGeneralError('Please upload a valid file.');
        return;
      }
    }

    setShowConfirmModal(false);
    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const arrDate = new Date(pendingFormData.checkIn);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      if (isAuthenticated && arrDate.getTime() === todayStart.getTime()) {
        const res = await checkCanBookToday();
        if (!res.canBook) {
          setGeneralError(res.message || "Booking limit reached.");
          setCanBookToday(false);
          setIsSubmitting(false);
          return;
        }
      }
      if (!isAuthenticated) {
        setShowLoginModal(true);
        setIsSubmitting(false);
        return;
      }
      const response = await createBooking(pendingFormData);
      setSuccess(true);
      navigate(`/booking-accepted?bookingId=${response.id}&isVenue=false`);
    } catch (err: any) {
      setGeneralError(err?.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nights =
    selectedArrival && selectedDeparture
      ? Math.ceil(
        (new Date(selectedDeparture).getTime() -
          new Date(selectedArrival).getTime()) /
        (1000 * 60 * 60 * 24)
      )
      : 1;
  const formattedArrival = selectedArrival
    ? format(new Date(selectedArrival), "EEE, d MMM, yyyy")
    : "";
  const formattedDeparture = selectedDeparture
    ? format(new Date(selectedDeparture), "EEE, d MMM, yyyy")
    : "";

  useEffect(() => {
    document.body.style.overflow = isSubmitting ? "hidden" : "auto";
  }, [isSubmitting]);

  if (isLoading) {
    return (
      <motion.div
        className="container mx-auto py-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h1 className="text-3xl font-bold mb-6">Confirm Booking</h1>
        <EventLoader text="Loading room details..." type="reserve" />
      </motion.div>
    );
  }

  if (!dateSelectionCompleted) {
    return (
      <motion.div
        className="container mx-auto px-4 py-8 max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h1 className="text-2xl font-bold text-center mb-8">
          Select Your Stay Dates
        </h1>
        {dateError && <p className="text-red-500 mb-4">{dateError}</p>}
        <form onSubmit={handleDateSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="date"
              value={selectedArrival}
              onChange={(e) => {
                setSelectedArrival(e.target.value);
                setDateError(null);
              }}
              min={today}
              required
              className="w-full"
            />
            <input
              type="date"
              value={selectedDeparture}
              onChange={(e) => {
                setSelectedDeparture(e.target.value);
                setDateError(null);
              }}
              min={selectedArrival || today}
              required
              className="w-full"
            />
          </div>
          <button
            type="submit"
            disabled={!selectedArrival || !selectedDeparture}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Continue to Booking
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isSubmitting && (
          <EventLoader text="Processing your booking..." type="reserve" />
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <Modal
        icon="fa-solid fa-book"
        title="Confirm Your Room Booking"
        description={`You're about to book ${roomData?.room_name || "this room"
          } for ${nights} night${nights !== 1 ? "s" : ""
          }. The total price is ₱${calculatedTotalPrice.toLocaleString()}. Would you like to proceed?`}
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

      <GCashPaymentModal
        isOpen={showGCashModal}
        onClose={() => {
          setShowGCashModal(false);
          if (!gcashProof) {
            setValue('paymentMethod', 'physical');
            trigger('paymentMethod');
          }
        }}
        onProofSubmit={(file, preview) => {
          setGcashProof(file);
          setGcashPreview(preview);
          setValue('paymentMethod', 'gcash', { shouldValidate: true });
        }}
        initialPreview={gcashPreview}
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
                  <svg
                    className="h-5 w-5 text-yellow-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Booking Limit Reached
                  </h3>
                  <p className="text-sm mt-1">
                    {bookingLimitMessage ||
                      "You have already made a booking today. You can make another booking tomorrow."}
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
                  <svg
                    className="h-5 w-5 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Login Required
                  </h3>
                  <p className="text-sm mt-1">
                    You'll need to log in or create an account to complete your
                    booking. Don't worry - your booking information will be
                    saved during the process.
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
              <p>
                Booking successfully created! You will be redirected to your
                booking details.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {generalError && (
            <motion.div
              className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <p>{generalError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - Takes 2/3 width on large screens */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <motion.form
              id="booking-form"
              onSubmit={validateForm(onSubmit)}
              className="rounded-lg shadow-xl p-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              whileHover={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h2
                className="text-xl font-semibold mb-4 text-blue-800"
                variants={itemVariants}
              >
                Enter Your Booking Details
              </motion.h2>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="firstName"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                    className={`w-full px-3 py-2 border ${errors.firstName ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.firstName && (
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.firstName.message}
                    </motion.p>
                  )}
                </motion.div>
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="lastName"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                    className={`w-full px-3 py-2 border ${errors.lastName ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.lastName && (
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.lastName.message}
                    </motion.p>
                  )}
                </motion.div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    {...register("phoneNumber", {
                      required: "Phone number is required",
                      validate: (value) => {
                        const cleanedValue = value.replace(/[^\d+]/g, "");
                        const phPattern = /^(\+639\d{9}|09\d{9})$/;
                        if (!phPattern.test(cleanedValue)) return "Phone number must be a Philippine number.";
                        return true;
                      }
                    })}
                    className={`w-full px-3 py-2 border ${errors.phoneNumber ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                  />
                  {errors.phoneNumber && (
                    <motion.p
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {errors.phoneNumber.message}
                    </motion.p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be a PH phone number (e.g., +639XXXXXXXXX or 09XXXXXXXXX)
                  </p>
                </motion.div>
                {/* Number of Guests */}
                <motion.div variants={itemVariants}>
                  <label
                    htmlFor="numberOfGuests"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    Number of Guest(s) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col">
                    <input
                      type="number"
                      id="numberOfGuests"
                      min={1}
                      {...register("numberOfGuests", {
                        required: "Please specify number of guests",
                        min: { value: 1, message: "At least 1 guest" },
                        max: {
                          value: roomData?.max_guests,
                          message: `Max ${roomData?.max_guests} guests only.`,
                        },
                      })}
                      className={`w-full px-3 py-2 border ${errors.numberOfGuests
                        ? "border-red-500"
                        : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300`}
                    />
                    {errors.numberOfGuests && (
                      <motion.p
                        className="text-red-500 text-sm mt-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {errors.numberOfGuests.message}
                      </motion.p>
                    )}
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
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="validId"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
                    Valid ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="validId"
                    accept="image/*"
                    {...register("validId", {
                      required: "Please upload a valid ID",
                      onChange: onFileChange,
                    })}
                    className={`w-full py-2 border pl-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all duration-300 ${errors.validId ? "border-red-500" : "border-gray-300"}`}
                  />

                  {errors.validId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.validId.message}
                    </p>
                  )}

                  {/* Valid ID Preview Container */}
                  {validIdPreview && (
                    <div className="mt-2 relative">
                      <div className="relative overflow-hidden">
                        <img
                          loading="lazy"
                          src={validIdPreview}
                          alt="ID Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setValidIdPreview(null)}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        aria-label="Remove image"
                      >
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Check-in/out Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="checkIn"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="checkOut"
                    className="block text-md font-medium text-gray-700 mb-1"
                  >
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
                <label
                  htmlFor="arrivalTime"
                  className="block text-md font-medium text-gray-700 mb-1"
                >
                  Expected Time of Arrival
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="arrivalTime"
                  min="7:00"
                  max="11:00"
                  {...register("arrivalTime", {
                    required: "Please specify your expected time of arrival",
                    validate: (val) => {
                      const [hourStr, minuteStr] = val.split(":");
                      const hour = parseInt(hourStr, 10);
                      const minute = parseInt(minuteStr, 10);

                      const totalMinutes = hour * 60 + minute;
                      const minAllowed = 7 * 60;
                      const maxAllowed = 23 * 60;

                      if (totalMinutes < minAllowed)
                        return "Arrival cannot be before 7:00 AM";
                      if (totalMinutes > maxAllowed)
                        return "Arrival cannot be after 11:00 PM";

                      return true;
                    },
                  })}
                  className={`w-full px-3 py-2 border ${errors.arrivalTime ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50`}
                />
                {errors.arrivalTime && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.arrivalTime.message}
                  </p>
                )}
                <small className="mt-1 text-xs text-gray-500">
                  Available between 7:00 AM and 11:00 PM
                </small>
              </div>

              {/* Special Requests */}
              <div className="mb-6">
                <label
                  htmlFor="specialRequests"
                  className="block text-md font-medium text-gray-700 mb-1"
                >
                  Special requests to hotel
                </label>
                <textarea
                  id="specialRequests"
                  {...register("specialRequests")}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 resize-none"
                ></textarea>
              </div>

              {/* Submit Button for Mobile View */}
              <div className="lg:hidden mt-6">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className={`w-full py-3 px-6 rounded-md text-white text-center cursor-pointer font-semibold ${isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                    }`}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{
                    boxShadow:
                      "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  {isSubmitting ? (
                    ""
                  ) : isAuthenticated ? (
                    <div className="flex items-center justify-center">
                      <BookCheck className="w-5 h-5 mr-2" />
                      Complete Booking
                    </div>
                  ) : (
                    "Continue to Login"
                  )}
                </motion.button>
              </div>
            </motion.form>
          </motion.div>

          {/* Sidebar - Takes 1/3 width on large screens */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            {/* Room Information */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              whileHover={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
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
                <h4 className="text-md font-semibold text-gray-700 mb-2">
                  Room Amenities
                </h4>
                {roomData?.amenities && roomData.amenities.length > 0 ? (
                  roomData.amenities.map((amenity, index) => (
                    <motion.div
                      key={`amenity-${amenity.id}`}
                      className="flex items-center"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <svg
                        className="w-4 h-4 mr-2 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-md text-gray-600">
                        {amenity.description}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No amenities listed</p>
                )}
              </motion.div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent">Payment Method</h3>
              <div className="space-y-3">
                {/* Physical Payment Option */}
                <div
                  className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${paymentMethod === 'physical'
                    ? 'border-2 border-blue-500 bg-blue-50'
                    : 'border border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => {
                    setValue('paymentMethod', 'physical');
                    setGcashProof(null);
                    setGcashPreview(null);
                    trigger('paymentMethod');
                  }}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${paymentMethod === 'physical'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-400'
                    }`}>
                    {paymentMethod === 'physical' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-medium">Physical Payment</span>
                  {paymentMethod === 'physical' && (
                    <BookCheck className="w-5 h-5 ml-2 text-green-500" />
                  )}
                </div>

                {/* GCash Payment Option */}
                <div
                  className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${paymentMethod === 'gcash'
                    ? 'border-2 border-blue-500 bg-blue-50'
                    : 'border border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => {
                    if (!gcashProof) setShowGCashModal(true);
                    else {
                      setValue('paymentMethod', 'gcash');
                      trigger('paymentMethod');
                    }
                  }}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${paymentMethod === 'gcash'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-400'
                    }`}>
                    {paymentMethod === 'gcash' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">
                      <img src={GCashLogo} alt={GCashLogo} width={100} height={100} />
                    </span>
                  </div>
                  {gcashPreview && paymentMethod === 'gcash' && (
                    <BookCheck className="w-5 h-5 ml-2 text-green-500" />
                  )}
                  {gcashProof && (
                    <button
                      type="button"
                      className="text-blue-600 cursor-pointer hover:text-blue-800 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGcashProof(null);
                        setGcashPreview(null);
                        setValue('paymentMethod', 'physical');
                        trigger('paymentMethod');
                      }}
                    >
                      Remove proof
                    </button>
                  )}
                </div>
              </div>

              <input
                type="hidden"
                {...register('paymentMethod', {
                  required: 'Payment method is required',
                })}
              />
            </motion.div>

            {/* Booking Details */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              variants={itemVariants}
              whileHover={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h3
                className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your Booking Details
              </motion.h3>
              <div className="grid grid-cols-1 gap-2 mb-2">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Name: <span className="font-semibold">{firstName} {lastName}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Phone Number: <span className="font-semibold">{phoneNumber}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Number of Guest(s): <span className="font-semibold">{numberOfGuests} {numberOfGuests <= 1 ? "guest" : "guests"}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Check-in: <span className="font-semibold">{formattedArrival}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Check-out: <span className="font-semibold">{formattedDeparture}</span>
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg text-gray-800">
                    Arrival Time: <span className="font-semibold">{arrivalTime ? formatTime(arrivalTime) : "Not specified"}</span>
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Pricing Summary */}
            <motion.div
              className="rounded-lg shadow-md p-6 mb-6 backdrop-blur-sm bg-white/90 border border-gray-100"
              variants={itemVariants}
              whileHover={{
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
            >
              <motion.h3
                className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent"
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
                <p className="text-gray-600">
                  1 room x {nights} night{nights > 1 ? "s" : ""}
                </p>
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
                onClick={() => validateForm(onSubmit)()}
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-md text-white text-center text-xl font-semibold flex justify-center items-center ${isSubmitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                  }`}
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
                whileHover={{
                  boxShadow:
                    "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -4px rgba(59, 130, 246, 0.3)",
                }}
              >
                {isSubmitting ? (
                  ""
                ) : isAuthenticated ? (
                  <>
                    <BookCheck className="w-8 h-8 mr-2" />
                    Complete Booking
                  </>
                ) : (
                  "Continue to Login"
                )}
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
                openSignupModal={() => setShowSignupModal(true)}
                onSuccessfulLogin={handleConfirmBooking}
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
                openLoginModal={() => setShowLoginModal(true)}
                onSuccessfulSignup={handleConfirmBooking}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default ConfirmBooking;
