/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, FC, useContext, useEffect, useState } from 'react';
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

export const BookingLimitProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentBookings, setCurrentBookings] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated, userDetails } = useUserContext();
    const maxLimit = 1;

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
            console.error(`Failed to fetch booking count: ${error}`);
            setCurrentBookings(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingCount();
    }, [isAuthenticated, userDetails?.id]);

    const canBook = currentBookings < maxLimit;

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