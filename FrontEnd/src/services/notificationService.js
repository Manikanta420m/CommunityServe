import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const notificationApi = axios.create({
  baseURL: `${API_BASE_URL}/notifications`,
});

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getNotifications = async () => {
  const response = await notificationApi.get("/", authConfig());
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await notificationApi.put(`/${id}/read`, {}, authConfig());
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await notificationApi.put("/read-all", {}, authConfig());
  return response.data;
};
