/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, Filter, Search } from "lucide-react";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import CancellationModal from "../../components/bookings/CancellationModal";
import Modal from "../../components/Modal";
import { getAllBookings, recordPayment, updateBookingStatus } from "../../services/Admin";
import { BookingResponse } from "../../types/BookingClient";
import { formatDate } from "../../utils/formatters";
import BookingStatusBadge from "../../components/admin/BookingStatusBadge";
import BookingDetailsModal from "../../components/admin/BookingDetailsModal";
import { getBookingPrice } from "../../utils/formatters";

const ManageBookings: FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const pageSize = 9;

  const { data: bookingsResponse, error } = useQuery<{
    data: BookingResponse[];
    pagination?: {
      total_pages: number;
      current_page: number;
      total_items: number;
      page_size: number;
    };
  }, Error>({
    queryKey: ["admin-bookings", currentPage, pageSize],
    queryFn: () => getAllBookings({ page: currentPage, pageSize }),
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
      reason,
      paymentAmount,
      setRoomAvailable = false,
    }: {
      bookingId: number;
      status: string;
      reason?: string;
      paymentAmount?: number;
      setRoomAvailable?: boolean;
    }) => {
      const data: Record<string, any> = {
        status,
        set_available: setRoomAvailable,
      };

      if ((status === "cancelled" || status === "rejected") && reason) {
        data.reason = reason;
      }

      const result = await updateBookingStatus(bookingId, data);

      if (status === "checked_in" && paymentAmount) {
        try {
          await recordPayment(bookingId, paymentAmount);
        } catch (error) {
          console.error("Failed to record payment:", error);
        }
      }

      return { result, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      const { status } = data;

      if (status === "reserved") {
        toast.success(
          "Booking has been reserved successfully! A confirmation email has been sent to the guest."
        );
      } else if (status === "rejected") {
        toast.success(
          "Booking has been rejected. The guest has been notified with your reason."
        );
      } else if (status === "checked_in") {
        toast.success(
          "Guest has been checked in successfully and payment recorded."
        );
      } else if (status === "checked_out") {
        toast.success("Guest has been checked out successfully.");
      } else if (status === "no_show") {
        toast.success(
          "Booking has been marked as 'No Show' and the room/area has been made available again."
        );
      } else {
        toast.success(`Booking status updated to ${status.replace("_", " ")}`);
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
        setRoomAvailable: false,
      });
    }
  };

  const handleCheckIn = (paymentAmount?: number) => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: "checked_in",
        paymentAmount,
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
          setRoomAvailable: true,
        });
        setShowNoShowModal(false);
      } catch (error) {
        console.error(`Error marking booking as no-show: ${error}`);
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
        reason: reason,
      });
      setShowRejectionModal(false);

      setSelectedBooking((prev) =>
        prev
          ? {
            ...prev,
            status: "rejected",
          }
          : null
      );
    }
  };

  const closeModal = () => setSelectedBooking(null);

  const closeRejectionModal = () => setShowRejectionModal(false);

  const handlePageChange = (newPage: number) => setCurrentPage(newPage);

  const totalPages = bookingsResponse?.pagination?.total_pages || 1;
  const filteredBookings = (bookingsResponse?.data || []).filter((booking) => {
    const guestName = `${booking.user?.first_name || ""} ${booking.user?.last_name || ""
      }`.toLowerCase();
    const email = booking.user?.email?.toLowerCase() || "";

    const propertyName = booking.is_venue_booking
      ? booking.area_details?.area_name?.toLowerCase() || ""
      : booking.room_details?.room_name?.toLowerCase() || "";

    const searchMatch =
      searchTerm === "" ||
      guestName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      propertyName.includes(searchTerm.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      booking.status?.toLowerCase() === statusFilter.toLowerCase();

    return searchMatch && statusMatch;
  });

  const handleCancellationInitiate = () => {
    if (selectedBooking) setShowCancellationModal(true);
  };

  const handleCancellationConfirm = (reason: string) => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: "cancelled",
        reason: reason,
        setRoomAvailable: true,
      });
      setShowCancellationModal(false);
    }
  };

  const closeCancellationModal = () => setShowCancellationModal(false);

  return (
    <div className="min-h-[calc(100vh-25px)] p-3 md:p-3 overflow-y-auto container mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
        Manage Bookings
      </h1>

      {error && (
        <div className="mb-4 text-red-600 p-3 bg-red-50 rounded-lg">
          {error.message}
        </div>
      )}

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
                    ? booking.area_details?.area_name || "Unknown Area"
                    : booking.room_details?.room_name || "Unknown Room";

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm md:text-base text-gray-700 whitespace-nowrap">
                        {formatDate(booking.created_at)}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm md:text-base text-gray-700 whitespace-nowrap">
                        {`${booking.user?.first_name || ""} ${booking.user?.last_name || ""
                          }`}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-4 text-sm md:text-base text-gray-700 whitespace-nowrap">
                        <div className="flex flex-col items-start">
                          <span className="max-w-[120px] md:max-w-full font-semibold">
                            {propertyName}{" "}
                            {isVenueBooking ? (
                              <span className="px-2 py-0.5 mt-1 items-end text-sm uppercase font-semibold bg-blue-100 text-blue-800 rounded-full">
                                Area
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 mt-1 items-end text-sm uppercase font-semibold bg-green-100 text-green-800 rounded-full">
                                Room
                              </span>
                            )}
                          </span>
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
                      <td className="hidden md:table-cell py-3 px-4 text-center text-xl font-semibold text-gray-900 whitespace-nowrap">
                        ₱{" "}
                        {getBookingPrice(booking).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-blue-600 hover:bg-blue-50"
                }`}
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (window.innerWidth < 768) {
                  return (
                    Math.abs(page - currentPage) < 2 ||
                    page === 1 ||
                    page === totalPages
                  );
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
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-600 hover:bg-blue-50"
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
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-blue-600 hover:bg-blue-50"
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
          onCancel={handleCancellationInitiate}
          canManage={true}
          isUpdating={updateBookingStatusMutation.isPending}
        />
      )}

      {/* Use CancellationModal for rejection */}
      {showRejectionModal && (
        <CancellationModal
          isOpen={showRejectionModal}
          onClose={closeRejectionModal}
          onConfirm={handleRejectConfirm}
          title="Reject Booking"
          description="Please provide a reason for rejecting this booking. This will be shared with the guest."
          reasonLabel="Reason for Rejection"
          reasonPlaceholder="Enter detailed reason for rejecting this booking..."
          confirmButtonText="Confirm Rejection"
          showPolicyNote={false}
        />
      )}

      {/* Use CancellationModal for guest cancellation */}
      {showCancellationModal && (
        <CancellationModal
          isOpen={showCancellationModal}
          onClose={closeCancellationModal}
          onConfirm={handleCancellationConfirm}
          title="Cancel Booking"
          description="Please provide a reason for cancelling this booking on behalf of the guest. This will be recorded in the system."
          reasonLabel="Reason for Cancellation"
          reasonPlaceholder="Enter reason for guest's cancellation request..."
          confirmButtonText="Confirm Cancellation"
          showPolicyNote={true}
        />
      )}

      {/* No Show Confirmation Modal */}
      <Modal
        isOpen={showNoShowModal}
        title="Mark as No Show"
        description={`Are you sure you want to mark this booking as 'No Show'? 
        This will immediately make the ${selectedBooking?.is_venue_booking ? "area" : "room"
          } available for new bookings.
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
