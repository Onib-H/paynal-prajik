import { room } from "./_axios";

export const fetchAllRooms = async () => {
  try {
    const response = await room.get("/rooms", {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching rooms: ${error}`);
    throw error;
  }
};

export const fetchRoomDetail = async (id: string | number) => {
  try {
    const response = await room.get(`/rooms/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch room detail: ${error}`);
    throw error;
  }
};
