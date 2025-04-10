/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, Loader, Search } from "lucide-react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BookingData from "../../components/bookings/BookingData";
import { fetchBookingDetail, fetchUserBookings } from "../../services/Booking";
import { BookingsTableSkeleton, BookingDetailsSkeleton } from "../../motions/skeletons/GuestDetailSkeleton";

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
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatStatus = (status: string): string => {
  return status.toUpperCase().replace(/_/g, ' ');
};

const GuestCancellations: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [changingPage, setChangingPage] = useState(false);
  const pageSize = 5;

  const userBookingsQuery = useQuery({
    queryKey: ['userBookings', 'cancelled', currentPage, pageSize],
    queryFn: () => fetchUserBookings({ page: currentPage, pageSize }),
  });

  const bookingDetailsQuery = useQuery({
    queryKey: ['bookingDetails', bookingId],
    queryFn: () => fetchBookingDetail(bookingId || ''),
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (changingPage && !userBookingsQuery.isPending) {
      setChangingPage(false);
    }
  }, [changingPage, userBookingsQuery.isPending]);

  const { bookings, totalPages, isLoading, errorMessage } = useMemo(() => {
    const allBookings = userBookingsQuery.data?.data || [];

    const cancelledBookings = allBookings.filter(
    (booking: any) => booking.status.toLowerCase() === "cancelled"
  );

    const totalCancelledItems = cancelledBookings.length;
    const calculatedTotalPages = Math.max(1, Math.ceil(totalCancelledItems / pageSize));

    return {
      bookings: cancelledBookings,
      totalPages: calculatedTotalPages,
      isLoading: userBookingsQuery.isPending ||
        (bookingDetailsQuery.isPending && !!bookingId) ||
        changingPage,
      errorMessage: userBookingsQuery.isError
        ? "Failed to load bookings. Please try again later."
        : (bookingDetailsQuery.isError && !!bookingId)
          ? "Failed to load booking details. Please try again later."
          : null
    };
  }, [userBookingsQuery.data, userBookingsQuery.isPending, userBookingsQuery.isError,
  bookingDetailsQuery.isPending, bookingDetailsQuery.isError, bookingId, changingPage, pageSize]);

  const filteredBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const searchFilteredBookings = bookings.filter((booking: any) => {
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

      return matchesSearch;
    });

    return searchFilteredBookings.slice(startIndex, endIndex);
  }, [bookings, searchTerm, currentPage, pageSize]);

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
    setChangingPage(true);
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  if (isLoading) {
    return (
      bookingId ? <BookingDetailsSkeleton /> : <BookingsTableSkeleton />
    )
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
            <span className="mr-2">&larr;</span> Back to Cancellations
          </button>
        </div>

        {bookingDetailsQuery.isPending ? <BookingDetailsSkeleton /> : <BookingData bookingId={bookingId} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 container mx-auto py-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cancelled Bookings</h1>
        <p className="text-gray-600 text-lg">View your cancelled hotel bookings</p>
      </div>

      {/* Search Bar */}
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
      </div>

      {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          {changingPage && (
            <div className="flex justify-center items-center py-10">
              <Loader size={40} className="animate-spin text-blue-500" />
              <span className="ml-3 text-lg text-gray-600">Loading cancelled bookings...</span>
          </div>
          )}

          {!changingPage && filteredBookings.length > 0 ? (
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Cancellation</th>
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
                    const cancellationDate = booking.updated_at;

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
                          {formatDate(cancellationDate)}
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
          ) : !changingPage ? (
              <div className="text-center py-8 text-gray-500">
              No cancelled bookings found.
            </div>
          ) : null}

          {/* Pagination Controls */}
          {totalPages > 1 && !changingPage && (
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

                {/* Page number buttons - limited to max 5 shown */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show pages around current page
                  let pageToShow = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageToShow = currentPage - 2 + i;
                    if (pageToShow > totalPages) {
                      pageToShow = totalPages - (4 - i);
                    }
                  }

                  return (
                    <button
                      key={pageToShow}
                      onClick={() => handlePageChange(pageToShow)}
                      className={`px-3 py-1 border-t border-b ${currentPage === pageToShow
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                    >
                      {pageToShow}
                    </button>
                  );
                })}

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
    </div>
  );
};

export default GuestCancellations;