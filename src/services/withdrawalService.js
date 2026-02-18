import api from "../api/apiClient";
import { API } from "../api/endpoints";

class WithdrawalService {
  // ================= CREATE WITHDRAWAL =================
  async createWithdrawal(withdrawalData) {
    try {
      const response = await api.post(API.CREATE_WITHDRAWAL, withdrawalData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= RESPOND WITHDRAWAL =================
  async respondWithdrawal(withdrawalId, status, note = "") {
    try {
      const response = await api.post(API.RESPOND_WITHDRAWAL, {
        withdrawalId,
        status,
        note
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET WITHDRAWALS =================
  async getWithdrawals(
    photographerId = null,
    guiderId = null,
    page = 1,
    perPage = 20
  ) {
    try {
      const response = await api.post(API.GET_WITHDRAWAL, {
        photographerId,
        guiderId,
        page,
        perPage
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new WithdrawalService();