import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const leaderApi = axios.create({ baseURL: `${API_BASE_URL}/leader` });

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getLeaderOverview = async () => {
  const response = await leaderApi.get("/overview", authConfig());
  return response.data;
};

export const getLeaderIssues = async (params = {}) => {
  const response = await leaderApi.get("/issues", { ...authConfig(), params });
  return response.data;
};

export const getLeaderTeam = async () => {
  const response = await leaderApi.get("/team", authConfig());
  return response.data;
};

export const updateLeaderIssue = async (id, payload) => {
  const response = await leaderApi.put(`/issues/${id}`, payload, authConfig());
  return response.data;
};
