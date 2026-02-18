import api from "../api/apiClient";
import { API } from "../api/endpoints";

class NotificationService {
  // ================= GET NOTIFICATIONS =================
  async getNotifications(userId, userRole, page = 1, perPage = 20) {
    try {
      const response = await api.post(API.GET_NOTIFICATIONS, {
        userId,
        userRole,
        page,
        perPage
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= CREATE NOTIFICATION =================
  async createNotification(notificationData) {
    try {
      const response = await api.post(API.CREATE_NOTIFICATION, notificationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= MARK AS READ =================
  async markAsRead(notificationId) {
    try {
      const response = await api.post(API.MARK_AS_READ_NOTIFICATION, {
        notificationId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE NOTIFICATION =================
  async deleteNotification(notificationId) {
    try {
      const response = await api.post(API.DELETE_NOTIFICATION, {
        notificationId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new NotificationService();