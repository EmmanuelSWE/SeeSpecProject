import axios from "axios";

export function getApiBaseUrl() {
  return "/api";
}

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});
