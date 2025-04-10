/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  IdCard,
  Search,
  X
} from "lucide-react";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import CancellationModal from "../../components/bookings/CancellationModal";
import Modal from "../../components/Modal";
import EventLoader from "../../motions/loaders/EventLoader";
import { getAllBookings, recordPayment, updateBookingStatus } from "../../services/Admin";
import { BookingResponse } from "../../services/Booking";
import { formatDate } from "../../utils/formatters";

const BookingStatusBadge: FC<{ status: string }> = ({ status }) => {
  let bgColor = "";
  const formattedStatus = status.toUpperCase();

  switch (status.toLowerCase()) {
    case "pending":
      bgColor = "bg-yellow-100 text-yellow-800";
      break;
    case "reserved":
      bgColor = "bg-green-100 text-green-800";
      break;
    case "confirmed":
      bgColor = "bg-green-100 text-green-800";
      break;
    case "checked_in":
      bgColor = "bg-blue-100 text-blue-800";
      break;
    case "checked_out":
      bgColor = "bg-gray-100 text-gray-800";
      break;
    case "cancelled":
      bgColor = "bg-red-100 text-red-800";
      break;
    case "rejected":
      bgColor = "bg-red-100 text-red-800";
      break;
    case "no_show":
      bgColor = "bg-purple-100 text-purple-800";
      break;
    default:
      bgColor = "bg-gray-100 text-gray-800";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${bgColor}`}>
      {formattedStatus.replace("_", " ")}
    </span>
  );
};

const getBookingPrice = (booking: BookingResponse): number => {
  try {
    if (booking.total_price) {
      const totalPrice = typeof booking.total_price === 'string'
        ? parseFloat(booking.total_price.replace(/[^\d.]/g, ''))
        : booking.total_price;
      return totalPrice || 0;
    }

    let basePrice = 0;

    if (booking.is_venue_booking && booking.area_details) {
      if (booking.area_details.price_per_hour) {
        const priceString = booking.area_details.price_per_hour;
        basePrice = parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;
      }
      return basePrice;
    } else if (!booking.is_venue_booking && booking.room_details) {
      const checkIn = booking.check_in_date;
      const checkOut = booking.check_out_date;
      let nights = 1;
      if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        nights = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
      }

      if (booking.room_details.room_price) {
        const priceString = booking.room_details.room_price;
        basePrice = parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;
      }

      return basePrice * nights;
    }

    return basePrice;
  } catch (error) {
    console.error('Error parsing booking price:', error);
    return 0;
  }
};

const BookingDetailsModal: FC<{
  booking: BookingResponse | null;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onCheckIn?: (paymentAmount: number) => void;
  onCheckOut?: () => void;
  onNoShow?: () => void;
  canManage: boolean;
  isUpdating: boolean;
}> = ({ booking, onClose, onConfirm, onReject, onCheckIn, onCheckOut, onNoShow, canManage, isUpdating }) => {
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  if (!booking) return null;

  const isVenueBooking = booking.is_venue_booking;

  const renderValidId = () => {
    if (!booking.valid_id) {
      return (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No valid ID uploaded</p>
        </div>
      );
    }

    return (
      <div className="border rounded-md overflow-hidden">
        <img
          src={booking.valid_id}
          alt="Valid ID"
          loading="lazy"
          className="w-full h-auto"
        />
      </div>
    );
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(e.target.value);
  };

  const bookingPrice = getBookingPrice(booking);
  const currentPayment = parseFloat(paymentAmount) || 0;
  const isPaymentComplete = currentPayment === bookingPrice;
  const isReservedStatus = booking.status === "reserved";

  // Get appropriate loading text based on booking status
  const getLoadingText = () => {
    if (booking.status === "pending") {
      return "Reserving booking...";
    } else if (booking.status === "reserved") {
      return "Checking in guest...";
    } else if (booking.status === "checked_in") {
      return "Checking out guest...";
    } else if (booking.status === "no_show") {
      return "Marking as no-show...";
    }
    return "Processing booking...";
  };

  // Get appropriate loader type based on booking status
  const getLoaderType = () => {
    if (booking.status === "pending") {
      return "reserve";
    } else if (booking.status === "reserved") {
      return "checkin";
    } else if (booking.status === "checked_in") {
      return "checkout";
    } else if (booking.status === "no_show") {
      return "noshow";
    }
    return "default";
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {isUpdating ? (
        <div className="flex items-center justify-center w-full h-full">
          <EventLoader
            text={getLoadingText()}
            size="150px"
            type={getLoaderType() as "default" | "reserve" | "checkin" | "checkout" | "noshow"}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto p-4 sm:p-6 relative overflow-hidden border border-gray-200"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors z-10"
          >
            <X size={24} />
          </motion.button>

          <motion.h2
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-xl sm:text-2xl font-bold mb-4 text-center pb-2 border-b bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            User Booking Details
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg shadow-inner">
              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Full Name:</span>
                <span className="sm:text-right">{booking.user?.first_name} {booking.user?.last_name}</span>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Email:</span>
                <span className="sm:text-right break-words">{booking.user?.email}</span>
              </motion.div>

              {booking.user?.address && (
                <motion.div
                  className="flex flex-col sm:flex-row justify-between sm:col-span-2 p-2 rounded-md"
                >
                  <span className="font-semibold text-gray-700">Address:</span>
                  <span className="sm:text-right">{booking.user?.address}</span>
                </motion.div>
              )}

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Property Type:</span>
                <span>
                  {isVenueBooking ? (
                    <span className="bg-blue-100 text-blue-800 px-2 uppercase py-1 rounded-full text-md font-semibold">Venue</span>
                  ) : (
                    <span className="bg-green-100 text-green-800 px-2 uppercase py-1 rounded-full text-md font-semibold">Room</span>
                  )}
                </span>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">{isVenueBooking ? "Venue:" : "Room:"}</span>
                <span className="sm:text-right font-medium">{isVenueBooking
                  ? (booking.area_details?.area_name || "Unknown Venue")
                  : (booking.room_details?.room_name || "Unknown Room")}
                </span>
              </motion.div>

              {isVenueBooking && booking.area_details?.capacity && (
                <motion.div
                  className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                >
                  <span className="font-semibold text-gray-700">Capacity:</span>
                  <span>{booking.area_details.capacity} people</span>
                </motion.div>
              )}

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Date of Reservation:</span>
                <span>{formatDate(booking.created_at)}</span>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Check-in:</span>
                <span>
                  {isVenueBooking
                    ? `${formatDate(booking.check_in_date)} 8:00 AM`
                    : formatDate(booking.check_in_date)}
                </span>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Check-out:</span>
                <span>
                  {isVenueBooking
                    ? `${formatDate(booking.check_out_date)} 5:00 PM`
                    : formatDate(booking.check_out_date)}
                </span>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Price:</span>
                <span className="font-medium">
                  {isVenueBooking
                    ? booking.area_details?.price_per_hour
                    : booking.room_details?.room_price}
                  <span className="text-gray-500 text-sm">{isVenueBooking ? '/hour' : '/night'}</span>
                </span>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Duration:</span>
                <span className="font-medium">
                  {(() => {
                    try {
                      const checkIn = new Date(booking.check_in_date);
                      const checkOut = new Date(booking.check_out_date);
                      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());

                      if (isVenueBooking) {
                        if (checkIn.toDateString() === checkOut.toDateString()) {
                          return "9 hours (8AM - 5PM)";
                        }
                        const hours = Math.max(Math.ceil(diffTime / (1000 * 60 * 60)), 1);
                        return `${hours} hour${hours !== 1 ? 's' : ''}`;
                      } else {
                        const nights = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
                        return `${nights} night${nights !== 1 ? 's' : ''}`;
                      }
                    } catch (error) {
                      console.error('Error calculating duration:', error);
                      return isVenueBooking ? '9 hours (8AM - 5PM)' : '1 night';
                    }
                  })()}
                </span>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Total Amount:</span>
                <span className="font-bold text-indigo-600">
                  ₱{bookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
              >
                <span className="font-semibold text-gray-700">Status:</span>
                <BookingStatusBadge status={booking.status} />
              </motion.div>
            </div>

            {isReservedStatus && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm"
              >
                <h3 className="font-semibold mb-2 text-blue-800 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Payment Details
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">₱</span>
                    </div>
                    <motion.input
                      whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmount}
                      onChange={handlePaymentChange}
                      placeholder={`Enter amount (${bookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                      className="w-full pl-10 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-sm"
                >
                  {currentPayment > 0 && (
                    <p className={isPaymentComplete ? "text-green-600 flex items-center" : "text-red-600 flex items-center"}>
                      {isPaymentComplete
                        ? <><CheckCircle2 className="w-4 h-4 mr-1" /> Payment amount matches the required total.</>
                        : <><AlertCircle className="w-4 h-4 mr-1" /> Payment must be exactly ₱{bookingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to check in the guest.</>}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Valid ID Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
                <IdCard className="w-4 h-4 mr-2" />
                Valid ID:
              </h3>
              {renderValidId()}
            </motion.div>

            {isVenueBooking && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm"
              >
                <h3 className="font-semibold mb-2 text-blue-800 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Venue Booking Note
                </h3>
                <p className="text-sm text-blue-700">
                  Standard venue bookings are scheduled from 8:00 AM to 5:00 PM (9 hours) on the selected date.
                  {booking.check_in_date !== booking.check_out_date && " This booking spans multiple days."}
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Action Buttons */}
          {canManage && booking.status === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-between gap-2 mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "#dc2626" }}
                whileTap={{ scale: 0.98 }}
                onClick={onReject}
                className="px-4 py-2 bg-red-600 text-white rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <X size={18} />
                Reject Booking
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Check size={18} />
                Reserve Booking
              </motion.button>
            </motion.div>
          )}

          {canManage && booking.status === "reserved" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-between gap-2 mt-6"
            >
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onNoShow}
                className="px-4 py-2 bg-amber-600 text-white rounded-md flex items-center justify-center gap-2 shadow-sm"
              >
                <X size={18} />
                Mark as No Show
              </motion.button>
              <motion.button
                whileTap={isPaymentComplete ? { scale: 0.98 } : {}}
                onClick={() => onCheckIn && isPaymentComplete && onCheckIn(currentPayment)}
                className={`px-4 py-2 text-white rounded-md flex items-center justify-center gap-2 shadow-sm ${isPaymentComplete
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
                  }`}
                disabled={!isPaymentComplete}
              >
                <Check size={18} />
                Check In Guest
              </motion.button>
            </motion.div>
          )}

          {canManage && booking.status === "checked_in" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center mt-6"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCheckOut}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Check size={18} />
                Check Out Guest
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const ManageBookings: FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 9;

  const { data: bookingsResponse, error } = useQuery<{
    data: BookingResponse[],
    pagination?: {
      total_pages: number;
      current_page: number;
      total_items: number;
      page_size: number;
    }
  }, Error>({
    queryKey: ["admin-bookings", currentPage, pageSize],
    queryFn: async () => {
      try {
        const response = await getAllBookings({ page: currentPage, pageSize });
        return response;
      } catch (err) {
        console.error(`Error fetching admin bookings: ${err}`);
        throw err;
      }
    },
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
      reason,
      paymentAmount,
      setRoomAvailable = false
    }: {
      bookingId: number;
      status: string;
      reason?: string;
      paymentAmount?: number;
      setRoomAvailable?: boolean;
    }) => {
      const data: Record<string, any> = {
        status,
        set_available: setRoomAvailable
      };

      if ((status === 'cancelled' || status === 'rejected') && reason) {
        data.reason = reason;
      }

      const result = await updateBookingStatus(bookingId, data);

      if (status === 'checked_in' && paymentAmount) {
        try {
          await recordPayment(bookingId, paymentAmount);
        } catch (error) {
          console.error('Failed to record payment:', error);
        }
      }

      return { result, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      const { status } = data;

      if (status === 'reserved') {
        toast.success("Booking has been reserved successfully! A confirmation email has been sent to the guest.");
      } else if (status === 'rejected') {
        toast.success("Booking has been rejected. The guest has been notified with your reason.");
      } else if (status === 'checked_in') {
        toast.success("Guest has been checked in successfully and payment recorded.");
      } else if (status === 'checked_out') {
        toast.success("Guest has been checked out successfully.");
      } else if (status === 'no_show') {
        toast.success("Booking has been marked as 'No Show' and the room/area has been made available again.");
      } else {
        toast.success(`Booking status updated to ${status.replace('_', ' ')}`);
      }

      setSelectedBooking(null);
      setShowRejectionModal(false);
    },
    onError: (error) => {
      toast.error(`Failed to update booking: ${error}`);
      setShowRejectionModal(false);
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleViewBooking = async (booking: BookingResponse) => {
    try {
      setSelectedBooking(booking);
    } catch (error) {
      console.error(`Error fetching booking details: ${error}`);
      toast.error("Failed to fetch booking details");
    }
  };

  const handleConfirmBooking = () => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: "reserved",
        setRoomAvailable: false
      });
    }
  };

  const handleCheckIn = (paymentAmount?: number) => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: "checked_in",
        paymentAmount
      });
    }
  };

  const handleCheckOut = () => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: "checked_out",
      });
    }
  };

  const handleNoShow = () => {
    if (selectedBooking) setShowNoShowModal(true);
  };

  const confirmNoShow = () => {
    if (selectedBooking) {
      try {
        updateBookingStatusMutation.mutate({
          bookingId: selectedBooking.id,
          status: "no_show",
          setRoomAvailable: true
        });
        setShowNoShowModal(false);
      } catch (error) {
        console.error("Error marking booking as no-show:", error);
        toast.error("Failed to mark booking as no-show. Please try again.");
        setShowNoShowModal(false);
      }
    }
  };

  const closeNoShowModal = () => setShowNoShowModal(false);

  const handleRejectInitiate = () => setShowRejectionModal(true);

  const handleRejectConfirm = (reason: string) => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: "rejected",
        reason: reason
      });
      setShowRejectionModal(false);
    }
  };

  const closeModal = () => setSelectedBooking(null);

  const closeRejectionModal = () => setShowRejectionModal(false);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);

  const totalPages = bookingsResponse?.pagination?.total_pages || 1;
  const filteredBookings = (bookingsResponse?.data || []).filter((booking) => {
    const guestName = `${booking.user?.first_name || ''} ${booking.user?.last_name || ''}`.toLowerCase();
    const email = booking.user?.email?.toLowerCase() || '';

    const propertyName = booking.is_venue_booking
      ? booking.area_details?.area_name?.toLowerCase() || ''
      : booking.room_details?.room_name?.toLowerCase() || '';

    const searchMatch = searchTerm === '' ||
      guestName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      propertyName.includes(searchTerm.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      booking.status?.toLowerCase() === statusFilter.toLowerCase();

    return searchMatch && statusMatch;
  });

  return (
    <div className="min-h-[calc(100vh-25px)] p-3 md:p-3 overflow-y-auto container mx-auto">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6">Manage Bookings</h1>

      {error && <div className="mb-4 text-red-600 p-3 bg-red-50 rounded-lg">{error.message}</div>}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3">
        <div className="relative w-full md:w-1/3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search by Guest Name"
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 p-2.5 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="relative w-full md:w-1/3">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Filter size={18} className="text-gray-500" />
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="pl-10 p-2.5 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reserved">Reserved</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="py-2 md:py-3 px-2 md:px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="py-2 md:py-3 px-2 md:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="py-2 md:py-3 px-2 md:px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => {
                  const isVenueBooking = booking.is_venue_booking;
                  const propertyName = isVenueBooking
                    ? booking.area_details?.area_name || "Unknown Venue"
                    : booking.room_details?.room_name || "Unknown Room";

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm md:text-base text-gray-700 whitespace-nowrap">
                        {formatDate(booking.created_at)}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm md:text-base text-gray-700 whitespace-nowrap">
                        {`${booking.user?.first_name || ''} ${booking.user?.last_name || ''}`}
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-base text-gray-700 whitespace-nowrap">
                        {booking.user?.email || ''}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm md:text-base text-gray-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[120px] md:max-w-full">{propertyName}</span>
                          {isVenueBooking ? (
                            <span className="inline-block px-2 py-0.5 mt-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Venue</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 mt-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Room</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-base text-gray-700 whitespace-nowrap">
                        {formatDate(booking.check_in_date)}
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-base text-gray-700 whitespace-nowrap">
                        {formatDate(booking.check_out_date)}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-center text-sm md:text-base text-gray-700 whitespace-nowrap">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-center text-base text-gray-700 whitespace-nowrap">
                        ₱ {getBookingPrice(booking).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleViewBooking(booking)}
                            className="p-1 md:p-1.5 bg-blue-100 cursor-pointer text-blue-600 rounded-md hover:bg-blue-200"
                            title="View Details"
                          >
                            <Eye size={20} className="md:w-6 md:h-6" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 md:mt-6">
          <nav className="flex items-center flex-wrap justify-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 md:px-3 py-1 rounded-l-md border ${currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (window.innerWidth < 768) {
                  return Math.abs(page - currentPage) < 2 || page === 1 || page === totalPages;
                }
                return true;
              })
              .map((page, index, array) => (
                <>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 py-1 border-t border-b">...</span>
                  )}
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2 md:px-3 py-1 border-t border-b ${currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {page}
                  </button>
                </>
              ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 md:px-3 py-1 rounded-r-md border ${currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={closeModal}
          onConfirm={handleConfirmBooking}
          onReject={handleRejectInitiate}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onNoShow={handleNoShow}
          canManage={true}
          isUpdating={updateBookingStatusMutation.isPending}
        />
      )}

      {/* Use CancellationModal instead of RejectionReasonModal */}
      {showRejectionModal && (
        <CancellationModal
          isOpen={showRejectionModal}
          onClose={closeRejectionModal}
          onConfirm={handleRejectConfirm}
          bookingId={selectedBooking?.id}
          title="Reject Booking"
          description="Please provide a reason for rejecting this booking. This will be shared with the guest."
          reasonLabel="Reason for Rejection"
          reasonPlaceholder="Enter detailed reason for rejecting this booking..."
          confirmButtonText="Confirm Rejection"
          showPolicyNote={false}
        />
      )}

      {/* No Show Confirmation Modal */}
      <Modal
        isOpen={showNoShowModal}
        title="Mark as No Show"
        description={`Are you sure you want to mark this booking as 'No Show'? 
        This will immediately make the ${selectedBooking?.is_venue_booking ? 'venue' : 'room'} available for new bookings.
        This action cannot be undone.`}
        confirmText="Mark as No Show"
        cancelText="Cancel"
        onConfirm={confirmNoShow}
        cancel={closeNoShowModal}
        className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold transition-all duration-300 cursor-pointer"
      />
    </div>
  );
};

export default ManageBookings;
