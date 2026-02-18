import api from "../api/apiClient";
import { API } from "../api/endpoints";

class TransactionService {
  // ================= CREATE TRANSACTION =================
  async createTransaction(transactionData) {
    try {
      const response = await api.post(API.CREATE_TRANSACTION, transactionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= UPDATE TRANSACTION =================
  async updateTransaction(transactionId, paymentStatus) {
    try {
      const response = await api.post(API.UPDATE_TRANSACTION, {
        transactionId,
        paymentStatus
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET TRANSACTIONS =================
  async getTransactions(
    userId = null,
    photographerId = null,
    guiderId = null,
    isAdmin = false,
    paymentStatus = null,
    page = 1,
    perPage = 20
  ) {
    try {
      const response = await api.post(API.GET_TRANSACTION, {
        userId,
        photographerId,
        guiderId,
        isAdmin,
        paymentStatus,
        page,
        perPage
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE TRANSACTION =================
  async deleteTransaction(transactionId) {
    try {
      const response = await api.post(API.DELETE_TRANSACTION, { transactionId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new TransactionService();