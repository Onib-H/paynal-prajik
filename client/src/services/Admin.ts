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

export const fetchStats = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/stats", {
      params: { month, year },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch stats: ${error}`);
    throw error;
  }
};

export const fetchDailyRevenue = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/daily_revenue", {
      params: { month, year },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily revenue: ${error}`);
    throw error;
  }
};

export const fetchDailyBookings = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/daily_bookings", {
      params: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily bookings: ${error}`);
    throw error;
  }
};

export const fetchDailyOccupancy = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/daily_occupancy", {
      params: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily occupancy: ${error}`);
    throw error;
  }
};

export const fetchDailyCheckInsCheckOuts = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/daily_checkins_checkouts", {
      params: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily check-ins/check-outs: ${error}`);
    throw error;
  }
};

export const fetchDailyCancellations = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/daily_cancellations", {
      params: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily cancellations: ${error}`);
    throw error;
  }
};

export const fetchDailyNoShowsRejected = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/daily_no_shows_rejected", {
      params: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily no-shows and rejected bookings: ${error}`);
    throw error;
  }
};

export const fetchRoomRevenue = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/room_revenue", {
      params: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch room revenue: ${error}`);
    throw error;
  }
};

export const fetchRoomBookings = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/room_bookings", {
      params: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch room bookings: ${error}`);
    throw error;
  }
};

export const fetchBookingStatusCounts = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/booking_status_counts", {
      params: {
        month,
        year
      },
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
export const fetchAllUsers = async (page: number, pageSize: number) => {
  try {
    const response = await ADMIN.get("/users", {
      params: {
        page,
        page_size: pageSize,
      },
      withCredentials: true,
    });
    return response.data;
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
export const fetchRooms = async (page: number, pageSize: number) => {
  try {
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

export const editRoom = async (roomId: number, payload: FormData): Promise<{ data: any }> => {
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
export const fetchAreas = async (page: number, pageSize: number) => {
  try {
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

export const editArea = async (areaId: number, payload: FormData): Promise<{ data: any }> => {
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

export const createAmenity = async (payload: { description: string }): Promise<{ data: any }> => {
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

export const updateAmenity = async (amenityId: number, payload: { description: string }) => {
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

export const updateBookingStatus = async (bookingId: number, data: Record<string, any>) => {
  try {
    const payload = {
      status: data.status,
      ...(Object.prototype.hasOwnProperty.call(data, "set_available")
        ? { set_available: data.set_available }
        : {}),
      ...(data.reason ? { reason: data.reason } : {}),
    };

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

export const recordPayment = async (bookingId: number, amount: number, transactionType: "booking" | "reservation" | "cancellation_refund" = "booking") => {
  try {
    const response = await ADMIN.post(`/booking/${bookingId}/payment`, {
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

export const getAllBookings = async ({ page = 1, pageSize = 9 }: { page?: number; pageSize?: number } = {}) => {
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

export const fetchOccupancyRate = async (period: "daily" | "weekly" | "monthly" | "yearly" = "monthly") => {
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

export const fetchRevenueAnalytics = async (period: "daily" | "weekly" | "monthly" | "yearly" = "monthly") => {
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

export const generatePdfReport = async (reportType: string, dateRange?: { start: string; end: string }) => {
  try {
    const response = await ADMIN.post("/generate_report", {
      report_type: reportType,
      ...(dateRange && { date_range: dateRange }),
    }, {
      responseType: "blob",
      withCredentials: true,
    }
    );

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

export const fetchDailyRoomRevenue = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const response = await ADMIN.get("/daily_room_revenue", {
      params: {
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear()
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch daily room revenue: ${error}`);
    throw error;
  }
};

export const fetchMonthlyRevenue = async ({ month, year }: { month?: number; year?: number } = {}) => {
  try {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    endDate.setHours(23, 59, 59, 999);

    const response = await ADMIN.get("/bookings", {
      params: {
        page_size: 500,
        month: currentMonth,
        year: currentYear
      },
      withCredentials: true,
    });

    const allBookings = response.data.data || [];

    const relevantBookings = allBookings.filter((booking: any) => {
      if (!booking.check_in_date || !booking.check_out_date) return false;

      const checkInDate = new Date(booking.check_in_date);
      const checkOutDate = new Date(booking.check_out_date);

      return (
        (checkInDate <= endDate && checkOutDate >= startDate) &&
        (booking.status === "checked_in" || booking.status === "checked_out")
      );
    });

    let totalRevenue = 0;

    relevantBookings.forEach((booking: any) => {
      try {
        if (booking.total_price) {
          const totalPrice = typeof booking.total_price === 'string'
            ? parseFloat(booking.total_price.replace(/[^\d.]/g, ''))
            : booking.total_price;
          totalRevenue += totalPrice || 0;
          return;
        }

        let basePrice = 0;

        if (booking.is_venue_booking && booking.area_details) {
          if (booking.area_details.price_per_hour) {
            const priceString = booking.area_details.price_per_hour;
            basePrice = parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;
          }
          totalRevenue += basePrice;
          return;
        } else if (!booking.is_venue_booking && booking.room_details) {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);

          const monthStart = startDate;
          const monthEnd = endDate;

          const effectiveStart = checkIn < monthStart ? monthStart : checkIn;
          const effectiveEnd = checkOut > monthEnd ? monthEnd : checkOut;

          const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
          const nights = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);

          if (booking.room_details.room_price) {
            const priceString = booking.room_details.room_price;
            basePrice = parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;
          }

          totalRevenue += basePrice * nights;
          return;
        }
      } catch (error) {
        console.error(`Error calculating booking price: ${error}`);
      }
    });

    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    });

    return {
      revenue: totalRevenue,
      formatted_revenue: formatter.format(totalRevenue).replace('PHP', '₱')
    };
  } catch (error) {
    console.error(`Failed to fetch monthly revenue: ${error}`);
    throw error;
  }
};
