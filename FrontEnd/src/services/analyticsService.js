import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const analyticsApi = axios.create({
  baseURL: `${API_BASE_URL}/analytics`,
});

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getAnalytics = async () => {
  const response = await analyticsApi.get("/", authConfig());
  return response.data;
};
