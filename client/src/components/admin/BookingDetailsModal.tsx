import { motion } from "framer-motion";
import { AlertCircle, Calendar, Check, CheckCircle2, Clock, IdCard, X } from "lucide-react";
import { FC, useState } from "react";
import EventLoader from "../../motions/loaders/EventLoader";
import { BookingResponse } from "../../types/BookingClient";
import { formatDate, getBookingPrice } from "../../utils/formatters";
import BookingStatusBadge from "./BookingStatusBadge";

interface BookingDetailProps {
    booking: BookingResponse | null;
    onClose: () => void;
    onConfirm: () => void;
    onReject: () => void;
    onCheckIn?: (paymentAmount: number) => void;
    onCheckOut?: () => void;
    onNoShow?: () => void;
    onCancel?: () => void;
    canManage: boolean;
    isUpdating: boolean;
}

const BookingDetailsModal: FC<BookingDetailProps> = ({ booking, onClose, onConfirm, onReject, onCheckIn, onCheckOut, onNoShow, onCancel, canManage, isUpdating }) => {
    const [paymentAmount, setPaymentAmount] = useState<string>("");

    const isVenueBooking = booking?.is_venue_booking;
    const bookingPrice = getBookingPrice(booking);
    const currentPayment = parseFloat(paymentAmount) || 0;
    const isPaymentComplete = currentPayment === bookingPrice;
    const isReservedStatus = booking.status === "reserved";

    const isNoShowEligible = (): boolean => {
        const currentDate = new Date();
        const checkInDate = new Date(booking.check_in_date);

        const todayOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const checkInOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());

        const cutOff = new Date(checkInDate);
        if (booking.is_venue_booking) {
            cutOff.setHours(8, 0, 0, 0);
        } else {
            if (!booking.time_of_arrival) return false;
            const [h, m] = booking.time_of_arrival.split(':').map(Number);
            cutOff.setHours(h, m, 0, 0);
        }
        const eligible = todayOnly.getTime() === checkInOnly.getTime() && currentDate.getTime() > cutOff.getTime();

        return eligible;
    };

    const isCheckInDateValid = (): { isValid: boolean; message: string } => {
        try {
            const currentDate = new Date();
            const checkInDate = new Date(booking.check_in_date);

            const currentDateOnly = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate()
            );

            const checkInDateOnly = new Date(
                checkInDate.getFullYear(),
                checkInDate.getMonth(),
                checkInDate.getDate()
            );

            if (currentDateOnly.getTime() < checkInDateOnly.getTime()) {
                return {
                    isValid: false,
                    message: "Check-in is not available yet. Guest is arriving earlier than the scheduled date."
                };
            }

            if (isVenueBooking) {
                const venueStartHour = 8;
                const currentHour = currentDate.getHours();

                if (currentHour < venueStartHour) {
                    return {
                        isValid: false,
                        message: "Venue booking check-in starts at 8:00 AM"
                    };
                }
            }

            if (booking.time_of_arrival) {
                const arrivalTimeParts = booking.time_of_arrival.split(':');
                if (arrivalTimeParts.length >= 2) {
                    const arrivalHour = parseInt(arrivalTimeParts[0]);
                    const arrivalMinute = parseInt(arrivalTimeParts[1]);

                    const currentHour = currentDate.getHours();
                    const currentMinute = currentDate.getMinutes();

                    const currentTimeInMinutes = (currentHour * 60) + currentMinute;
                    const arrivalTimeInMinutes = (arrivalHour * 60) + arrivalMinute;

                    const standardCheckInTime = 14 * 60;

                    if (arrivalTimeInMinutes < standardCheckInTime) {
                        if (currentTimeInMinutes < arrivalTimeInMinutes) {
                            const formattedArrivalTime = `${arrivalHour % 12 || 12}:${arrivalMinute.toString().padStart(2, '0')} ${arrivalHour >= 12 ? 'PM' : 'AM'}`;

                            return {
                                isValid: false,
                                message: `Guest is expected to arrive in ${formattedArrivalTime}`
                            };
                        }
                        return { isValid: true, message: "" };
                    }

                    if (currentTimeInMinutes < arrivalTimeInMinutes) {
                        const formattedArrivalTime = `${arrivalHour % 12 || 12}:${arrivalMinute.toString().padStart(2, '0')} ${arrivalHour >= 12 ? "PM" : "AM"}`;

                        return {
                            isValid: false,
                            message: `Guest is expected to arrive at ${formattedArrivalTime}`,
                        };
                    }

                    return { isValid: true, message: "" };
                }
            }
            return { isValid: true, message: "" };
        } catch (error) {
            console.error(`Error validating check-in date: ${error}`);
            return { isValid: true, message: "" };
        }
    };

    const isCheckOutDateValid = (): { isValid: boolean; message: string } => {
        try {
            const currentDate = new Date();
            const checkOutDate = new Date(booking.check_out_date);

            if (currentDate >= checkOutDate) {
                return { isValid: true, message: "" };
            }

            if (isVenueBooking) {
                return {
                    isValid: false,
                    message: "Venue checkout is only allowed on or after the scheduled check-out date."
                };
            } else {
                return {
                    isValid: false,
                    message: "Room checkout is only allowed on or after the scheduled check-out date."
                }
            }
        } catch (error) {
            console.error(`Error validating check-out date: ${error}`);
            return { isValid: true, message: "" };
        }
    }

    const checkInValidation = isCheckInDateValid();
    const canCheckIn = isPaymentComplete && checkInValidation.isValid;

    const checkOutValidation = isCheckOutDateValid();
    const canCheckOut = checkOutValidation.isValid;

    const canMarkNoShow = isNoShowEligible();

    const renderValidId = () => {
        if (!booking.valid_id) {
            return (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No valid ID uploaded</p>
                </div>
            );
        }

        return (
            <div className="overflow-hidden">
                <img
                    src={booking.valid_id}
                    alt="Valid ID"
                    loading="lazy"
                    className="w-full h-auto"
                />
            </div>
        );
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => setPaymentAmount(e.target.value);

    const getLoadingText = () => {
        switch (booking.status) {
            case "pending":
                return "Reserving booking...";
            case "reserved":
                return "Checking in guest...";
            case "checked_in":
                return "Checking out guest...";
            case "no_show":
                return "Marking as no-show...";
            case "cancelled":
                return "Cancelling booking...";
            case "rejected":
                return "Rejecting booking request...";
            default:
                return "Processing booking...";
        }
    };

    const getLoaderType = () => {
        switch (booking.status) {
            case "pending":
                return "reserve";
            case "reserved":
                return "checkin";
            case "checked_in":
                return "checkout";
            case "no_show":
            case "cancelled":
                return "noshow";
            case "rejected":
                return "rejected";
            default:
                return "default";
        }
    };

    if (!booking) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            {isUpdating ? (
                <div className="flex items-center justify-center w-full h-full">
                    <EventLoader
                        text={getLoadingText()}
                        type={getLoaderType() as "default" | "reserve" | "checkin" | "checkout" | "noshow" | "cancelled" | "rejected"}
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
                                        <span className="bg-blue-100 text-blue-800 px-2 uppercase py-1 rounded-full text-md font-semibold">Area</span>
                                    ) : (
                                        <span className="bg-green-100 text-green-800 px-2 uppercase py-1 rounded-full text-md font-semibold">Room</span>
                                    )}
                                </span>
                            </motion.div>

                            <motion.div
                                className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                            >
                                <span className="font-semibold text-gray-700">{isVenueBooking ? "Area:" : "Room:"}</span>
                                <span className="sm:text-right font-medium">{isVenueBooking
                                    ? (booking.area_details?.area_name || "Unknown Area")
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

                            {!isVenueBooking && booking.time_of_arrival && (
                                <motion.div
                                    className="flex flex-col sm:flex-row justify-between p-2 rounded-md"
                                >
                                    <span className="font-semibold text-gray-700">Expected Arrival Time:</span>
                                    <span className="font-medium">
                                        {new Date(`2000-01-01T${booking.time_of_arrival}`).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </span>
                                </motion.div>
                            )}

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
                                <span className="font-semibold text-gray-700">{isVenueBooking ? "Area Price:" : "Room Price:"}</span>
                                <span className="font-medium">
                                    {isVenueBooking
                                        ? booking.area_details?.price_per_hour
                                        : booking.room_details?.room_price}
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
                                            <span className="text-gray-500 text-xl">₱</span>
                                        </div>
                                        <motion.input
                                            whileFocus={{ boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)" }}
                                            type="number"
                                            min="0"
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
                                    Area Booking Note
                                </h3>
                                <p className="text-sm text-blue-700">
                                    Standard area bookings are scheduled from 8:00 AM to 5:00 PM (9 hours) on the selected date.
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
                                className="px-4 py-2 cursor-pointer bg-red-600 text-white rounded-lg curp transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <X size={18} />
                                Reject Booking
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-sm"
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
                            <div className="relative group">
                                <motion.button
                                    whileTap={canMarkNoShow ? { scale: 0.98 } : {}}
                                    onClick={() => onNoShow && canMarkNoShow && onNoShow()}
                                    className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm ${canMarkNoShow
                                        ? 'bg-amber-600 text-white cursor-pointer'
                                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                                    disabled={!canMarkNoShow}
                                >
                                    <X size={18} />
                                    Mark as No Show
                                </motion.button>
                                {!canMarkNoShow && (
                                    <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 w-full">
                                            <p className="flex items-start text-amber-300">
                                                <Clock className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                {isVenueBooking
                                                    ? "No Show can be marked after 8:00 AM on the check-in date"
                                                    : "No Show can be marked after the guest's expected arrival time"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={onCancel}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                            >
                                <X size={18} />
                                Cancel Booking
                            </motion.button>
                            <div className="relative group">
                                <motion.button
                                    whileTap={canCheckIn ? { scale: 0.98 } : {}}
                                    onClick={() => onCheckIn && canCheckIn && onCheckIn(currentPayment)}
                                    className={`px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 shadow-sm ${canCheckIn
                                        ? 'bg-blue-600 cursor-pointer hover:bg-blue-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!canCheckIn}
                                >
                                    <Check size={18} />
                                    Check In Guest
                                </motion.button>

                                {!canCheckIn && (
                                    <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 w-full">
                                            {!isPaymentComplete && (
                                                <p className="flex items-center text-amber-300 mb-1">
                                                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                                                    Payment must match the required total.
                                                </p>
                                            )}
                                            {!checkInValidation.isValid && (
                                                <p className="flex items-start text-amber-300">
                                                    <Clock className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                    {checkInValidation.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {canManage && booking.status === "checked_in" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex justify-center mt-6"
                        >
                            <div className="relative group">
                                <motion.button
                                    whileTap={canCheckOut ? { scale: 0.95 } : {}}
                                    onClick={() => onCheckOut && canCheckOut && onCheckOut()}
                                    className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md duration-300 ${canCheckOut
                                        ? 'bg-indigo-600 hover:bg-indigo-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!canCheckOut}
                                >
                                    <Check size={18} />
                                    Check Out Guest
                                </motion.button>
                                {!canCheckOut && (
                                    <div className="absolute bottom-full left-0 mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 w-full">
                                            {!checkOutValidation.isValid && (
                                                <p className="flex items-start text-amber-300 mb-1">
                                                    <Clock className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                                    {checkOutValidation.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default BookingDetailsModal;