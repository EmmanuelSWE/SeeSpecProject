import axios from "axios";

const LOCAL_BACKEND_API_BASE_URL = "https://localhost:44311/api";

export function getApiBaseUrl() {
  return process.env.NODE_ENV === "production" ? "/api" : LOCAL_BACKEND_API_BASE_URL;
}

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});
