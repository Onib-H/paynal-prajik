/* eslint-disable @typescript-eslint/no-explicit-any */
import { ADMIN } from "./_axios";

export const fetchAdminProfile = async () => {
  try {
    const response = await ADMIN.get("/details", {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    console.error(`Failed to fetch admin profile: ${error}`);
    throw error;
  }
};

export const fetchStaffProfile = async () => {
  try {
    const response = await ADMIN.get("/staff_detail", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch staff details: ${error}`);
    throw error;
  }
};

export const fetchStats = async () => {
  try {
    const response = await ADMIN.get("/stats", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch stats: ${error}`);
    throw error;
  }
};

export const fetchBookingStatusCounts = async () => {
  try {
    const response = await ADMIN.get("/booking_status_counts", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch booking status counts: ${error}`);
    throw error;
  }
};

export const areaReservations = async () => {
  try {
    const response = await ADMIN.get("/area_reservations", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch area reservations: ${error}`);
    throw error;
  }
};

// CRUD Users
export const fetchAllUsers = async () => {
  try {
    const response = await ADMIN.get("/users", {
      withCredentials: true,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to fetch users: ${error}`);
    throw error;
  }
};

export const fetchUserDetails = async (userId: number) => {
  try {
    const response = await ADMIN.get(`/user/${userId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user details: ${error}`);
    throw error;
  }
};

export const manageUser = async (userId: number, payload: FormData) => {
  try {
    const response = await ADMIN.put(`/edit_user/${userId}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to manage user: ${error}`);
    throw error;
  }
};

export const archiveUser = async (userId: number) => {
  try {
    const response = await ADMIN.delete(`/archive_user/${userId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to archive user: ${error}`);
    throw error;
  }
};

// CRUD Rooms
export const fetchRooms = async ({ queryKey }: any) => {
  try {
    const [, page = 1, pageSize = 9] = queryKey;
    const response = await ADMIN.get("/rooms", {
      params: {
        page,
        page_size: pageSize,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch rooms: ${error}`);
    throw error;
  }
};

export const addNewRoom = async (payload: FormData): Promise<{ data: any }> => {
  try {
    const response = await ADMIN.post("/add_room", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch areas: ${error}`);
    throw error;
  }
};

export const roomDetail = async (roomId: number) => {
  try {
    const response = await ADMIN.get(`/show_room/${roomId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch room detail: ${error}`);
    throw error;
  }
};

export const editRoom = async (
  roomId: number,
  payload: FormData
): Promise<{ data: any }> => {
  try {
    const response = await ADMIN.put(`/edit_room/${roomId}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to edit room: ${error}`);
    throw error;
  }
};

export const deleteRoom = async (roomId: number) => {
  try {
    const response = await ADMIN.delete(`/delete_room/${roomId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to delete room: ${error}`);
    throw error;
  }
};

// CRUD Areas
export const fetchAreas = async ({ queryKey }: any) => {
  try {
    const [, page = 1, pageSize = 9] = queryKey;
    const response = await ADMIN.get("/areas", {
      params: {
        page,
        page_size: pageSize,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch areas: ${error}`);
    throw error;
  }
};

export const addNewArea = async (payload: FormData): Promise<{ data: any }> => {
  try {
    const response = await ADMIN.post("/add_area", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to add area: ${error}`);
    throw error;
  }
};

export const areaDetail = async (areaId: number) => {
  try {
    const response = await ADMIN.get(`/show_area/${areaId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch area detail: ${error}`);
    throw error;
  }
};

export const editArea = async (
  areaId: number,
  payload: FormData
): Promise<{ data: any }> => {
  try {
    const response = await ADMIN.put(`/edit_area/${areaId}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to edit area: ${error}`);
    throw error;
  }
};

export const deleteArea = async (areaId: number) => {
  try {
    const response = await ADMIN.delete(`/delete_area/${areaId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to delete area: ${error}`);
    throw error;
  }
};

// CRUD Amenities
export const fetchAmenities = async ({ queryKey }: any) => {
  try {
    const [, page, pageSize] = queryKey;
    const response = await ADMIN.get(
      `/amenities?page=${page}&page_size=${pageSize}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch amenities: ${error}`);
    throw error;
  }
};

export const createAmenity = async (payload: {
  description: string;
}): Promise<{ data: any }> => {
  try {
    const response = await ADMIN.post("/add_amenity", payload, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to add amenity: ${error}`);
    throw error;
  }
};

export const readAmenity = async (amenityId: number) => {
  try {
    const response = await ADMIN.get(`/show_amenity/${amenityId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to read amenity: ${error}`);
    throw error;
  }
};

export const updateAmenity = async (
  amenityId: number,
  payload: { description: string }
) => {
  try {
    const response = await ADMIN.put(`/edit_amenity/${amenityId}`, payload, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to update amenity: ${error}`);
    throw error;
  }
};

export const deleteAmenity = async (amenityId: number) => {
  try {
    const response = await ADMIN.delete(`/delete_amenity/${amenityId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to delete amenity: ${error}`);
    throw error;
  }
};

// Booking Management
export const updateBookingStatus = async (
  bookingId: number,
  data: Record<string, any>
) => {
  try {
    // Ensure data is properly formatted
    const payload = {
      status: data.status,
      // Include set_available whether true or false if explicitly set
      ...(Object.prototype.hasOwnProperty.call(data, "set_available")
        ? { set_available: data.set_available }
        : {}),
      // Only include reason if provided
      ...(data.reason ? { reason: data.reason } : {}),
    };

    console.log("Sending booking status update:", payload);

    const response = await ADMIN.put(`/booking/${bookingId}/status`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to update booking status: ${error}`);
    throw error;
  }
};

export const recordPayment = async (
  bookingId: number,
  amount: number,
  transactionType: "booking" | "reservation" | "cancellation_refund" = "booking"
) => {
  try {
    const response = await ADMIN.post(
      `/booking/${bookingId}/payment`,
      {
        amount,
        transaction_type: transactionType,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to record payment: ${error}`);
    throw error;
  }
};

export const getBookingDetails = async (bookingId: number) => {
  try {
    const response = await ADMIN.get(`/booking/${bookingId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch booking details: ${error}`);
    throw error;
  }
};

export const getAllBookings = async ({
  page = 1,
  pageSize = 9,
}: {
  page?: number;
  pageSize?: number;
} = {}) => {
  try {
    const response = await ADMIN.get("/bookings", {
      params: {
        page,
        page_size: pageSize,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch all bookings: ${error}`);
    throw error;
  }
};
// Enhanced Dashboard Analytics
export const fetchOccupancyRate = async (
  period: "daily" | "weekly" | "monthly" | "yearly" = "monthly"
) => {
  try {
    const response = await ADMIN.get("/occupancy_rate", {
      params: { period },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch occupancy rate: ${error}`);
    throw error;
  }
};

export const fetchRevenueAnalytics = async (
  period: "daily" | "weekly" | "monthly" | "yearly" = "monthly"
) => {
  try {
    const response = await ADMIN.get("/revenue_analytics", {
      params: { period },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch revenue analytics: ${error}`);
    throw error;
  }
};

export const fetchBookingAnalytics = async () => {
  try {
    const response = await ADMIN.get("/booking_analytics", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch booking analytics: ${error}`);
    throw error;
  }
};

export const fetchCustomerAnalytics = async () => {
  try {
    const response = await ADMIN.get("/customer_analytics", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch customer analytics: ${error}`);
    throw error;
  }
};

export const generatePdfReport = async (
  reportType: string,
  dateRange?: { start: string; end: string }
) => {
  try {
    const response = await ADMIN.post(
      "/generate_report",
      {
        report_type: reportType,
        ...(dateRange && { date_range: dateRange }),
      },
      {
        responseType: "blob",
        withCredentials: true,
      }
    );

    // Create download link for PDF
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${reportType}_report.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  } catch (error) {
    console.error(`Failed to generate ${reportType} report: ${error}`);
    throw error;
  }
};
