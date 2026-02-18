import api from "../api/apiClient";
import { API } from "../api/endpoints";

class HomeService {
  // ================= GET HOME DETAILS =================
  async getHomeDetails(userId = null) {
    try {
      const response = await api.post(API.GET_HOME, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET ADMIN DASHBOARD =================
  async getAdminDashboard() {
    try {
      const response = await api.post(API.ADMIN_DASHBOARD);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new HomeService();