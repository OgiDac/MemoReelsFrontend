import axios from "axios";

const api = axios.create({
  // baseURL: "https://a24b896686e5.ngrok-free.app",
  baseURL: "http://localhost:5175",
  headers: { "ngrok-skip-browser-warning": "69420" },
});

// Add access token to each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If not 401, normal error
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Avoid infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // If already refreshing → wait until refresh is done
    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");

      const res = await axios.post(
        "https://a24b896686e5.ngrok-free.app/public/api/users/refresh",
        { refreshToken }
      );

      const newAccess = res.data.accessToken;
      const newRefresh = res.data.refreshToken;

      localStorage.setItem("accessToken", newAccess);
      localStorage.setItem("refreshToken", newRefresh);

      api.defaults.headers.Authorization = `Bearer ${newAccess}`;

      // Retry all queued requests
      pendingRequests.forEach((cb) => cb(newAccess));
      pendingRequests = [];
      isRefreshing = false;

      // Retry original
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (err) {
      isRefreshing = false;
      pendingRequests = [];

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      window.location.href = "/login"; // logout

      return Promise.reject(err);
    }
  }
);

export default api;
