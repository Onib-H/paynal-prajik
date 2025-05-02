import { area } from "./_axios";

export const fetchAreas = async () => {
  try {
    const response = await area.get("/areas", {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching areas: ${error}`);
    throw error;
  }
};

export const fetchAreaDetail = async (id: string) => {
  try {
    const response = await area.get(`/areas/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch area detail: ${error}`);
    throw error;
  }
};
