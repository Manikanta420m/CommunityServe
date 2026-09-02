import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
});

export const registerUser = async (userData) => {
  const response = await authApi.post("/register", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await authApi.post("/login", userData);
  return response.data;
};
