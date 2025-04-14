import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { BookCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import SignupModal from '../components/SignupModal';
import { useUserContext } from '../contexts/AuthContext';
import EventLoader from '../motions/loaders/EventLoader';
import { BookingFormData, createBooking, fetchRoomById } from '../services/Booking';

interface Amenity {
  id: number;
  description: string;
}

interface RoomData {
  id: number;
  room_name: string;
  room_type: string;
  status: string;
  room_price: string;
  room_image: string;
  description: string;
  capacity: string;
  max_guests: number;
  amenities: Amenity[];
}

const ConfirmBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useUserContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [savedFormData, setSavedFormData] = useState(null);

  const { register, handleSubmit: validateForm, formState: { errors } } = useForm();

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
      if (err.response && err.response.data && err.response.data.error) {
        if (typeof err.response.data.error === 'object') {
          setError(err.response.data.error);
        } else {
          setError({ general: err.response.data.error });
        }
      } else {
        setError({ general: 'Failed to create booking. Please try again.' });
      }
      console.error(`Error creating booking: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate, savedFormData, isSubmitting]);

  useEffect(() => {
    if (isAuthenticated && savedFormData && !isSubmitting && !success) {
      handleSuccessfulLogin();
    }
  }, [isAuthenticated, savedFormData, handleSuccessfulLogin, isSubmitting, success]);

  const handleProceedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

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

    if (!formData.emailAddress) {
      newFieldErrors.emailAddress = "Email address is required";
      hasErrors = true;
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.emailAddress)) {
      newFieldErrors.emailAddress = "Invalid email format";
      hasErrors = true;
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

    setError({});

    const bookingData: BookingFormData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      emailAddress: formData.emailAddress,
      specialRequests: formData.specialRequests,
      validId: formData.validId,
      roomId: roomId || '',
      checkIn: selectedArrival,
      checkOut: selectedDeparture,
      status: 'pending',
      totalPrice: calculatedTotalPrice,
      arrivalTime: formData.arrivalTime,
      numberOfGuests: parseInt(formData.numberOfGuests)
    };

    if (!isAuthenticated) {
      setSavedFormData(bookingData);
      setShowLoginModal(true);
    } else {
      setSavedFormData(bookingData);
    }
  };

  const handleFormSubmit = async () => {
    handleProceedClick(new MouseEvent('click') as unknown as React.MouseEvent<HTMLButtonElement>);
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
      <div className="container mx-auto px-4 py-8 max-w-7xl mt-16">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">Confirm Booking</h1>
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!dateSelectionCompleted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl mt-16">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">Select Your Stay Dates</h1>

        {/* Room Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto">
          <div className="flex items-center space-x-4">
            <img
              loading="lazy"
              src={roomData?.room_image}
              alt={roomData?.room_name || "Room"}
              className="w-24 h-24 object-cover rounded-md"
            />
            <div>
              <h2 className="text-xl font-bold">{roomData?.room_name}</h2>
              <p className="text-gray-600">{roomData?.room_type}</p>
              <p className="text-lg font-semibold mt-1">{roomData?.room_price}</p>
            </div>
          </div>
        </div>

        {dateError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded max-w-2xl mx-auto">
            <p>{dateError}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <form onSubmit={handleDateSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="arrival-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="arrival-date"
                  name="arrival-date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  value={selectedArrival}
                  onChange={handleDateChange}
                  min={today}
                />
              </div>
              <div>
                <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="departure-date"
                  name="departure-date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  value={selectedDeparture}
                  onChange={handleDateChange}
                  min={selectedArrival || today}
                />
              </div>
            </div>

            {/* Time of Arrival */}
            <div className="mb-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100"
              />
              <p className="mt-1 text-sm text-gray-500">Please indicate your expected time of arrival</p>
            </div>

            {selectedArrival && selectedDeparture && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div>
                    <span className="text-blue-800 font-medium">Selected Stay:</span>
                    <span className="ml-2 text-blue-700">
                      {format(new Date(selectedArrival), 'MMM dd, yyyy')} to {format(new Date(selectedDeparture), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="text-blue-800 font-medium">Duration:</span>
                    <span className="ml-2 text-blue-700">{nights} day{nights !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-blue-800 font-medium">Estimated Price:</span>
                  <span className="ml-2 text-blue-700 font-semibold">
                    ₱{calculatedTotalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Back to Rooms
              </button>
              <button
                type="submit"
                className={`px-6 py-2 ${!selectedArrival || !selectedDeparture || !!dateError
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={!selectedArrival || !selectedDeparture || !!dateError}
              >
                Continue to Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {isSubmitting && (
        <EventLoader
          text="Processing your booking..."
          size="150px"
          type="reserve"
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl mt-16">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">Confirm Booking</h1>

        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-300 text-blue-800 rounded-lg">
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
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <p>Booking successfully created! You will be redirected to your booking details.</p>
          </div>
        )}

        {error.general && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{error.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <form id="booking-form" onSubmit={validateForm(handleFormSubmit)} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Your details</h2>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
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
                    className={`w-full px-3 py-2 border ${error.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100`}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{error.firstName}</p>}
                </div>
                <div>
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
                    className={`w-full px-3 py-2 border ${error.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100`}
                  />
                  {error.lastName && <p className="text-red-500 text-sm mt-1">{error.lastName}</p>}
                </div>
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
                    {...register("phoneNumber")}
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+63 9XX XXX XXXX"
                    className={`w-full px-3 py-2 border ${error.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100`}
                  />
                  {error.phoneNumber && <p className="text-red-500 text-sm mt-1">{error.phoneNumber}</p>}
                  <p className="mt-1 text-xs text-gray-500">Format: +63 9XX XXX XXXX (Philippine number)</p>
                </div>
                <div>
                  <label htmlFor="emailAddress" className="block text-md font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="emailAddress"
                    {...register("emailAddress")}
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border ${error.emailAddress ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100`}
                  />
                  {error.emailAddress && <p className="text-red-500 text-sm mt-1">{error.emailAddress}</p>}
                </div>
              </div>

              {/* Number of Guests */}
              <div className="mb-4">
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
                    className={`w-full px-3 py-2 border ${error.numberOfGuests ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100`}
                  />
                  {error.numberOfGuests && <p className="text-red-500 text-sm mt-1">{error.numberOfGuests}</p>}
                  {roomData?.max_guests && (
                    <p className="mt-1 text-sm text-blue-600 font-medium">
                      Max. Guests Allowed: {roomData.max_guests}
                    </p>
                  )}
                </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100"
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
                  className={`w-full px-3 py-2 border ${error.arrivalTime ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100`}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 resize-none"
                ></textarea>
              </div>

              {/* Submit Button for Mobile View */}
              <div className="lg:hidden mt-6">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleProceedClick}
                  className={`w-full py-3 px-6 rounded-md text-white text-center cursor-pointer font-semibold ${isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }`}
                >
                  {isSubmitting ? '' : isAuthenticated ? (
                    <>
                      <BookCheck className="w-5 h-5 mr-2" />
                      Complete Booking
                    </>
                  ) : 'Continue to Login'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar - Takes 1/3 width on large screens */}
          <div className="lg:col-span-1">
            {/* Room Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="relative mb-4">
                <img
                  loading="lazy"
                  src={roomData?.room_image}
                  alt={roomData?.room_name || "Room"}
                  className="w-full h-40 object-cover rounded-md"
                />
              </div>
              <h3 className="text-2xl font-semibold mb-4">{roomData?.room_name || "Room"}</h3>

              {/* Amenities */}
              <div className="space-y-2">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Room Amenities</h4>
                {roomData?.amenities && roomData.amenities.length > 0 ? (
                  roomData.amenities.map((amenity) => (
                    <div key={`amenity-${amenity.id}`} className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-md text-gray-600">{amenity.description}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No amenities listed</p>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Your booking details</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-lg text-gray-800 font-semibold">Check-in :</p>
                  <p className="font-semibold">{formattedArrivalDate}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-800 font-semibold">Check-out :</p>
                  <p className="font-semibold">{formattedDepartureDate}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-lg text-gray-800 font-semibold">Arrival Time :</p>
                <p className="font-semibold">
                  {formData.arrivalTime
                    ? new Date(`2000-01-01T${formData.arrivalTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Not specified'}
                </p>
              </div>

              <div className="mb-2">
                <p className="text-md font-medium">{roomData?.room_name || "Deluxe Room"}</p>
                <p className="text-md text-gray-600">{nights} night{nights > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Pricing Summary</h3>
              <div className="text-md mb-2">
                <p className="text-gray-600">1 room x {nights} night{nights > 1 ? 's' : ''}</p>
              </div>
              <div className="text-md mb-4">
                <p className="font-medium">{roomData?.room_name || "Room"}</p>
                <p className="text-lg text-gray-700">
                  {roomData?.room_price} per night
                </p>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold text-2xl">Total Price :</span>
                <span className="font-bold text-blue-600 text-2xl">₱{calculatedTotalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="hidden lg:block">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleProceedClick}
                className={`w-full py-3 px-6 rounded-md text-white text-center text-xl font-semibold flex justify-center items-center ${isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
              >
                {isSubmitting ? '' : isAuthenticated ? (
                  <>
                    <BookCheck className="w-8 h-8 mr-2" />
                    Complete Booking
                  </>
                ) : 'Continue to Login'}
              </button>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 z-50">
            <LoginModal
              toggleLoginModal={() => setShowLoginModal(false)}
              openSignupModal={openSignupModal}
              onSuccessfulLogin={handleSuccessfulLogin}
              bookingInProgress={true}
            />
          </div>
        )}

        {/* Signup Modal */}
        {showSignupModal && (
          <div className="fixed inset-0 bg-black/50 z-50">
            <SignupModal
              toggleRegisterModal={() => setShowSignupModal(false)}
              openLoginModal={openLoginModal}
              onSuccessfulSignup={handleSuccessfulLogin}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ConfirmBooking;