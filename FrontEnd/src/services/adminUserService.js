import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const userApi = axios.create({
  baseURL: `${API_BASE_URL}/users`,
});

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getUsers = async (params = {}) => {
  const response = await userApi.get("/", { ...authConfig(), params });
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await userApi.put(`/${id}`, data, authConfig());
  return response.data;
};

export const getAssignableUsers = async (department) => {
  const response = await userApi.get("/assignable", {
    ...authConfig(),
    params: department ? { department } : {},
  });
  return response.data;
};
