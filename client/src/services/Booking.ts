import { booking } from "./_axios";

export interface BookingResponse {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_image?: string;
    address?: string;
    phone_number?: string;
  };
  room_details?: {
    id: number;
    room_name: string;
    room_type: string;
    room_price: string;
    room_image?: string;
    description?: string;
    capacity?: number;
    amenities?: Array<{
      id: number;
      description: string;
    }>;
  };
  area_details?: {
    id: number;
    area_name: string;
    area_image?: string;
    description?: string;
    price_per_hour?: string;
    capacity?: number;
    status?: string;
  };
  is_venue_booking?: boolean;
  total_price?: string | number;
  check_in_date: string;
  check_out_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  cancellation_reason?: string;
  valid_id?: string;
}

export interface BookingFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailAddress: string;
  address?: string;
  specialRequests?: string;
  validId: File | null;
  roomId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  status?: "pending" | "confirmed" | "cancelled" | "checked_in" | "checked_out";
  totalPrice?: number;
}

export interface ReservationFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  emailAddress: string;
  address?: string;
  specialRequests?: string;
  validId: File | null;
  areaId: string | null;
  startTime: string | null;
  endTime: string | null;
  totalPrice: number;
  status?: "pending" | "confirmed" | "cancelled";
  isVenueBooking?: boolean;
}

export interface ReviewData {
  id?: number;
  booking: number;
  user?: number;
  review_text: string;
  rating: number;
  created_at?: string;
  formatted_date?: string;
  user_name?: string;
  user_profile_image?: string;
  booking_details?: {
    type: "room" | "venue";
    name: string;
    check_in_date: string;
    check_out_date: string;
  };
}

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
      params: { arrival, departure },
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
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
    formData.append("emailAddress", bookingData.emailAddress);
    formData.append("address", bookingData.address || "");
    formData.append("specialRequests", bookingData.specialRequests || "");

    if (bookingData.validId) {
      formData.append("validId", bookingData.validId);
    }

    formData.append("roomId", bookingData.roomId || "");
    formData.append("checkIn", bookingData.checkIn || "");
    formData.append("checkOut", bookingData.checkOut || "");
    formData.append("status", bookingData.status || "pending");

    if (bookingData.totalPrice !== undefined) {
      formData.append("totalPrice", bookingData.totalPrice.toString());
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

export const createReservation = async (
  reservationData: ReservationFormData
) => {
  try {
    const formData = new FormData();

    formData.append("firstName", reservationData.firstName);
    formData.append("lastName", reservationData.lastName);
    formData.append("phoneNumber", reservationData.phoneNumber);
    formData.append("emailAddress", reservationData.emailAddress);
    formData.append("address", reservationData.address || "");
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

    formData.append("status", reservationData.status || "pending");
    formData.append("isVenueBooking", "true");

    if (reservationData.totalPrice) {
      formData.append("totalPrice", reservationData.totalPrice.toString());
    }

    const response = await booking.post("/bookings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to create reservation: ${error}`);
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
