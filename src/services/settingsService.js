import api from "../api/apiClient";
import { API } from "../api/endpoints";

class SettingsService {
  // ================= UPDATE SETTINGS =================
  async updateSettings(settingsData) {
    try {
      const response = await api.post(API.UPDATE_SETTINGS, settingsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET SETTINGS =================
  async getSettings(userId = null, photographerId = null, guiderId = null) {
    try {
      const response = await api.post(API.GET_SETTINGS, {
        userId,
        photographerId,
        guiderId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new SettingsService();