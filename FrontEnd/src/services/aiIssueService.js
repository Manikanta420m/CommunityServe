import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const issueAiApi = axios.create({
  baseURL: `${API_BASE_URL}/issues/ai`,
});

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const suggestIssueDetails = async (payload) => {
  const response = await issueAiApi.post("/suggest", payload, authConfig());
  return response.data;
};

export const findSimilarIssues = async (payload) => {
  const response = await issueAiApi.post("/similar", payload, authConfig());
  return response.data;
};
