import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const departmentApi = axios.create({ baseURL: `${API_BASE_URL}/departments` });

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getDepartments = async () => {
  const response = await departmentApi.get("/", authConfig());
  return response.data;
};

export const createDepartment = async (payload) => {
  const response = await departmentApi.post("/", payload, authConfig());
  return response.data;
};
