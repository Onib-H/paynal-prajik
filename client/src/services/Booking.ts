import { booking } from "./_axios";
import { BookingResponse, BookingFormData, ReservationFormData } from "../types/BookingClient";

export const fetchBookings = async ({
  page = 1,
  pageSize = 9,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<{
  data: BookingResponse[];
  pagination?: {
    total_pages: number;
    current_page: number;
    total_items: number;
    page_size: number;
  };
}> => {
  try {
    const response = await booking.get("/bookings", {
      params: {
        page,
        page_size: pageSize,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch bookings:`, error);
    throw error;
  }
};

export const fetchReservations = async () => {
  try {
    const response = await booking.get("/reservation", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch reservations: ${error}`);
    throw error;
  }
};

export const fetchAvailability = async (arrival: string, departure: string) => {
  try {
    const response = await booking.get("/availability", {
      params: {
        arrival,
        departure,
        exclude_statuses: "reserved,checked_in"
      },
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    if (response.data) {
      if (response.data.rooms) {
        response.data.rooms = response.data.rooms.filter((room: any) =>
          !(room.status === "reserved" || room.status === "checked_in")
        );
      }

      if (response.data.areas) {
        response.data.areas = response.data.areas.filter((area: any) =>
          !(area.status === "reserved" || area.status === "checked_in")
        );
      }
    }

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch availability: ${error}`);
    throw error;
  }
};

export const createBooking = async (bookingData: BookingFormData) => {
  try {
    const formData = new FormData();

    formData.append("firstName", bookingData.firstName);
    formData.append("lastName", bookingData.lastName);
    formData.append("phoneNumber", bookingData.phoneNumber);
    formData.append("address", bookingData.address || "");
    formData.append("specialRequests", bookingData.specialRequests || "");

    if (bookingData.validId) {
      formData.append("validId", bookingData.validId);
    }

    formData.append("roomId", bookingData.roomId || "");
    formData.append("checkIn", bookingData.checkIn || "");
    formData.append("checkOut", bookingData.checkOut || "");
    formData.append("status", bookingData.status || "pending");

    formData.append("arrivalTime", bookingData.arrivalTime || "12:00");

    if (bookingData.totalPrice !== undefined) {
      formData.append("totalPrice", bookingData.totalPrice.toString());
    }

    if (bookingData.numberOfGuests !== undefined) {
      formData.append("numberOfGuests", bookingData.numberOfGuests.toString());
    }

    const bookingLimitCheck = await checkMaxDailyBookings();
    if (!bookingLimitCheck.can_book) {
      throw new Error(`You have reached the maximum limit of ${bookingLimitCheck.max_limit} bookings per day.`);
    }

    const response = await booking.post("/bookings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to create booking: ${error}`);
    throw error;
  }
};

export const createReservation = async (reservationData: ReservationFormData) => {
  try {
    const formData = new FormData();

    formData.append("firstName", reservationData.firstName);
    formData.append("lastName", reservationData.lastName);
    formData.append("phoneNumber", reservationData.phoneNumber);

    if (reservationData.emailAddress) {
      formData.append("emailAddress", reservationData.emailAddress);
    }
    formData.append("specialRequests", reservationData.specialRequests || "");

    if (reservationData.validId) {
      formData.append("validId", reservationData.validId);
    }

    formData.append("roomId", reservationData.areaId || "");

    if (reservationData.startTime) {
      const startDate = new Date(reservationData.startTime);
      const formattedStartDate = startDate.toISOString().split("T")[0];
      formData.append("checkIn", formattedStartDate);
    }

    if (reservationData.endTime) {
      const endDate = new Date(reservationData.endTime);
      const formattedEndDate = endDate.toISOString().split("T")[0];
      formData.append("checkOut", formattedEndDate);
    }

    formData.append("isVenueBooking", "true");
    formData.append("status", reservationData.status || "pending");

    if (reservationData.startTime) {
      const date = new Date(reservationData.startTime);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      formData.append("startTime", `${hours}:${minutes}`);
    }

    if (reservationData.endTime) {
      const date = new Date(reservationData.endTime);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      formData.append("endTime", `${hours}:${minutes}`);
    }

    if (reservationData.totalPrice) {
      formData.append("totalPrice", reservationData.totalPrice.toString());
    }

    if (reservationData.numberOfGuests !== undefined) {
      formData.append("numberOfGuests", reservationData.numberOfGuests.toString());
    }

    const bookingLimitCheck = await checkMaxDailyBookings();
    if (!bookingLimitCheck.can_book) {
      throw new Error(`You have reached the maximum limit of ${bookingLimitCheck.max_limit} bookings per day.`);
    }

    const response = await booking.post("/bookings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to create venue booking:`, error);
    throw error;
  }
};

export const fetchRoomById = async (roomId: string) => {
  try {
    const response = await booking.get(`/rooms/${roomId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch room details: ${error}`);
    throw error;
  }
};

export const fetchAreaById = async (areaId: string) => {
  try {
    const response = await booking.get(`/areas/${areaId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch area details: ${error}`);
    throw error;
  }
};

export const fetchBookingDetail = async (bookingId: string) => {
  try {
    const response = await booking.get(`/bookings/${bookingId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch booking details:`, error);
    throw error;
  }
};

export const fetchUserBookings = async ({
  page = 1,
  pageSize = 9,
}: {
  page?: number;
  pageSize?: number;
} = {}) => {
  try {
    const response = await booking.get("/user/bookings", {
      params: {
        page,
        page_size: pageSize,
      },
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user bookings: ${error}`);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string, reason: string) => {
  try {
    const response = await booking.post(
      `/bookings/${bookingId}/cancel`,
      { reason },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to cancel booking: ${error}`);
    throw error;
  }
};

export const fetchRoomBookings = async (
  roomId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    const url = `/rooms/${roomId}/bookings`;
    const params: Record<string, string> = {};

    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await booking.get(url, {
      params,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch room bookings: ${error}`);
    throw error;
  }
};

export const fetchAreaBookings = async (
  areaId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    const url = `/areas/${areaId}/bookings`;
    const params: Record<string, string> = {};

    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await booking.get(url, {
      params,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch area bookings: ${error}`);
    throw error;
  }
};

export const fetchReviews = async (bookingId: string) => {
  try {
    const response = await booking.get(`/bookings/${bookingId}/reviews`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch reviews: ${error}`);
    throw error;
  }
};

export const createReview = async (
  bookingId: string,
  reviewData: { review_text: string; rating: number }
) => {
  try {
    const response = await booking.post(
      `/bookings/${bookingId}/reviews`,
      reviewData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to create review: ${error}`);
    throw error;
  }
};

export const fetchUserReviews = async () => {
  try {
    const response = await booking.get("/user/reviews", {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user reviews: ${error}`);
    throw error;
  }
};

export const updateReview = async (
  reviewId: string,
  reviewData: { review_text?: string; rating?: number }
) => {
  try {
    const response = await booking.put(`/reviews/${reviewId}`, reviewData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to update review: ${error}`);
    throw error;
  }
};

export const deleteReview = async (reviewId: string) => {
  try {
    const response = await booking.delete(`/reviews/${reviewId}`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to delete review: ${error}`);
    throw error;
  }
};

export const fetchRoomReviews = async (roomId: string) => {
  try {
    const response = await booking.get(`/rooms/${roomId}/reviews`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch room reviews: ${error}`);
    throw error;
  }
};

export const fetchAreaReviews = async (areaId: string) => {
  try {
    const response = await booking.get(`/areas/${areaId}/reviews`, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch area reviews: ${error}`);
    throw error;
  }
};

export const checkMaxDailyBookings = async () => {
  try {
    const response = await booking.get('/check-max-bookings/', {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error("Failed to check booking limits:", error);
    throw error;
  }
};

export const getUserBookingsForToday = async () => {
  try {
    const response = await booking.get('/check-max-bookings/', {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    console.error(`Failed to get user booking count: ${error}`);
    throw error;
  }
};

export const checkCanBookToday = async (): Promise<{ canBook: boolean; message?: string }> => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return { canBook: true };
    }

    const response = await booking.get('/check-can-book-today/', {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Error checking booking eligibility: ${error}`);
    return { canBook: true };
  }
}