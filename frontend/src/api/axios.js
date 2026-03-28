import axios from "axios";
import { getStoredToken } from "../utils/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((req) => {
  const token = getStoredToken();

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export function extractErrorMessage(error, fallback = "Something went wrong.") {
  if (error?.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  return error?.response?.data?.message || error?.message || fallback;
}

export default API;
