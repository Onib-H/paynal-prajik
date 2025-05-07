import { BookingFormData } from "../types/BookingClient";

export const createBookingFormData = (bookingData: BookingFormData) => {
    const formData = new FormData();
    Object.entries(bookingData).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
    });
    return formData;
};
