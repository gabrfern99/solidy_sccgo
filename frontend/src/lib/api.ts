import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !location.pathname.startsWith("/login")) {
      localStorage.removeItem("token");
      if (!location.pathname.startsWith("/assinar")) {
        location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(err: unknown, fallback = "Ocorreu um erro") {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? fallback;
  }
  return fallback;
}
