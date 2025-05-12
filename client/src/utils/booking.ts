import { BookingFormData } from "../types/BookingClient";

export const createBookingFormData = (bookingData: BookingFormData) => {
    const formData = new FormData();
    
    // Add basic user information
    formData.append("firstName", bookingData.firstName);
    formData.append("lastName", bookingData.lastName);
    formData.append("phoneNumber", bookingData.phoneNumber);
    formData.append("specialRequests", bookingData.specialRequests || "");
    
    // Add booking details
    formData.append("roomId", bookingData.roomId || "");
    formData.append("check_in_date", bookingData.check_in_date || "");
    formData.append("check_out_date", bookingData.check_out_date || "");
    formData.append("isVenueBooking", "false");
    
    if (bookingData.arrivalTime) {
        formData.append("arrivalTime", bookingData.arrivalTime);
    }
    
    if (bookingData.status) {
        formData.append("status", bookingData.status);
    }
    
    if (bookingData.numberOfGuests !== undefined) {
        formData.append("numberOfGuests", bookingData.numberOfGuests.toString());
    }
    
    if (bookingData.totalPrice !== undefined) {
        formData.append("totalPrice", bookingData.totalPrice.toString());
    }
    
    // Payment information
    formData.append("paymentMethod", bookingData.paymentMethod || "physical");
    
    if (bookingData.paymentMethod === 'gcash' && bookingData.paymentProof) {
        formData.append("paymentProof", bookingData.paymentProof);
    }
    
    return formData;
};
