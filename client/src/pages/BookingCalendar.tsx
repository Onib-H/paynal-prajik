/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, eachDayOfInterval, endOfMonth, format, isBefore, isEqual, isWithinInterval, parseISO, startOfDay, startOfMonth } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchRoomBookings, fetchRoomById } from '../services/Booking';

interface AmenityObject {
    id: number;
    description: string;
}

interface RoomData {
    id: number;
    room_name: string;
    room_type: string;
    description: string;
    room_image: string;
    status: string;
    capacity: number;
    amenities: Array<AmenityObject | string>;
    price_per_night?: string;
    room_price?: string;
}

interface BookingData {
    id: number;
    check_in_date: string;
    check_out_date: string;
    status: string;
}

interface BookingsByDate {
    [date: string]: {
        status: string;
        bookingId: number;
    };
}

function isAmenityObject(amenity: any): amenity is AmenityObject {
    return amenity && typeof amenity === 'object' && 'description' in amenity;
}

const BookingCalendar = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const [searchParams] = useSearchParams();
    const arrivalParam = searchParams.get("arrival");
    const departureParam = searchParams.get("departure");
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [numberOfNights, setNumberOfNights] = useState(1);
    const [totalPrice, setTotalPrice] = useState(0);
    const [bookingsByDate, setBookingsByDate] = useState<BookingsByDate>({});

    useEffect(() => {
        if (arrivalParam && departureParam) {
            try {
                const arrival = parseISO(arrivalParam);
                const departure = parseISO(departureParam);
                setCheckInDate(arrival);
                setCheckOutDate(departure);
                setCurrentMonth(arrival);
            } catch (error) {
                console.error('Error parsing dates from URL:', error);
            }
        }
    }, [arrivalParam, departureParam]);

    const dateRange = useMemo(() => {
        const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd');
        return { startDate, endDate };
    }, [currentMonth]);

    const { data: roomData, isLoading: isLoadingRoom } = useQuery<RoomData>({
        queryKey: ['room', roomId],
        queryFn: async () => {
            try {
                return await fetchRoomById(roomId || '');
            } catch (error) {
                console.error('Error fetching room:', error);
                throw error;
            }
        },
        enabled: !!roomId,
    });

    const { data: bookingsData, isLoading: isLoadingBookings } = useQuery<{ data: BookingData[] }>({
        queryKey: ['roomBookings', roomId, dateRange.startDate, dateRange.endDate],
        queryFn: async () => {
            return fetchRoomBookings(roomId || '', dateRange.startDate, dateRange.endDate);
        },
        enabled: !!roomId,
    });

    useEffect(() => {
        if (bookingsData?.data) {
            const newBookingsByDate: BookingsByDate = {};

            bookingsData.data.forEach(booking => {
                const checkInDate = parseISO(booking.check_in_date);
                const checkOutDate = parseISO(booking.check_out_date);

                const datesInRange = eachDayOfInterval({ start: checkInDate, end: checkOutDate });

                datesInRange.forEach(date => {
                    const dateString = format(date, 'yyyy-MM-dd');
                    newBookingsByDate[dateString] = {
                        status: booking.status,
                        bookingId: booking.id
                    };
                });
            });

            setBookingsByDate(newBookingsByDate);
        }
    }, [bookingsData]);

    useEffect(() => {
        if (roomId) {
            const nextMonth = addMonths(currentMonth, 2);
            const prefetchStartDate = format(startOfMonth(nextMonth), 'yyyy-MM-dd');
            const prefetchEndDate = format(endOfMonth(nextMonth), 'yyyy-MM-dd');

            queryClient.prefetchQuery({
                queryKey: ['roomBookings', roomId, prefetchStartDate, prefetchEndDate],
                queryFn: () => fetchRoomBookings(roomId, prefetchStartDate, prefetchEndDate),
            });
        }
    }, [currentMonth, roomId, queryClient]);

    useEffect(() => {
        if (checkInDate && checkOutDate && roomData) {
            const days = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
            setNumberOfNights(days);

            const priceString = roomData.price_per_night || roomData.room_price || '0';

            let priceValue = 0;
            try {
                const numericValue = priceString.toString().replace(/[^\d.]/g, '');
                priceValue = parseFloat(numericValue) || 0;
            } catch (error) {
                console.error('Error parsing room price:', error);
                priceValue = 0;
            }

            setTotalPrice(priceValue * days);
        }
    }, [checkInDate, checkOutDate, roomData]);

    const months = useMemo(() => [currentMonth, addMonths(currentMonth, 1)], [currentMonth]);
    const prevMonth = useCallback(() => setCurrentMonth(prev => addMonths(prev, -1)), []);
    const nextMonth = useCallback(() => setCurrentMonth(prev => addMonths(prev, 1)), []);

    const isDateBooked = useCallback((date: Date): boolean => {
        const dateString = format(date, 'yyyy-MM-dd');
        const booking = bookingsByDate[dateString];

        if (booking && booking.status) {
            const status = booking.status.toLowerCase();
            return ['checked_in', 'reserved'].includes(status);
        }

        return false;
    }, [bookingsByDate]);

    const getDateStatus = useCallback((date: Date): string | null => {
        const dateString = format(date, 'yyyy-MM-dd');
        return bookingsByDate[dateString]?.status || null;
    }, [bookingsByDate]);

    const isDateUnavailable = useCallback((date: Date) => {
        if (isBefore(date, startOfDay(new Date()))) {
            return true;
        }

        return isDateBooked(date);
    }, [isDateBooked]);

    const handleDateClick = (date: Date) => {
        if (isDateUnavailable(date)) {
            return;
        }

        if (!checkInDate || (checkInDate && checkOutDate)) {
            setCheckInDate(date);
            setCheckOutDate(null);
        } else {
            if (isBefore(date, checkInDate)) {
                setCheckOutDate(checkInDate);
                setCheckInDate(date);
            } else {
                setCheckOutDate(date);
            }
        }
    };

    const handleDateHover = (date: Date) => {
        if (!isDateUnavailable(date)) {
            setHoveredDate(date);
        } else {
            setHoveredDate(null);
        }
    };

    const isDateInRange = (date: Date) => {
        if (checkInDate && checkOutDate) {
            return isWithinInterval(date, { start: checkInDate, end: checkOutDate });
        }
        if (checkInDate && hoveredDate && !checkOutDate) {
            if (isBefore(hoveredDate, checkInDate)) {
                return isWithinInterval(date, { start: hoveredDate, end: checkInDate });
            } else {
                return isWithinInterval(date, { start: checkInDate, end: hoveredDate });
            }
        }
        return false;
    };

    const getDateCellClass = (date: Date) => {
        const isUnavailable = isDateUnavailable(date);
        const isToday = isEqual(date, startOfDay(new Date()));
        const isCheckinDate = checkInDate && isEqual(date, checkInDate);
        const isCheckoutDate = checkOutDate && isEqual(date, checkOutDate);
        const isInRange = !isUnavailable && isDateInRange(date);
        const isHovered = !isUnavailable && hoveredDate && isEqual(date, hoveredDate);
        const dateStatus = getDateStatus(date);

        // Base class for all date cells
        let className = "relative h-10 w-10 flex items-center justify-center text-sm rounded-full";

        // Handle selection first (highest priority)
        if (isCheckinDate || isCheckoutDate) {
            return `${className} bg-blue-600 text-white font-medium`;
        }

        // Handle date range
        if (isInRange) {
            return `${className} bg-blue-200 text-blue-800`;
        }

        // Handle hover effect for available dates
        if (isHovered && !isUnavailable) {
            return `${className} bg-blue-100 border border-blue-300 cursor-pointer`;
        }

        // Handle today indicator
        if (isToday && !isUnavailable) {
            className += " border-blue-500 border-2";
        }

        // Handle specific booked statuses
        if (dateStatus && ['reserved', 'checked_in'].includes(dateStatus.toLowerCase())) {
            switch (dateStatus.toLowerCase()) {
                case 'reserved':
                    return `${className} bg-green-200 text-green-800 border-2 border-green-600 font-medium cursor-not-allowed`;
                case 'checked_in':
                    return `${className} bg-blue-200 text-blue-800 border-2 border-blue-600 font-medium cursor-not-allowed`;
                default:
                    return `${className} bg-gray-300 text-gray-500 cursor-not-allowed`;
            }
        }

        // Handle past dates
        if (isUnavailable) {
            return `${className} bg-gray-300 text-gray-500 cursor-not-allowed`;
        }

        // Default available date styling (including checked_out, cancelled, rejected, pending)
        return `${className} bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer`;
    };

    const handleProceed = () => {
        if (checkInDate && checkOutDate && numberOfNights > 0) {
            navigate(`/confirm-booking?roomId=${roomId}&arrival=${format(checkInDate, 'yyyy-MM-dd')}&departure=${format(checkOutDate, 'yyyy-MM-dd')}&totalPrice=${totalPrice}`);
        }
    };

    if (isLoadingRoom || isLoadingBookings) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-80px)]">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10 mt-16">
            <h2 className="text-4xl font-semibold mb-6 text-center">Book Your Room</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white ring-3 ring-blue-400 rounded-lg shadow-xl p-6">
                        <h3 className="text-2xl font-bold mb-4">Select Your Stay Dates</h3>

                        {/* Selected Dates */}
                        <div className="flex flex-col text-lg md:flex-row md:items-center md:justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <span className="text-gray-600">Check-in:</span>
                                <span className="ml-2 font-semibold">
                                    {checkInDate ? format(checkInDate, 'EEE, MMM dd, yyyy') : 'Select date'}
                                </span>
                            </div>
                            <div className="mt-2 md:mt-0">
                                <span className="text-gray-600">Check-out:</span>
                                <span className="ml-2 font-semibold">
                                    {checkOutDate ? format(checkOutDate, 'EEE, MMM dd, yyyy') : 'Select date'}
                                </span>
                            </div>
                            <div className="mt-2 md:mt-0">
                                <span className="text-gray-600">Days:</span>
                                <span className="ml-2 font-semibold">
                                    {checkInDate && checkOutDate ? numberOfNights : 0}
                                </span>
                            </div>
                        </div>

                        {arrivalParam && departureParam ? (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <p className="font-medium text-blue-800">
                                    Dates pre-selected: {checkInDate && checkOutDate
                                        ? `${format(checkInDate, 'MMMM dd')} to ${format(checkOutDate, 'MMMM dd, yyyy')} (${numberOfNights} nights)`
                                        : ''}
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    Please confirm your booking by clicking Proceed below.
                                </p>
                            </div>
                        ) : (
                            // Show calendar for date selection if no dates in URL
                            <>
                                {/* Calendar Controls */}
                                <div className="flex justify-between items-center mb-4">
                                    <button
                                        onClick={prevMonth}
                                        className="p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="text-lg font-semibold">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </div>
                                    <button
                                        onClick={nextMonth}
                                        className="p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {months.map((month, monthIndex) => {
                                        const monthStart = startOfMonth(month);
                                        const monthEnd = endOfMonth(month);
                                        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

                                        const startWeekday = monthStart.getDay();
                                        const calendarDays = [];

                                        for (let i = 0; i < startWeekday; i++) {
                                            calendarDays.push(null);
                                        }

                                        calendarDays.push(...days);

                                        return (
                                            <div key={monthIndex}>
                                                <div className="text-center font-medium mb-2">
                                                    {format(month, 'MMMM yyyy')}
                                                </div>
                                                <div className="grid grid-cols-7 gap-1">
                                                    {/* Weekday headers */}
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                                        <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">
                                                            {day}
                                                        </div>
                                                    ))}

                                                    {/* Calendar days */}
                                                    {calendarDays.map((day, i) => (
                                                        <div key={i} className="h-10 flex items-center justify-center">
                                                            {day ? (
                                                                <div
                                                                    className={getDateCellClass(day)}
                                                                    onClick={() => handleDateClick(day)}
                                                                    onMouseEnter={() => handleDateHover(day)}
                                                                    onMouseLeave={() => setHoveredDate(null)}
                                                                >
                                                                    {format(day, 'd')}
                                                                </div>
                                                            ) : (
                                                                <div></div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Calendar Legend */}
                                <div className="mt-6 border-t pt-4">
                                    <h4 className="text-sm font-medium mb-3">CALENDAR LEGEND</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                                        <div className="flex items-center">
                                            <div className="h-6 w-6 bg-white border border-gray-300 mr-2 rounded-full"></div>
                                            <span className="text-sm">Available</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="h-6 w-6 bg-blue-600 mr-2 rounded-full"></div>
                                            <span className="text-sm">Selected Date</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="h-6 w-6 bg-blue-200 mr-2 rounded-full"></div>
                                            <span className="text-sm">Selected Range</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="h-6 w-6 bg-gray-300 mr-2 rounded-full"></div>
                                            <span className="text-sm">Unavailable</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="h-6 w-6 bg-green-200 border-2 border-green-600 mr-2 rounded-full"></div>
                                            <span className="text-sm">Reserved</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="h-6 w-6 bg-blue-200 border-2 border-blue-600 mr-2 rounded-full"></div>
                                            <span className="text-sm">Checked In</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Proceed Button */}
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleProceed}
                                disabled={!checkInDate || !checkOutDate}
                                className={`px-6 py-2 rounded-md font-semibold ${checkInDate && checkOutDate
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Proceed to Booking
                            </button>
                        </div>
                    </div>
                </div>

                {/* Room Info Card - Right Side */}
                <div className="lg:col-span-1">
                    {roomData && (
                        <div className="bg-white rounded-lg ring-blue-400 ring-3 shadow-xl p-6 sticky top-24">
                            <div className="mb-4">
                                <img
                                    loading="lazy"
                                    src={roomData.room_image}
                                    alt={roomData.room_name}
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold">{roomData.room_name}</h3>
                            </div>
                            <p className="text-lg font-semibold text-blue-600 mb-3">
                                {roomData.price_per_night || roomData.room_price || '₱0'}
                            </p>

                            <div className="flex flex-col space-y-2 mb-4">
                                <div className="flex items-center text-gray-600">
                                    <span className="mr-2">🏠</span>
                                    <span>{roomData.room_type}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <span className="mr-2">👥</span>
                                    <span>{roomData.capacity}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-3 mb-3">
                                <h4 className="font-semibold text-lg mb-2">Amenities:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {roomData.amenities && roomData.amenities.map((amenity, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                        >
                                            {isAmenityObject(amenity) ? amenity.description : String(amenity)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {checkInDate && checkOutDate && (
                                <div className="border-t border-gray-200 pt-3 mt-3">
                                    <h4 className="font-semibold text-lg mb-3">Booking Details:</h4>
                                    <div className="p-1 rounded-md space-y-2">
                                        <div className="flex justify-between">
                                            <span>Check-in:</span>
                                            <span className="font-medium">{format(checkInDate, 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Check-out:</span>
                                            <span className="font-medium">{format(checkOutDate, 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Days:</span>
                                            <span className="font-medium">{numberOfNights}</span>
                                        </div>
                                        <div className="flex justify-between text-3xl font-semibold text-blue-600 pt-2 border-t border-gray-200">
                                            <span>Total Price:</span>
                                            <span>₱{totalPrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingCalendar;