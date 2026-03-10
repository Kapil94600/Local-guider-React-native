// api/endpoints.js
export const API = {
  // Authentication
  REGISTER: "/user/register",
  LOGIN: "/user/login",
  FORGET_PASSWORD: "/user/forget_password",
  UPDATE_PROFILE: "/user/update",
  GET_PROFILE: "/user/get_profile",
  DELETE_USER: "/user/delete",
  GET_USER_LIST: "/user/get_user_list",
  UPDATE_PROFILE_PICTURE: "/user/update_profile_picture",
  CHANGE_PASSWORD: "/user/change_password",
  CHECK_PHONE_EXISTS: "/user/check_phone_exist",
  CHECK_USERNAME_EXISTS: "/user/check_username_exist",
  ADD_BALANCE: "/user/add_balance",

  // Photographer
  REQUEST_FOR_PHOTOGRAPHER: "/photographers/request",
  REQUEST_TEST: "/photographers/test",
  CHANGE_PHOTOGRAPHER_ACTIVE_STATUS: "/photographers/change_active_status",
  RESPOND_PHOTOGRAPHER_REQUEST: "/photographers/respond_on_request",
  UPDATE_PHOTOGRAPHER: "/photographers/update",
  DELETE_PHOTOGRAPHER: "/photographers/delete",
  GET_PHOTOGRAPHERS_BY_PLACE_ID: "/photographers/get_by_place",
  GET_PHOTOGRAPHERS_ALL: "/photographers/get_all",
  GET_PHOTOGRAPHERS_DETAILS: "/photographers/details",
  GET_PHOTOGRAPHERS_REQUESTS: "/photographers/all_requests",

  // Guider
  REQUEST_FOR_GUIDER: "/guider/request",
  RESPOND_GUIDER_REQUEST: "/guider/respond_on_request",
  CHANGE_GUIDER_ACTIVE_STATUS: "/guider/change_active_status",
  UPDATE_GUIDER: "/guider/update",
  DELETE_GUIDER: "/guider/delete",
  GET_GUIDERS_BY_PLACE_ID: "/guider/get_by_place",
  GET_GUIDERS_ALL: "/guider/get_all",
  GET_GUIDERS_DETAILS: "/guider/details",

  // Images
  ADD_IMAGE: "/images/add",
  ALL_IMAGES: "/images/get_all",
  ALL_IMAGES_BY_ID: "/images/get_by_id",
  DELETE_IMAGE: "/images/delete",
  READ_IMAGES: "/Uploads/{imagePath:.+}",
  DOWNLOAD_IMAGE: "/image/download/{path}",

  // Places
  ADD_PLACE: "/places/add",
  EDIT_PLACE: "/places/edit",
  GET_PLACES: "/places/get",
  GET_PLACES_BY_IDS: "/places/get_by_ids",
  DELETE_PLACE: "/places/delete",
  ADD_VIEW: "/places/add_view",

  // Time Slots
  ADD_TIMESLOT: "/timeslots/add",
  DELETE_TIMESLOT: "/timeslots/delete",
  GET_ALL_TIMESLOTS: "/timeslots/get_all",

  // Reviews
  ADD_REVIEW: "/review/add",
  DELETE_REVIEW: "/review/delete",
  GET_ALL_REVIEW: "/review/get_all",           // all reviews (admin)
  GET_REVIEWS_BY_ID: "/review/get_by_id",       // for place/photographer/guider

  // Appointments
  CREATE_APPOINTMENT: "/appointment/create",
  EDIT_APPOINTMENT: "/appointment/edit",
  DELETE_APPOINTMENT: "/appointment/delete",
  RESPOND_APPOINTMENT: "/appointment/respond",
  GET_APPOINTMENT_BY_TRANSACTION_ID: "/appointment/get_by_transaction_id",
  USER_CANCEL_APPOINTMENT: "/appointment/cancel_by_user",
  GET_APPOINTMENTS: "/appointment/get_all",

  // Home
  GET_HOME: "/main/home_details",
  ADMIN_DASHBOARD: "/main/admin_dashboard",

  // Services
  CREATE_SERVICE: "/service/create",
  UPDATE_SERVICE: "/service/update",
  GET_SERVICES: "/service/get",
  DELETE_SERVICE: "/service/delete",

  // Transactions
  CREATE_TRANSACTION: "/transaction/create",
  UPDATE_TRANSACTION: "/transaction/update",
  GET_TRANSACTION: "/transaction/get",
  DELETE_TRANSACTION: "/transaction/delete",

  // Withdrawals
  CREATE_WITHDRAWAL: "/withdrawal/create",
  RESPOND_WITHDRAWAL: "/withdrawal/respond",
  GET_WITHDRAWAL: "/withdrawal/get",

  // Settings
  UPDATE_SETTINGS: "/settings/update",
  GET_SETTINGS: "/settings/get",

  // Privacy Policy
  PRIVACY_POLICY: "/privacy_policy",

  // Maps
  MAP_GET_PLACES: "/map/get_places",
  MAP_GET_LAT_LNG: "/map/get_lat_lng",

  // Downloads (admin)
  DOWNLOAD_USERS: "/download/users",
  DOWNLOAD_PHOTOGRAPHERS: "/download/photographers",
  DOWNLOAD_GUIDERS: "/download/guiders",
  DOWNLOAD_PLACES: "/download/places",
  DOWNLOAD_TRANSACTIONS: "/download/transactions",
  DOWNLOAD_WITHDRAWALS: "/download/withdrawals",

  // Notifications
  GET_NOTIFICATIONS: "/notification/get_by_id",
  CREATE_NOTIFICATION: "/notification/create",
  MARK_AS_READ_NOTIFICATION: "/notification/mark_as_read",
  DELETE_NOTIFICATION: "/notification/delete",
};