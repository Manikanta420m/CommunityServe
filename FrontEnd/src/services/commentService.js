import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const commentApi = axios.create({
  baseURL: `${API_BASE_URL}/comments`,
});

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getComments = async (issueId) => {
  const response = await commentApi.get(`/${issueId}`);
  return response.data;
};

export const createComment = async (issueId, content) => {
  const response = await commentApi.post(
    `/${issueId}`,
    { content },
    authConfig()
  );
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await commentApi.delete(`/${commentId}`, authConfig());
  return response.data;
};
