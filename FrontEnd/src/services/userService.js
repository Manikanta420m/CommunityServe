import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const userApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
});

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getCurrentUser = async () => {
  const response = await userApi.get("/me", authConfig());
  return response.data.user;
};
