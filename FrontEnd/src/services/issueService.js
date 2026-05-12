import axios from "axios";

const API_URL = "http://localhost:5000/api/issues";

const getToken = () => {
  return localStorage.getItem("token");
};

export const createIssue = async (issueData) => {
  const response = await axios.post(API_URL, issueData, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return response.data;
};

export const getIssues = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};

export const voteIssue = async (id) => {
  const response = await axios.put(
    `${API_URL}/vote/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return response.data;
};