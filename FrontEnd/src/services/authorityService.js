import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authorityApi = axios.create({ baseURL: `${API_BASE_URL}/authority` });

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getAuthorityIssues = async (params = {}) => {
  const response = await authorityApi.get("/issues", { ...authConfig(), params });
  return response.data;
};

export const updateAuthorityIssue = async (id, payload) => {
  const response = await authorityApi.put(`/issues/${id}`, payload, authConfig());
  return response.data;
};
