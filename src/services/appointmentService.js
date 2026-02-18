import api from "../api/apiClient";
import { API } from "../api/endpoints";

class AppointmentService {
  // ================= CREATE APPOINTMENT =================
  async createAppointment(appointmentData) {
    try {
      const response = await api.post(API.CREATE_APPOINTMENT, appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= EDIT APPOINTMENT =================
  async editAppointment(appointmentData) {
    try {
      const response = await api.post(API.EDIT_APPOINTMENT, appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE APPOINTMENT =================
  async deleteAppointment(appointmentId) {
    try {
      const response = await api.post(API.DELETE_APPOINTMENT, { appointmentId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= RESPOND APPOINTMENT =================
  async respondAppointment(appointmentId, status, note = "") {
    try {
      const response = await api.post(API.RESPOND_APPOINTMENT, {
        appointmentId,
        status,
        note
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET APPOINTMENT BY TRANSACTION ID =================
  async getAppointmentByTransactionId(transactionId) {
    try {
      const response = await api.post(API.GET_APPOINTMENT_BY_TRANSACTION_ID, {
        transactionId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= CANCEL APPOINTMENT BY USER =================
  async cancelAppointmentByUser(appointmentId, reason) {
    try {
      const response = await api.post(API.USER_CANCEL_APPOINTMENT, {
        appointmentId,
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET ALL APPOINTMENTS =================
  async getAllAppointments(
    userId = null,
    photographerId = null,
    guiderId = null,
    status = null,
    page = 1,
    perPage = 20
  ) {
    try {
      const response = await api.post(API.GET_APPOINTMENTS, {
        userId,
        photographerId,
        guiderId,
        status,
        page,
        perPage
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new AppointmentService();