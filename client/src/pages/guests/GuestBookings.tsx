/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, MessageSquare, Search, XCircle } from "lucide-react";
import { FC, useCallback, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import BookingData from "../../components/bookings/BookingData";
import CancellationModal from "../../components/bookings/CancellationModal";
import GuestBookingComment from "../../components/guests/GuestBookingComment";
import { useUserContext } from "../../contexts/AuthContext";
import { cancelBooking, fetchBookingDetail, fetchUserBookings } from "../../services/Booking";
import { getGuestBookings } from "../../services/Guest";

const formatStatus = (status: string): string => {
  return status.toUpperCase().replace(/_/g, ' ');
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';

  try {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error(`Error formatting date: ${dateString}`, e);
    return dateString;
  }
};

const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase().replace(/_/g, ' ');

  switch (normalizedStatus) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'reserved':
      return 'bg-green-100 text-green-800';
    case 'checked in':
      return 'bg-blue-100 text-blue-800';
    case 'checked out':
      return 'bg-gray-100 text-gray-800';
    case 'no show':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Skeleton loader component for the bookings table
const BookingsTableSkeleton: FC = () => {
  return (
    <div className="space-y-6 container mx-auto py-4 animate-fade-in">
      {/* Header skeleton */}
      <div>
        <Skeleton width={200} height={32} className="mb-2" />
        <Skeleton width={300} height={24} />
      </div>

      {/* Search and Filters skeleton */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <Skeleton width={300} height={40} className="rounded-full" />
        <Skeleton width={200} height={40} className="rounded-full" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead>
              <tr>
                {Array(7).fill(0).map((_, i) => (
                  <th key={i} className="px-6 py-3 text-center">
                    <Skeleton width="80%" height={16} className="mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(5).fill(0).map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <Skeleton circle height={40} width={40} />
                      </div>
                      <div className="ml-4">
                        <Skeleton width={120} height={18} className="mb-1" />
                        <Skeleton width={60} height={16} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={100} height={18} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={100} height={18} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={100} height={18} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={80} height={24} className="rounded-full" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton width={70} height={18} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-center space-x-2">
                      <Skeleton width={100} height={40} className="rounded-full" />
                      <Skeleton width={100} height={40} className="rounded-full" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination skeleton */}
        <div className="flex justify-center mt-6">
          <Skeleton width={250} height={40} />
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for booking details
const BookingDetailsSkeleton: FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 overflow-y-auto h-[calc(100vh-3rem)] pr-2">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-50 py-3 z-10">
        <Skeleton width={200} height={32} />
        <Skeleton width={150} height={40} className="rounded-md" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton height={240} className="rounded-lg" />
            <Skeleton height={24} width="70%" />
            <Skeleton height={16} count={3} />
          </div>

          <div className="space-y-6">
            <div>
              <Skeleton height={32} width="60%" className="mb-2" />
              <Skeleton height={16} count={4} />
            </div>

            <div>
              <Skeleton height={32} width="50%" className="mb-2" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton height={16} width="80%" className="mb-1" />
                  <Skeleton height={20} width="50%" />
                </div>
                <div>
                  <Skeleton height={16} width="80%" className="mb-1" />
                  <Skeleton height={20} width="50%" />
                </div>
                <div>
                  <Skeleton height={16} width="80%" className="mb-1" />
                  <Skeleton height={20} width="50%" />
                </div>
                <div>
                  <Skeleton height={16} width="80%" className="mb-1" />
                  <Skeleton height={20} width="50%" />
                </div>
              </div>
            </div>

            <Skeleton height={50} className="rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

const GuestBookings: FC = () => {
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
  const pageSize = 5;
  const queryClient = useQueryClient();

  const userBookingsQuery = useQuery({
    queryKey: ['userBookings', currentPage, pageSize],
    queryFn: () => fetchUserBookings({ page: currentPage, pageSize }),
  });

  const guestBookingsQuery = useQuery({
    queryKey: ['guestBookings', userDetails?.id, currentPage, pageSize],
    queryFn: () => getGuestBookings(currentPage, pageSize),
    enabled: !!userDetails?.id && userBookingsQuery.isError,
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

      queryClient.invalidateQueries({ queryKey: ['userBookings', currentPage, pageSize] });
      if (userBookingsQuery.isError) {
        queryClient.invalidateQueries({
          queryKey: ['guestBookings', userDetails?.id, currentPage, pageSize]
        });
      }
      toast.success("Booking cancelled successfully!");
    },
    onError: (error: any) => {
      console.error(`Error cancelling booking: ${error}`);
      toast.error("Failed to cancel booking. Please try again.");
    }
  });

  const { bookings, totalPages, isLoading, errorMessage } = useMemo(() => {
    return {
      bookings: userBookingsQuery.data?.data || (guestBookingsQuery.data?.data || []),
      totalPages: userBookingsQuery.data?.pagination?.total_pages ||
        guestBookingsQuery.data?.pagination?.total_pages || 1,
      isLoading: userBookingsQuery.isPending ||
        (guestBookingsQuery.isPending && userBookingsQuery.isError) ||
        (bookingDetailsQuery.isPending && !!bookingId) ||
        cancelBookingMutation.isPending,
      errorMessage: (userBookingsQuery.isError && guestBookingsQuery.isError)
        ? "Failed to load bookings. Please try again later."
        : (bookingDetailsQuery.isError && !!bookingId)
          ? "Failed to load booking details. Please try again later."
          : cancelBookingMutation.isError
            ? "Failed to cancel booking. Please try again later."
            : null
    };
  }, [
    userBookingsQuery.data, userBookingsQuery.isPending, userBookingsQuery.isError,
    guestBookingsQuery.data, guestBookingsQuery.isPending, guestBookingsQuery.isError,
    bookingDetailsQuery.isPending, bookingDetailsQuery.isError, bookingId,
    cancelBookingMutation.isPending, cancelBookingMutation.isError
  ]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking: any) => {
      const matchesSearch =
        (booking.is_venue_booking
          ? (booking.area_name || booking.area_details?.area_name || '')
          : (booking.room_name || booking.room_details?.room_name || ''))
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (booking.room_type || booking.room_details?.room_type || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (booking.booking_reference || booking.id || '')
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus
        ? (booking.status || '').toLowerCase() === filterStatus.toLowerCase()
        : true;

      const isNotCancelled = (booking.status || '').toLowerCase() !== 'cancelled';
      return matchesSearch && matchesStatus && isNotCancelled;
    });
  }, [bookings, searchTerm, filterStatus]);

  const handleCancelBooking = useCallback((reason: string) => {
    if (!cancellationBookingId || !reason.trim()) {
      return;
    }

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


  const shouldShowReviewButton = useCallback((booking: any) => {
    return (
      booking.status.toLowerCase() === 'checked_out' &&
      !(booking.has_user_review || booking.has_review)
    );
  }, []);

  if (isLoading) {
    return (
      bookingId ? <BookingDetailsSkeleton /> : <BookingsTableSkeleton />
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
                  {filteredBookings.map((booking: any) => {
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
                          duration = Math.ceil(diffTime / (1000 * 60 * 60)) || 1; // Hours
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
                              <div className="text-md font-medium text-gray-900">{itemName}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-medium">
                          <div className="flex justify-center space-x-2">
                            <button
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full flex items-center cursor-pointer transition-all duration-300"
                              onClick={() => viewBookingDetails(id.toString())}
                            >
                              <Eye size={30} className="mr-1" /> View
                            </button>
                            {booking.status.toLowerCase() === 'pending' && (
                              <button
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center cursor-pointer transition-all duration-300"
                                onClick={() => openCancelModal(id.toString())}
                              >
                                <XCircle size={30} className="mr-1" /> Cancel
                              </button>
                            )}
                            {shouldShowReviewButton(booking) && (
                              <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center cursor-pointer transition-all duration-300"
                                onClick={() => openReviewModal(booking)}
                              >
                                <MessageSquare size={30} className="mr-1" /> Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No bookings found matching your criteria.
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-l-md border ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border-t border-b ${currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-r-md border ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                >
                  <ChevronRight size={20} />
                </button>
              </nav>
            </div>
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