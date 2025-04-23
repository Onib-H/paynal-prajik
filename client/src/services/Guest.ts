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

export const fetchGuestBookings = async ({
  page = 1,
  pageSize = 5,
}: {
  page?: number;
  pageSize?: number;
} = {}) => {
  try {
    const response = await guest.get("/bookings", {
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

export const getGuestNotifications = async () => {
  try {
    console.log('Fetching notifications...');
    // Implement retry logic directly in the function
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const response = await guest.get("/notifications", {
          withCredentials: true,
          // Add a cache buster to prevent caching issues
          params: { _t: Date.now() }
        });

        // Check if the response has the expected structure
        if (response.data && 'notifications' in response.data) {
          console.log('Notifications response:', response.data);
          return response.data;
        } else {
          console.warn('Unexpected notification response format:', response.data);
          throw new Error('Invalid notification response format');
        }
      } catch (error) {
        retries++;
        if (retries > maxRetries) throw error;
        console.warn(`Retry attempt ${retries}/${maxRetries} for notifications`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('Max retries exceeded');
  } catch (error: any) {
    console.error(`Failed to fetch guest notifications: ${error}`);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    }
    throw error;
  }
};

export const markNotificationAsRead = async (id: string) => {
  try {
    // Add retry logic for marking notifications as read
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const response = await guest.patch(`/notifications/${id}/read`, {}, {
          withCredentials: true
        });
        return response.data;
      } catch (error) {
        retries++;
        if (retries > maxRetries) throw error;
        console.warn(`Retry attempt ${retries}/${maxRetries} for marking notification as read`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('Max retries exceeded');
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