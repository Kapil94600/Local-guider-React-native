import api from "../api/apiClient";
import { API } from "../api/endpoints";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

class DownloadService {
  // ================= DOWNLOAD USERS =================
  async downloadUsers() {
    try {
      const response = await api.post(API.DOWNLOAD_USERS, {}, {
        responseType: 'blob'
      });
      return await this.saveFile(response.data, 'users.csv');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DOWNLOAD PHOTOGRAPHERS =================
  async downloadPhotographers() {
    try {
      const response = await api.post(API.DOWNLOAD_PHOTOGRAPHERS, {}, {
        responseType: 'blob'
      });
      return await this.saveFile(response.data, 'photographers.csv');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DOWNLOAD GUIDERS =================
  async downloadGuiders() {
    try {
      const response = await api.post(API.DOWNLOAD_GUIDERS, {}, {
        responseType: 'blob'
      });
      return await this.saveFile(response.data, 'guiders.csv');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DOWNLOAD PLACES =================
  async downloadPlaces() {
    try {
      const response = await api.post(API.DOWNLOAD_PLACES, {}, {
        responseType: 'blob'
      });
      return await this.saveFile(response.data, 'places.csv');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DOWNLOAD TRANSACTIONS =================
  async downloadTransactions() {
    try {
      const response = await api.post(API.DOWNLOAD_TRANSACTIONS, {}, {
        responseType: 'blob'
      });
      return await this.saveFile(response.data, 'transactions.csv');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DOWNLOAD WITHDRAWALS =================
  async downloadWithdrawals() {
    try {
      const response = await api.post(API.DOWNLOAD_WITHDRAWALS, {}, {
        responseType: 'blob'
      });
      return await this.saveFile(response.data, 'withdrawals.csv');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= SAVE FILE =================
  async saveFile(blob, filename) {
    try {
      const fileUri = FileSystem.documentDirectory + filename;
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          }
          
          resolve(fileUri);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw error;
    }
  }
}

export default new DownloadService();