import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Search, XCircle } from "lucide-react";
import { FC, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BookingData from "../../components/bookings/BookingData";
import { useUserContext } from "../../contexts/AuthContext";
import LoadingHydrate from "../../motions/loaders/LoadingHydrate";
import { cancelBooking, fetchBookingDetail, fetchUserBookings } from "../../services/Booking";
import { getGuestBookings } from "../../services/Guest";

const GuestBookings: FC = () => {
  const { userDetails } = useUserContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationBookingId, setCancellationBookingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isSuccess = searchParams.get('success') === 'true';
  const isCancelled = searchParams.get('cancelled') === 'true';

  // Query to fetch user bookings
  const userBookingsQuery = useQuery({
    queryKey: ['userBookings'],
    queryFn: fetchUserBookings,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const guestBookingsQuery = useQuery({
    queryKey: ['guestBookings', userDetails?.id],
    queryFn: () => getGuestBookings(userDetails?.id || ''),
    enabled: !!userDetails?.id && userBookingsQuery.isError,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query to fetch booking details when a booking ID is selected
  const bookingDetailsQuery = useQuery({
    queryKey: ['bookingDetails', bookingId],
    queryFn: () => fetchBookingDetail(bookingId || ''),
    enabled: !!bookingId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for cancelling a booking
  const cancelBookingMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      cancelBooking(bookingId, reason),
    onSuccess: () => {
      // Update search params to show cancellation success message
      searchParams.set('cancelled', 'true');
      setSearchParams(searchParams);

      // Reset the cancellation form
      setShowCancelModal(false);
      setCancellationBookingId(null);
      setCancelReason("");

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['guestBookings'] });
    }
  });

  // Combine the bookings from both sources
  const bookings = userBookingsQuery.data ||
    (guestBookingsQuery.data?.data || []);

  // Check if we're loading data
  const isLoading = userBookingsQuery.isPending ||
    (guestBookingsQuery.isPending && userBookingsQuery.isError) ||
    (bookingDetailsQuery.isPending && !!bookingId) ||
    cancelBookingMutation.isPending;

  // Check for errors
  const errorMessage = (userBookingsQuery.isError && guestBookingsQuery.isError)
    ? "Failed to load bookings. Please try again later."
    : (bookingDetailsQuery.isError && !!bookingId)
      ? "Failed to load booking details. Please try again later."
      : cancelBookingMutation.isError
        ? "Failed to cancel booking. Please try again later."
        : null;

  const handleCancelBooking = async () => {
    if (!cancellationBookingId || !cancelReason.trim()) return;

    cancelBookingMutation.mutate({
      bookingId: cancellationBookingId,
      reason: cancelReason
    });
  };

  const openCancelModal = (id: string) => {
    setCancellationBookingId(id);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancellationBookingId(null);
    setCancelReason("");
  };

  const viewBookingDetails = (id: string) => {
    searchParams.set('bookingId', id);
    setSearchParams(searchParams);
  };

  const backToBookingsList = () => {
    searchParams.delete('bookingId');
    setSearchParams(searchParams);
  };

  if (isLoading) return <LoadingHydrate />;
  if (errorMessage) return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{errorMessage}</div>;

  // Filter the bookings based on search and status filter
  const filteredBookings = bookings.filter((booking: any) => {
    const matchesSearch =
      (booking.room_name || booking.room_details?.room_name || '')
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

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'checked_in':
        return 'bg-indigo-100 text-indigo-700';
      case 'checked_out':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';

    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };

  // If a booking is selected, show its details
  if (bookingId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Booking Details</h1>
          <button
            onClick={backToBookingsList}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center"
          >
            <span className="mr-2">←</span> Back to Bookings
          </button>
        </div>

        {/* Success message when redirected from booking confirmation */}
        {isSuccess && (
          <div className="mb-6">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> Your booking has been confirmed.</span>
            </div>
          </div>
        )}

        {/* Cancellation success message */}
        {isCancelled && (
          <div className="mb-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Booking Cancelled!</strong>
              <span className="block sm:inline"> Your booking has been successfully cancelled.</span>
            </div>
          </div>
        )}

        {/* Booking details component */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <BookingData bookingId={bookingId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
        <p className="text-gray-600">Manage all your hotel bookings</p>
      </div>

      {/* Success/Cancellation Messages */}
      {isSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> Your booking has been confirmed.</span>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Booking Cancelled!</strong>
          <span className="block sm:inline"> Your booking has been successfully cancelled.</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            placeholder="Search by room name or booking reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          {filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Ref</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking: any) => {
                    // Normalize the booking data structure between different API responses
                    const bookingRef = booking.booking_reference || booking.id;
                    const roomName = booking.room_name || booking.room_details?.room_name;
                    const roomType = booking.room_type || booking.room_details?.room_type;
                    const roomImage = booking.room_image || booking.room_details?.room_image;
                    const checkInDate = booking.check_in_date;
                    const checkOutDate = booking.check_out_date;
                    const guestsCount = booking.guests_count || booking.guest_count || 'N/A';
                    const status = booking.status;
                    const totalAmount = booking.total_amount || booking.room_details?.room_price;
                    const id = booking.id;

                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {bookingRef}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                src={roomImage || "https://placehold.co/100"}
                                alt={roomName}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{roomName}</div>
                              <div className="text-sm text-gray-500">{roomType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(checkInDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(checkOutDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {guestsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${totalAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                              onClick={() => viewBookingDetails(id.toString())}
                            >
                              <Eye size={16} className="mr-1" /> View
                            </button>
                            {status.toLowerCase() !== 'cancelled' &&
                              status.toLowerCase() !== 'completed' &&
                              status.toLowerCase() !== 'checked_out' && (
                                <button
                                  className="text-red-600 hover:text-red-900 flex items-center"
                                  onClick={() => openCancelModal(id.toString())}
                                >
                                  <XCircle size={16} className="mr-1" /> Cancel
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
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Cancel Booking</h2>
            <p className="mb-4">Please provide a reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              rows={3}
              placeholder="Enter cancellation reason..."
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={!cancelReason.trim() || cancelBookingMutation.isPending}
                className={`px-4 py-2 bg-red-600 text-white rounded-md ${!cancelReason.trim() || cancelBookingMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                  }`}
              >
                {cancelBookingMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestBookings;