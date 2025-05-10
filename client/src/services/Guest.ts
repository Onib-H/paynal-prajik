import { guest } from "./_axios";

export const getGuestDetails = async (id: string) => {
  try {
    const { data } = await guest.get(`/${id}`, {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    console.error(`Failed to fetch guest details: ${error}`);
    throw error;
  }
};

export const getGuestBookings = async (
  guestId: string,
  page: number = 1,
  pageSize: number = 5
) => {
  try {
    const response = await guest.get(`/bookings/${guestId}`, {
      params: {
        page,
        page_size: pageSize,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch guest bookings: ${error}`);
    throw error;
  }
};

export const fetchGuestBookings = async ({ page = 1, page_size = 5, status }: {
  page?: number;
  page_size?: number;
  status?: string;
} = {}) => {
  try {
    const response = await guest.get("/bookings", {
      params: {
        page: page,
        page_size: page_size,
        status: status,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch guest bookings: ${error}`);
    throw error;
  }
};

export const updateGuestDetails = async (id: string, data: string[]) => {
  try {
    const response = await guest.put(
      `/update/${id}`,
      {
        data: data,
      },
      {
        withCredentials: true,
      }
    );
    return response;
  } catch (error) {
    console.error(`Failed to update guest details: ${error}`);
    throw error;
  }
};

export const updateProfileImage = async (formData: FormData) => {
  try {
    const response = await guest.put("/change_image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });
    return response;
  } catch (error) {
    console.error(`Failed to update profile image: ${error}`);
    throw error;
  }
};

export const getGuestNotifications = async (offset: number, limit: number) => {
  try {
    const response = await guest.get("/notifications", {
      params: { offset, limit },
      withCredentials: true,
    })
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch guest notifications: ${error}`);
    throw error;
  }
};

export const markNotificationAsRead = async (id: string) => { 
  try {
    const response = await guest.patch(`/notifications/${id}/read`, {}, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to mark notification as read: ${error}`);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await guest.patch('/notifications/read-all', {}, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to mark all notifications as read: ${error}`);
    throw error;
  }
};

export const uploadValidId = async (formData: FormData) => {
  try {
    const response = await guest.put('/upload_valid_id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to upload valid ID: ${error}`);
    throw error;
  }
}