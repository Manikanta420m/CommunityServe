import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const feedbackApi = axios.create({ baseURL: `${API_BASE_URL}/feedback` });

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getIssueFeedback = async (issueId) => {
  const response = await feedbackApi.get(`/${issueId}`, authConfig());
  return response.data;
};

export const saveIssueFeedback = async (issueId, data) => {
  const response = await feedbackApi.put(`/${issueId}`, data, authConfig());
  return response.data;
};
