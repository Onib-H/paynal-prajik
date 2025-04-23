import axios from "axios";

export const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const ADMIN = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/master`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const guest = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/guest`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request/response interceptors for debugging
guest.interceptors.request.use(
  (config) => {
    console.log(`Request to ${config.url}:`, {
      method: config.method?.toUpperCase(),
      headers: config.headers,
      withCredentials: config.withCredentials
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

guest.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    return Promise.reject(error);
  }
);

export const staff = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/staff`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const booking = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/booking`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const reservation = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/reservation`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const room = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/property`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const payment = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/payment`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const area = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/property`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const amenity = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/property`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const transaction = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/transaction`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
