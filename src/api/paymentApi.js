import api from "./apiClient";

export const createTransaction = async (userId, amount) => {

  const formData = new FormData();

  formData.append("userId", userId);
  formData.append("amount", amount);
  formData.append("photographerId", "");
  formData.append("guiderId", "");

  const response = await api({
    method: "post",
    url: "/transaction/create",
    data: formData
  });

  return response.data;

};