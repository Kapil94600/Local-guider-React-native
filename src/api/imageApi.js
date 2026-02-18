import api from "./apiClient";

export const uploadImage = (formData) =>
  api.post("/images/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getImagesById = (data) =>
  api.post("/images/get_by_id", data);

export const deleteImage = (data) =>
  api.post("/images/delete", data);
