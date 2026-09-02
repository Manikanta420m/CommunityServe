import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const historyApi = axios.create({
  baseURL: `${API_BASE_URL}/status-history`,
});

export const getStatusHistory = async (issueId) => {
  const response = await historyApi.get(`/${issueId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
};
