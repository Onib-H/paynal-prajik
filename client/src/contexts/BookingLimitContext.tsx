import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserBookingsForToday } from '../services/Booking';
import { useUserContext } from './AuthContext';

interface BookingLimitContextType {
    canBook: boolean;
    currentBookings: number;
    maxLimit: number;
    isLoading: boolean;
    refreshLimit: () => void;
}

const BookingLimitContext = createContext<BookingLimitContextType>({
    canBook: true,
    currentBookings: 0,
    maxLimit: 3,
    isLoading: true,
    refreshLimit: () => { },
});

export const useBookingLimit = () => useContext(BookingLimitContext);

export const BookingLimitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentBookings, setCurrentBookings] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated, userDetails } = useUserContext();
    const maxLimit = 3; // Maximum bookings per day

    const fetchBookingCount = async () => {
        if (!isAuthenticated || !userDetails?.id) {
            setCurrentBookings(0);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await getUserBookingsForToday();
            setCurrentBookings(response.data.booking_count || 0);
        } catch (error) {
            console.error('Failed to fetch booking count:', error);
            // Default to 0 on error to not block users from booking
            setCurrentBookings(0);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch booking count when auth state changes
    useEffect(() => {
        fetchBookingCount();
    }, [isAuthenticated, userDetails?.id]);

    // Calculate if user can make more bookings
    const canBook = currentBookings < maxLimit;

    // Function to manually refresh the booking limit
    const refreshLimit = () => {
        fetchBookingCount();
    };

    return (
        <BookingLimitContext.Provider
            value={{
                canBook,
                currentBookings,
                maxLimit,
                isLoading,
                refreshLimit
            }}
        >
            {children}
        </BookingLimitContext.Provider>
    );
}; 