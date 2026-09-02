import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const issueApi = axios.create({
  baseURL: `${API_BASE_URL}/issues`,
});

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const createIssue = async (issueData) => {
  const response = await issueApi.post("/", issueData, authConfig());
  return response.data;
};

export const getIssues = async (params = {}) => {
  const response = await issueApi.get("/", { params });
  return response.data;
};

export const getIssueById = async (id) => {
  const response = await issueApi.get(`/${id}`);
  return response.data;
};

export const voteIssue = async (id) => {
  const response = await issueApi.put(`/${id}/vote`, {}, authConfig());
  return response.data;
};
