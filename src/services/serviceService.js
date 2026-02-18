import api from "../api/apiClient";
import { API } from "../api/endpoints";

class ServiceService {
  // ================= CREATE SERVICE =================
  async createService(formData) {
    try {
      const response = await api.post(API.CREATE_SERVICE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= UPDATE SERVICE =================
  async updateService(formData) {
    try {
      const response = await api.post(API.UPDATE_SERVICE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET SERVICES =================
  async getServices(photographerId = null, guiderId = null) {
    try {
      const response = await api.post(API.GET_SERVICES, {
        photographerId,
        guiderId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE SERVICE =================
  async deleteService(serviceId) {
    try {
      const response = await api.post(API.DELETE_SERVICE, { serviceId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new ServiceService();