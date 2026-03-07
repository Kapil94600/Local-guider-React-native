// api/endpoints.js

export const API = {
  // AUTH
  REGISTER: "/user/register",
  LOGIN: "/user/login",
  FORGET_PASSWORD: "/user/forget_password",
  UPDATE_PROFILE: "/user/update_profile",   // Ensure this matches backend
  GET_PROFILE: "/user/get_profile",
  DELETE_USER: "/user/delete",
  GET_USER_LIST: "/user/get_user_list",
  UPDATE_PROFILE_PICTURE: "/user/update_profile_picture",   // ✅ IMPORTANT
  CHANGE_PASSWORD: "/user/change_password",
  CHECK_PHONE_EXISTS: "/user/check_phone_exist",
  CHECK_USERNAME_EXISTS: "/user/check_username_exist",
  ADD_BALANCE: "/user/add_balance",

  // PHOTOGRAPHER
  REQUEST_FOR_PHOTOGRAPHER: "/photographers/request",
  CHANGE_PHOTOGRAPHER_ACTIVE_STATUS: "/photographers/change_active_status",
  RESPOND_PHOTOGRAPHER_REQUEST: "/photographers/respond_on_request",
  UPDATE_PHOTOGRAPHER: "/photographers/update",
  DELETE_PHOTOGRAPHER: "/photographers/delete",
  GET_PHOTOGRAPHERS_BY_PLACE_ID: "/photographers/get_by_place",
  GET_PHOTOGRAPHERS_ALL: "/photographers/get_all",
  GET_PHOTOGRAPHERS_DETAILS: "/photographers/details",
  GET_PHOTOGRAPHERS_REQUESTS: "/photographers/all_requests",

  // GUIDER
  REQUEST_FOR_GUIDER: "/guider/request",
  RESPOND_GUIDER_REQUEST: "/guider/respond_on_request",
  CHANGE_GUIDER_ACTIVE_STATUS: "/guider/change_active_status",
  UPDATE_GUIDER: "/guider/update",
  DELETE_GUIDER: "/guider/delete",
  GET_GUIDERS_BY_PLACE_ID: "/guider/get_by_place",
  GET_GUIDERS_ALL: "/guider/get_all",
  GET_GUIDERS_DETAILS: "/guider/details",

  // IMAGES
  ADD_IMAGE: "/images/add",
  ALL_IMAGES: "/images/get_all",
  ALL_IMAGES_BY_ID: "/images/get_by_id",
  DELETE_IMAGE: "/images/delete",
  DOWNLOAD_IMAGE: "/image/download",

  // PLACES
  ADD_PLACE: "/places/add",
  EDIT_PLACE: "/places/edit",
  GET_PLACES: "/places/get",
  GET_PLACES_BY_IDS: "/places/get_by_ids",
  DELETE_PLACE: "/places/delete",
  ADD_VIEW: "/places/add_view",

  // REVIEWS
  ADD_REVIEW: "/review/add",
  GET_ALL_REVIEW: "/review/get_all",   // ✅ YEH HONA CHAHIYE
  DELETE_REVIEW: "/review/delete",

  // APPOINTMENTS
  CREATE_APPOINTMENT: "/appointment/create",
  EDIT_APPOINTMENT: "/appointment/edit",
  DELETE_APPOINTMENT: "/appointment/delete",
  RESPOND_APPOINTMENT: "/appointment/respond",
  GET_APPOINTMENT_BY_TRANSACTION_ID: "/appointment/get_by_transaction_id",
  USER_CANCEL_APPOINTMENT: "/appointment/cancel_by_user",
  GET_APPOINTMENTS: "/appointment/get_all",

  // HOME
  GET_HOME: "/main/home_details",
  ADMIN_DASHBOARD: "/main/admin_dashboard",

  // SERVICES
  CREATE_SERVICE: "/service/create",
  UPDATE_SERVICE: "/service/update",
  GET_SERVICES: "/service/get",
  DELETE_SERVICE: "/service/delete",

  // TRANSACTIONS
  CREATE_TRANSACTION: "/transaction/create",
  UPDATE_TRANSACTION: "/transaction/update",
  GET_TRANSACTION: "/transaction/get",
  DELETE_TRANSACTION: "/transaction/delete",

  // WITHDRAWALS
  CREATE_WITHDRAWAL: "/withdrawal/create",
  RESPOND_WITHDRAWAL: "/withdrawal/respond",
  GET_WITHDRAWAL: "/withdrawal/get",

  // SETTINGS
  UPDATE_SETTINGS: "/settings/update",
  GET_SETTINGS: "/settings/get",

  // MAPS
  MAP_GET_PLACES: "/map/get_places",
  MAP_GET_LAT_LNG: "/map/get_lat_lng",

  // NOTIFICATIONS
  GET_NOTIFICATIONS: "/notification/get_by_id",
  CREATE_NOTIFICATION: "/notification/create",
  MARK_AS_READ_NOTIFICATION: "/notification/mark_as_read",
  DELETE_NOTIFICATION: "/notification/delete",
};