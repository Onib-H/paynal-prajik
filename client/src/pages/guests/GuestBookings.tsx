/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Eye, MessageSquare, Search, XCircle, Calendar, SearchIcon, Filter } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import "react-loading-skeleton/dist/skeleton.css";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import BookingData from "../../components/bookings/BookingData";
import CancellationModal from "../../components/bookings/CancellationModal";
import GuestBookingComment from "../../components/guests/GuestBookingComment";
import { useUserContext } from "../../contexts/AuthContext";
import { BookingDetailsSkeleton } from "../../motions/skeletons/GuestDetailSkeleton";
import { cancelBooking, fetchBookingDetail, fetchUserReviews } from "../../services/Booking";
import { BookingResponse } from "../../types/BookingClient";
import { fetchGuestBookings } from "../../services/Guest";
import { formatStatus, formatDate, getStatusColor } from "../../utils/formatters";
import GuestBookingsSkeleton from "../../motions/skeletons/GuestBookingsSkeleton";
import GuestBookingsError from "../../motions/error-fallback/GuestBookingsError";

const GuestBookings = () => {
  const { userDetails } = useUserContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationBookingId, setCancellationBookingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewBookingDetails, setReviewBookingDetails] = useState<any>(null);

  const queryClient = useQueryClient();
  const pageSize = 5;

  const bookingsQuery = useQuery<{
    data: BookingResponse[],
    pagination?: {
      total_pages: number;
      current_page: number;
      total_items: number;
      page_size: number;
    }
  }, Error>({
    queryKey: ["guest-bookings", userDetails?.id, currentPage, pageSize, filterStatus],
    queryFn: () => fetchGuestBookings({ page: currentPage, page_size: pageSize, status: filterStatus }),
    enabled: !!userDetails?.id,
  });

  const userReviewsQuery = useQuery({
    queryKey: ['userReviews', userDetails?.id],
    queryFn: () => fetchUserReviews(),
    enabled: !!userDetails?.id,
  });

  const bookingDetailsQuery = useQuery({
    queryKey: ['bookingDetails', bookingId],
    queryFn: () => fetchBookingDetail(bookingId || ''),
    enabled: !!bookingId,
  });

  const cancelBookingMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      return cancelBooking(bookingId, reason);
    },
    onSuccess: () => {
      setShowCancelModal(false);
      setCancellationBookingId(null);

      queryClient.invalidateQueries({ queryKey: ['guest-bookings', currentPage, pageSize] });
      toast.success("Booking cancelled successfully!");
    },
    onError: (error: any) => {
      console.error(`Error cancelling booking: ${error}`);
      toast.error("Failed to cancel booking. Please try again.");
    }
  });

  const { bookings, totalPages, isLoading, errorMessage } = useMemo(() => {
    return {
      bookings: bookingsQuery.data?.data || [],
      totalPages: bookingsQuery.data?.pagination?.total_pages || 1,
      isLoading: bookingsQuery.isPending ||
        (bookingDetailsQuery.isPending && !!bookingId) ||
        cancelBookingMutation.isPending,
      errorMessage: bookingsQuery.isError
        ? <GuestBookingsError error={cancelBookingMutation.error} />
        : (bookingDetailsQuery.isError && !!bookingId)
          ? <GuestBookingsError error={bookingDetailsQuery.error} />
          : cancelBookingMutation.isError
            ? <GuestBookingsError error={cancelBookingMutation.error} />
            : null
    };
  }, [
    bookingsQuery.data, bookingsQuery.isPending, bookingsQuery.isError,
    bookingDetailsQuery.isPending, bookingDetailsQuery.isError, bookingId,
    cancelBookingMutation.isPending, cancelBookingMutation.isError, cancelBookingMutation.error, bookingDetailsQuery.error
  ]);

  const filteredBookings = useMemo(() => {
    if (!searchTerm.trim()) return bookings;

    const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return bookings.filter((booking: any) => {
      const propertyName = booking.is_venue_booking
        ? (booking.area_name || booking.area_details?.area_name || '')
        : (booking.room_name || booking.room_details?.room_name || '');

      const propertyType = booking.is_venue_booking
        ? (booking.area_type || booking.area_details?.area_type || '')
        : (booking.room_type || booking.room_details?.room_type || '');

      const reference = (booking.booking_reference || booking.id || '').toString();

      const guestName = (booking.guest_name || booking.guest?.name || '');

      const matchesSearch =
        searchRegex.test(propertyName) ||
        searchRegex.test(propertyType) ||
        searchRegex.test(reference) ||
        searchRegex.test(guestName);

      const matchesStatus = filterStatus
        ? (booking.status || '').toLowerCase() === filterStatus.toLowerCase()
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, filterStatus]);

  const reviewedBookingIds = useMemo(() => {
    const ids: string[] = userReviewsQuery.data?.data?.map((review: any) => review.booking.toString()) || [];
    return new Set(ids);
  }, [userReviewsQuery.data]);

  const handleCancelBooking = useCallback((reason: string) => {
    if (!cancellationBookingId || !reason.trim()) return;

    cancelBookingMutation.mutate({
      bookingId: cancellationBookingId,
      reason: reason
    });
  }, [cancellationBookingId, cancelBookingMutation]);

  const openCancelModal = useCallback((id: string) => {
    setCancellationBookingId(id);
    setShowCancelModal(true);
  }, []);

  const closeCancelModal = useCallback(() => {
    setShowCancelModal(false);
    setCancellationBookingId(null);
  }, []);

  const viewBookingDetails = useCallback((id: string) => {
    searchParams.delete('cancelled');
    searchParams.delete('success');
    searchParams.set('bookingId', id);
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const backToBookingsList = useCallback(() => {
    searchParams.delete('bookingId');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  }, []);

  const openReviewModal = useCallback((booking: any) => {
    setReviewBookingId(booking.id.toString());

    const propertyName = booking.is_venue_booking
      ? (booking.area_name || booking.area_details?.area_name || "Venue")
      : (booking.room_name || booking.room_details?.room_name || "Room");

    setReviewBookingDetails({
      propertyName,
      propertyType: booking.is_venue_booking ? "venue" : "room",
      checkInDate: booking.check_in_date,
      checkOutDate: booking.check_out_date
    });

    setShowReviewModal(true);
  }, []);

  const closeReviewModal = useCallback(() => {
    setShowReviewModal(false);
    setReviewBookingId(null);
    setReviewBookingDetails(null);
  }, []);

  if (isLoading) {
    return (
      bookingId ? <BookingDetailsSkeleton /> : <GuestBookingsSkeleton />
    );
  }

  if (errorMessage) return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>;

  if (bookingId) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 overflow-y-auto h-[calc(100vh-3rem)] pr-2">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 py-3 z-10">
          <h1 className="text-2xl font-bold text-gray-800">Booking Details</h1>
          <button
            onClick={backToBookingsList}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center"
          >
            <span className="mr-2">&larr;</span> Back to Bookings
          </button>
        </div>

        <BookingData bookingId={bookingId} />
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto py-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
        <p className="text-gray-600 text-lg">Manage all your hotel bookings</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search by room name or booking reference..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <div className="flex items-center">
          <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 mr-2">
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={handleStatusChange}
            className="py-2 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reserved">Reserved</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="no_show">No Show</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          {filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Reservation</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking: any) => {
                    const alreadyReviewed = reviewedBookingIds.has(booking.id.toString());
                    const isVenueBooking = booking.is_venue_booking;
                    let itemName, itemImage, totalAmount;

                    if (isVenueBooking) {
                      itemName = booking.area_name || booking.area_details?.area_name || "Venue";
                      itemImage = booking.area_image || booking.area_details?.area_image;

                      const startTime = booking.start_time || booking.check_in_date;
                      const endTime = booking.end_time || booking.check_out_date;
                      let duration = 1;

                      if (startTime && endTime) {
                        try {
                          const start = new Date(startTime);
                          const end = new Date(endTime);
                          const diffTime = Math.abs(end.getTime() - start.getTime());
                          duration = Math.ceil(diffTime / (1000 * 60 * 60)) || 1;
                        } catch (e) {
                          console.error("Error calculating venue duration:", e);
                        }
                      }

                      const venuePrice =
                        parseFloat((booking.price_per_hour || booking.area_details?.price_per_hour || "0")
                          .toString()
                          .replace(/[^0-9.]/g, '')) || 0;

                      totalAmount = booking.total_price || booking.total_amount || (venuePrice * duration);
                    } else {
                      itemName = booking.room_name || booking.room_details?.room_name || "Room";
                      itemImage = booking.room_image || booking.room_details?.room_image;

                      const checkInDate = booking.check_in_date;
                      const checkOutDate = booking.check_out_date;
                      let nights = 1;

                      if (checkInDate && checkOutDate) {
                        try {
                          const checkIn = new Date(checkInDate);
                          const checkOut = new Date(checkOutDate);
                          const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
                          nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                        } catch (e) {
                          console.error("Error calculating room nights:", e);
                        }
                      }

                      const nightlyRate =
                        parseFloat((booking.room_price || booking.room_details?.room_price || "0")
                          .toString()
                          .replace(/[^0-9.]/g, '')) || 0;

                      totalAmount = booking.total_price || booking.total_amount || (nightlyRate * nights);
                    }

                    const checkInDate = booking.check_in_date;
                    const checkOutDate = booking.check_out_date;
                    const status = formatStatus(booking.status);
                    const id = booking.id;
                    const reservationDate = booking.created_at;

                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                loading="lazy"
                                src={itemImage || '/default-room.jpg'}
                                alt={itemName}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-md font-semibold text-gray-900">{itemName}</div>
                              {isVenueBooking ? (
                                <div className="text-md bg-blue-100 text-blue-800 px-2 py-0.5 rounded inline-block mt-1">Venue</div>
                              ) : (
                                <div className="text-md bg-green-100 text-green-800 px-2 py-0.5 rounded inline-block mt-1">Room</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                          {formatDate(reservationDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                          {formatDate(checkInDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                          {formatDate(checkOutDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-md leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-gray-900">
                          {typeof totalAmount === 'number' ? totalAmount.toLocaleString() : totalAmount}
                        </td>
                        <td className="p-2 whitespace-nowrap text-sm text-right font-semibold">
                          <div className="flex justify-center space-x-2">
                            <button
                              className="bg-gray-600 hover:bg-gray-700 uppercase text-white p-2 rounded-full flex items-center cursor-pointer transition-all duration-300"
                              onClick={() => viewBookingDetails(id.toString())}
                            >
                              <Eye size={24} className="pr-1" /> View
                            </button>
                            {booking.status.toLowerCase() === 'pending' && (
                              <button
                                className="bg-red-600 hover:bg-red-700 uppercase text-white p-2 rounded-full flex items-center cursor-pointer transition-all duration-300"
                                onClick={() => openCancelModal(id.toString())}
                              >
                                <XCircle size={24} className="mr-1" /> Cancel
                              </button>
                            )}
                            {booking.status.toLowerCase() === 'checked_out' && (
                              <button
                                disabled={alreadyReviewed}
                                onClick={() => !alreadyReviewed && openReviewModal(booking)}
                                className={`bg-blue-600 text-white p-2 rounded-full flex items-center transition-all duration-300 uppercase ${alreadyReviewed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 cursor-pointer'}`}>
                                <MessageSquare size={24} className="mr-1" />
                                {alreadyReviewed ? 'Reviewed' : 'Review'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-l-md border ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 cursor-pointer hover:bg-purple-50'
                        }`}
                      aria-label="Previous Page"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <div className="text-gray-700 text-lg border rounded-lg p-1 border-purple-600 font-medium">
                      Page <span className="text-purple-600">{currentPage}</span> | <span className="text-purple-600">{totalPages}</span>
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-r-md border ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-purple-600 cursor-pointer hover:bg-purple-50'
                        }`}
                    >
                      <ArrowRight size={20} />
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200
                }}
                className="bg-gray-100 p-4 rounded-full mb-4"
              >
                <Calendar size={50} className="text-purple-500" />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-gray-800 mb-2"
              >
                No Bookings Found
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 max-w-md mb-6"
              >
                {searchTerm || filterStatus ? (
                  <>
                    We couldn't find any bookings matching your search criteria. Try adjusting your filters or search terms.
                  </>
                ) : (
                  <>
                    You don't have any bookings yet. When you make a reservation, it will appear here.
                  </>
                )}
              </motion.p>

              {(searchTerm || filterStatus) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  {searchTerm && (
                    <div className="flex items-center bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
                      <SearchIcon size={18} className="mr-2" />
                      <span>Search: <strong>"{searchTerm}"</strong></span>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-2 text-purple-500 hover:text-purple-700"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {filterStatus && (
                    <div className="flex items-center bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
                      <Filter size={18} className="mr-2" />
                      <span>Status: <strong>{filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</strong></span>
                      <button
                        onClick={() => setFilterStatus("")}
                        className="ml-2 text-purple-500 hover:text-purple-700"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {!searchTerm && !filterStatus && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium shadow-md"
                >
                  Book Now
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <GuestBookingComment
        bookingId={reviewBookingId || ""}
        isOpen={showReviewModal}
        onClose={closeReviewModal}
        bookingDetails={reviewBookingDetails}
      />

      {/* Use the CancellationModal component */}
      <CancellationModal
        isOpen={showCancelModal}
        onClose={closeCancelModal}
        onConfirm={handleCancelBooking}
        bookingId={cancellationBookingId}
        title="Cancel Booking"
        description="Please provide a reason for cancelling this booking. Note that cancellations may be subject to fees according to our cancellation policy."
        reasonLabel="Reason for Cancellation"
        reasonPlaceholder="Enter detailed reason for cancelling this booking..."
        confirmButtonText="Confirm Cancellation"
        showPolicyNote={true}
      />
    </div>
  );
};

export default GuestBookings;