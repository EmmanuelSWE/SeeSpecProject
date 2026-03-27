import axios from "axios";

const DEFAULT_API_BASE_URL = "https://localhost:44311";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json"
  }
});
