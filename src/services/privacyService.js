import api from "../api/apiClient";
import { API } from "../api/endpoints";

class PrivacyService {
  // ================= GET PRIVACY POLICY =================
  async getPrivacyPolicy() {
    try {
      const response = await api.post(API.PRIVACY_POLICY);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new PrivacyService();