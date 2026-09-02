import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authApi = axios.create({ baseURL: `${API_BASE_URL}/auth` });
const usersApi = axios.create({ baseURL: `${API_BASE_URL}/users` });

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getCurrentUser = async () => {
  const response = await authApi.get("/me", authConfig());
  return response.data.user;
};

export const getAssignableUsers = async () => {
  const response = await usersApi.get("/assignable", authConfig());
  return response.data;
};
