import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
  Image,
  Modal,
  TextInput,
  FlatList,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { API } from "../api/endpoints";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import MenuModal from "../components/MenuModal";
import { useMediaLibraryPermissions } from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

// Helper to construct full image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (typeof path !== "string") return null;
  if (path.startsWith("http")) return path;
  try {
    const filename = path.split("/").pop();
    return `${BASE_URL}/api/image/download/${filename}`;
  } catch (error) {
    console.error("Error parsing image path:", error);
    return null;
  }
};

export default function FullGuiderDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const guiderId = user?.gid; // Professional ID

  // ============ STATE ============
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [hiddenServices, setHiddenServices] = useState([]);
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallet, setWallet] = useState(0);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [places, setPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);

  // Modal states
  const [serviceModal, setServiceModal] = useState(false);
  const [galleryModal, setGalleryModal] = useState(false);
  const [withdrawalModal, setWithdrawalModal] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  // Form states
  const [rejectionReason, setRejectionReason] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifsc: "",
    upiId: "",
  });
  const [commissionRate] = useState(12); // 12% commission

  // Service Form
  const [serviceForm, setServiceForm] = useState({
    id: null,
    title: "",
    description: "",
    servicePrice: "",
    image: null,
  });

  // Edit Profile Form
  const [editForm, setEditForm] = useState({
    firmName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    experience: "",
    languages: "",
    placeId: "",
    places: "",
  });

  const [mediaLibraryPermission, requestMediaLibraryPermission] = useMediaLibraryPermissions();

  // ============ DATA LOADING ============
 // Update loadAllData to remove fetchUserProfile
const loadAllData = async () => {
  if (!guiderId) return;
  try {
    setLoading(true);
    await Promise.all([
      loadGuiderDetails(),
      loadBookings(),
      loadServices(),
      loadGallery(),
      loadTransactions(),
      loadWithdrawals(),
      loadNotifications(),
      loadPlaces(),
      // ❌ Remove fetchUserProfile()
    ]);
  } catch (error) {
    console.log("Dashboard Error:", error);
  } finally {
    setLoading(false);
  }
};


  // Fetch guider balance directly from guider details
  const fetchGuiderBalance = async () => {
  if (!guiderId) return;
  try {
    const params = new URLSearchParams();
    params.append("guiderId", guiderId.toString());
    const response = await api.post(API.GET_GUIDERS_DETAILS, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (response.data?.status && response.data?.data) {
      const guiderData = response.data.data;
      setWallet(guiderData.balance || 0);
      setPendingWithdrawal(guiderData.pendingWithdrawal || 0);
    }
  } catch (err) {
    console.error("Balance fetch error:", err);
  }
};

 const loadGuiderDetails = async () => {
  if (!guiderId) return;
  try {
    const params = new URLSearchParams();
    params.append("guiderId", guiderId.toString());
    const config = { headers: { "Content-Type": "application/x-www-form-urlencoded" } };

    const response = await api.post(API.GET_GUIDERS_DETAILS, params.toString(), config);
    if (response.data?.status) {
      const guiderData = response.data.data;
      setProfile(guiderData);
      setIsActive(guiderData.active || false);
      setWallet(guiderData.balance || 0);
      // ... rest of the code
    }
  } catch (error) {
    console.log("Error loading guider details:", error);
  }
};


  const loadBookings = async () => {
    if (!guiderId) return;
    try {
      const statuses = ["REQUESTED", "ACCEPTED", "COMPLETED", "CANCELED", "REJECTED"];
      let allBookings = [];

      for (const status of statuses) {
        const params = new URLSearchParams();
        params.append("guiderId", guiderId.toString());
        params.append("status", status);
        params.append("page", "1");
        params.append("perPage", "50");

        const response = await api.post(API.GET_APPOINTMENTS, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        if (response.data?.status && Array.isArray(response.data.data)) {
          const mapped = response.data.data.map((item) => ({
            id: item.id,
            serviceTitle: item.serviceName || item.serviceTitle || "Tour Package",
            customerName: item.customerName || "Tourist",
            amount: item.serviceCost || item.totalPayment || item.totalAmount || 0,
            status: (item.appointmentStatus || item.status || "").toUpperCase(),
            createdOn: item.date || item.createdOn,
            time: item.time || "Flexible",
            customerPhone: item.customerPhone,
            rating: item.rating,
            feedback: item.feedback,
          }));
          allBookings = [...allBookings, ...mapped];
        }
      }

      allBookings.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
      setBookings(allBookings);
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
    }
  };

  const loadServices = async () => {
  if (!guiderId) return;
  try {
    console.log("📡 Loading services for guider ID:", guiderId);
    const params = new URLSearchParams();
    params.append("guiderId", guiderId.toString());
    const response = await api.post(API.GET_SERVICES, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (response.data?.status) {
      console.log("✅ Services loaded:", response.data.data?.length || 0);
      setServices(response.data.data || []);
    } else {
      setServices([]);
    }
  } catch (error) {
    console.error("Error loading services:", error);
    setServices([]);
  }
};

  const loadGallery = async () => {
    if (!guiderId) return;
    try {
      const params = new URLSearchParams();
      params.append("guiderId", guiderId.toString());
      params.append("page", "1");
      const response = await api.post(API.ALL_IMAGES_BY_ID, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) setGallery(response.data.data || []);
    } catch (error) {
      console.error("Error loading gallery:", error);
    }
  };

  const loadTransactions = async () => {
    if (!guiderId) return;
    try {
      const params = new URLSearchParams();
      params.append("guiderId", guiderId.toString());
      params.append("page", "1");
      const response = await api.post(API.GET_TRANSACTION, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) setTransactions(response.data.data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadWithdrawals = async () => {
    if (!guiderId) return;
    try {
      const params = new URLSearchParams();
      params.append("guiderId", guiderId.toString());
      params.append("page", "1");
      const response = await api.post(API.GET_WITHDRAWAL, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) {
        const list = response.data.data || [];
        setWithdrawals(list);
        const pending = list
          .filter((w) => w.paymentStatus === "In Progress")
          .reduce((sum, w) => sum + (w.amount || 0), 0);
        setPendingWithdrawal(pending);
      }
    } catch (error) {
      console.log("Error loading withdrawals:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const params = new URLSearchParams();
      params.append("userId", user?.gid.toString());
      params.append("userRole", "GUIDER");
      params.append("page", "1");
      const response = await api.post(API.GET_NOTIFICATIONS, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) setNotifications(response.data.data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadPlaces = async () => {
    try {
      const response = await api.post(API.GET_PLACES, { page: 1, perPage: 100 });
      if (response.data?.status) setPlaces(response.data.data || []);
    } catch (error) {
      console.error("Error loading places:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [guiderId]);

  useEffect(() => {
    if (guiderId) {
      loadAllData();
    }
  }, [guiderId]);

  // ============ ACTIONS ============
  const toggleStatus = async () => {
    if (!guiderId) return;
    try {
      const params = new URLSearchParams();
      params.append("guiderId", guiderId.toString());
      params.append("active", (!isActive).toString());
      const response = await api.post(API.CHANGE_GUIDER_ACTIVE_STATUS, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) {
        setIsActive(!isActive);
        Alert.alert("Success", `Service ${!isActive ? "activated" : "deactivated"} successfully`);
      }
    } catch (err) {
      console.error("Status change error:", err);
      Alert.alert("Error", "Status change failed");
    }
  };

  const respondBooking = async (id, status, note = "") => {
    try {
      const params = new URLSearchParams();
      params.append("appointmentId", id.toString());
      params.append("status", status.toLowerCase());
      if (note) params.append("note", note);
      const response = await api.post(API.RESPOND_APPOINTMENT, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) {
        Alert.alert("Success", `Booking ${status.toLowerCase()} successfully`);
        await loadBookings();
        if (status === "COMPLETED") {
          await fetchGuiderBalance(); // Refresh wallet after completion
        }
      } else {
        Alert.alert("Error", response.data?.message || "Action failed");
      }
    } catch (err) {
      console.error("Booking response error:", err);
      Alert.alert("Error", "Action failed");
    }
  };

  const handleRejectBooking = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }
    await respondBooking(selectedBooking?.id, "REJECTED", rejectionReason);
    setRejectModal(false);
    setRejectionReason("");
  };

  const handleCompleteBooking = async () => {
    Alert.alert(
      "Complete Tour",
      "Are you sure you want to mark this tour as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            await respondBooking(selectedBooking.id, "COMPLETED");
            setBookingModal(false);
          }
        }
      ]
    );
  };

  // Withdrawal with 12% commission
  const handleWithdrawal = async () => {
  if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
    Alert.alert("Error", "Please enter valid amount");
    return;
  }

  const amount = parseFloat(withdrawalAmount);
  const availableBalance = wallet - pendingWithdrawal;
  
  if (amount > availableBalance) {
    Alert.alert("Error", `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`);
    return;
  }

  // Calculate commission (12%)
  const commission = (amount * commissionRate) / 100;
  const amountToBeSettled = amount - commission;

  Alert.alert(
    "Confirm Withdrawal",
    `Withdrawal Amount: ₹${amount.toFixed(2)}\nCommission (${commissionRate}%): ₹${commission.toFixed(2)}\nYou'll receive: ₹${amountToBeSettled.toFixed(2)}\n\nProceed?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Proceed",
        onPress: async () => {
          try {
            // Show loading indicator
            setLoading(true);
            
            const params = new URLSearchParams();
            params.append("guiderId", guiderId.toString());
            params.append("amount", amount.toString());
            params.append("charge", commission.toString());
            params.append("amountToBeSettled", amountToBeSettled.toString());
            params.append("paymentToken", `WD_${Date.now()}`);
            if (bankDetails.bankName) params.append("bankName", bankDetails.bankName);
            if (bankDetails.accountNumber) params.append("accountNumber", bankDetails.accountNumber);
            if (bankDetails.accountHolderName) params.append("accountHolderName", bankDetails.accountHolderName);
            if (bankDetails.ifsc) params.append("ifsc", bankDetails.ifsc);
            if (bankDetails.upiId) params.append("upiId", bankDetails.upiId);

            const response = await api.post(API.CREATE_WITHDRAWAL, params.toString(), {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            if (response.data?.status) {
              Alert.alert("Success", "Withdrawal request submitted");
              setWithdrawalModal(false);
              setWithdrawalAmount("");
              // Reset bank details after submission
              setBankDetails({
                bankName: "",
                accountNumber: "",
                accountHolderName: "",
                ifsc: "",
                upiId: "",
              });
              // Refresh all data after withdrawal
              await loadAllData();
            } else {
              Alert.alert("Error", response.data?.message || "Withdrawal failed");
            }
          } catch (error) {
            console.error("Withdrawal error:", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to submit withdrawal");
          } finally {
            setLoading(false);
          }
        }
      }
    ]
  );
};

  const pickServiceImage = async () => {
    try {
      if (!mediaLibraryPermission?.granted) {
        const { status } = await requestMediaLibraryPermission();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow access to your photo library.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setServiceForm({
          ...serviceForm,
          image: {
            uri: result.assets[0].uri,
            type: result.assets[0].mimeType || "image/jpeg",
            name: `service_${Date.now()}.jpg`,
          },
        });
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSaveService = async () => {
    if (!serviceForm.title.trim() || !serviceForm.servicePrice || parseFloat(serviceForm.servicePrice) <= 0) {
      Alert.alert("Error", "Title and valid price are required");
      return;
    }
    if (!serviceForm.description.trim()) {
      Alert.alert("Error", "Description is required");
      return;
    }

    try {
      const formData = new FormData();
      if (serviceForm.id) {
        formData.append("serviceId", serviceForm.id);
      }
      formData.append("guiderId", guiderId.toString());
      formData.append("title", serviceForm.title.trim());
      formData.append("description", serviceForm.description.trim());
      formData.append("servicePrice", parseFloat(serviceForm.servicePrice).toString());
      if (serviceForm.image) {
        formData.append("image", {
          uri: serviceForm.image.uri,
          type: "image/jpeg",
          name: `service_${Date.now()}.jpg`,
        });
      }

      const endpoint = serviceForm.id ? API.UPDATE_SERVICE : API.CREATE_SERVICE;
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.status) {
        Alert.alert("Success", `Service ${serviceForm.id ? "updated" : "added"} successfully`);
        setServiceModal(false);
        resetServiceForm();
        loadServices();
      } else {
        Alert.alert("Error", response.data?.message || "Failed to save service");
      }
    } catch (error) {
      console.error("Save service error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to save service");
    }
  };

  const handleDeleteService = async (serviceId) => {
  Alert.alert(
    "Delete Service",
    "Are you sure you want to delete this service?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🗑 Attempting to delete service ID:", serviceId);
            
            // First, check if this service has any appointments (to give proper message)
            const params = new URLSearchParams();
            params.append("guiderId", guiderId.toString());
            
            const appointmentsRes = await api.post(API.GET_APPOINTMENTS, params.toString(), {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            
            let hasAppointments = false;
            if (appointmentsRes.data?.status) {
              const appointments = appointmentsRes.data.data || [];
              // Check if any appointment has this service
              const linkedAppointments = appointments.filter(apt => 
                apt.serviceId === serviceId || 
                apt.serviceName === services.find(s => s.id === serviceId)?.title
              );
              hasAppointments = linkedAppointments.length > 0;
              
              if (hasAppointments) {
                console.log("⚠️ Service has", linkedAppointments.length, "linked appointments");
              }
            }
            
            // Send delete request to backend (even if it doesn't actually delete)
            const deleteParams = new URLSearchParams();
            deleteParams.append("serviceId", serviceId.toString());
            
            const response = await api.post(API.DELETE_SERVICE, deleteParams.toString(), {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            
            console.log("✅ Delete response:", response.data);
            
            // ALWAYS remove from local state (frontend-only deletion)
            setServices(prevServices => {
              const newServices = prevServices.filter(service => service.id !== serviceId);
              console.log("📊 Service removed from UI. Remaining:", newServices.length);
              return newServices;
            });
            
            // Show appropriate message
            if (hasAppointments) {
              Alert.alert(
                "Service Hidden", 
                "This service has existing bookings and cannot be permanently deleted, but it has been removed from your view."
              );
            } else if (response.data?.status) {
              Alert.alert("Success", "Service deleted successfully");
            } else {
              Alert.alert("Service Hidden", "Service has been removed from your dashboard.");
            }
            
            // Try to refresh from server (will bring it back if not actually deleted, but we want to keep it hidden)
            // Comment this out to keep the service hidden
            // setTimeout(async () => {
            //   await loadServices();
            // }, 1000);
            
          } catch (error) {
            console.error("❌ Delete service error:", error);
            
            // Even on error, remove from UI
            setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
            Alert.alert("Service Hidden", "Service has been removed from your dashboard.");
          }
        },
      },
    ]
  );
};
  const pickGalleryImages = async () => {
    try {
      if (!mediaLibraryPermission?.granted) {
        const { status } = await requestMediaLibraryPermission();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow access to your photo library.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        setSelectedImages(result.assets);
      }
    } catch (error) {
      console.error("Gallery picker error:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const uploadGalleryImages = async () => {
    if (selectedImages.length === 0) {
      Alert.alert("Error", "Please select images to upload");
      return;
    }

    try {
      setIsUploading(true);
      for (const image of selectedImages) {
        const formData = new FormData();
        formData.append("guiderId", guiderId.toString());
        formData.append("image", {
          uri: image.uri,
          type: image.mimeType || "image/jpeg",
          name: `gallery_${Date.now()}.jpg`,
        });
        await api.post(API.ADD_IMAGE, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      Alert.alert("Success", `${selectedImages.length} photo(s) uploaded`);
      setGalleryModal(false);
      setSelectedImages([]);
      loadGallery();
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const params = new URLSearchParams();
              params.append("imageId", imageId.toString());
              const response = await api.post(API.DELETE_IMAGE, params.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              });
              if (response.data?.status) {
                Alert.alert("Success", "Image deleted");
                loadGallery();
              }
            } catch (error) {
              console.error("Delete image error:", error);
              Alert.alert("Error", "Failed to delete image");
            }
          },
        },
      ]
    );
  };

  const pickProfileImage = async () => {
    try {
      if (!mediaLibraryPermission?.granted) {
        const { status } = await requestMediaLibraryPermission();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Please allow access to your photo library.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Profile image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("guiderId", guiderId.toString());
      if (editForm.firmName) formData.append("firmName", editForm.firmName);
      if (editForm.email) formData.append("email", editForm.email);
      if (editForm.phone) formData.append("phone", editForm.phone);
      if (editForm.address) formData.append("address", editForm.address);
      if (editForm.description) formData.append("description", editForm.description);
      if (editForm.experience) formData.append("experience", editForm.experience);
      if (editForm.languages) formData.append("languages", editForm.languages);
      if (selectedPlaces[0]?.id) formData.append("placeId", selectedPlaces[0].id.toString());
      if (selectedPlaces.length) {
        const placeIds = selectedPlaces.map(p => p.id).join(",");
        formData.append("places", placeIds);
      }
      if (profileImage) {
        formData.append("profilePicture", {
          uri: profileImage.uri,
          type: profileImage.mimeType || "image/jpeg",
          name: `profile_${Date.now()}.jpg`,
        });
      }

      const response = await api.post(API.UPDATE_GUIDER, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.status) {
        Alert.alert("Success", "Profile updated");
        setEditProfileModal(false);
        setProfileImage(null);
        loadGuiderDetails();
      } else {
        Alert.alert("Error", response.data?.message || "Update failed");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.replace("Login");
          },
        },
      ]
    );
  };

  const resetServiceForm = () => {
    setServiceForm({
      id: null,
      title: "",
      description: "",
      servicePrice: "",
      image: null,
    });
  };

  const togglePlace = (place) => {
    if (selectedPlaces.some(p => p.id === place.id)) {
      setSelectedPlaces(selectedPlaces.filter(p => p.id !== place.id));
    } else if (selectedPlaces.length < 3) {
      setSelectedPlaces([...selectedPlaces, place]);
    } else {
      Alert.alert("Limit Reached", "You can select up to 3 places only");
    }
  };

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || 0}`;

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED": return "#10B981";
      case "ACCEPTED": return "#3B82F6";
      case "REQUESTED": return "#F59E0B";
      case "REJECTED": return "#EF4444";
      case "CANCELED": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "COMPLETED": return "#D1FAE5";
      case "ACCEPTED": return "#DBEAFE";
      case "REQUESTED": return "#FEF3C7";
      case "REJECTED": return "#FEE2E2";
      case "CANCELED": return "#F3F4F6";
      default: return "#F3F4F6";
    }
  };

  const getWithdrawalStatusColor = (status) => {
    switch (status) {
      case "Success": return "#10B981";
      case "In Progress": return "#F59E0B";
      case "Canceled": return "#EF4444";
      default: return "#64748b";
    }
  };

  const getWithdrawalStatusBg = (status) => {
    switch (status) {
      case "Success": return "#D1FAE5";
      case "In Progress": return "#FEF3C7";
      case "Canceled": return "#FEE2E2";
      default: return "#F3F4F6";
    }
  };

  // ============ RENDER COMPONENTS ============
  const renderHeader = () => (
    <LinearGradient
      colors={["#1e3c4f", "#2c5a73"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1e3c4f" />
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuIcon} onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>
                {profile?.firmName || profile?.name || "Guider Dashboard"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate("GuiderNotifications")}>
              <Ionicons name="notifications-outline" size={28} color="#fff" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {notifications.filter((n) => !n.isRead).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderTabBar = () => (
    <View style={styles.tabBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarScroll}
      >
        {[
          { id: "dashboard", label: "Dashboard", icon: "grid" },
          { id: "services", label: "Tour Packages", icon: "map" },
          { id: "gallery", label: "Gallery", icon: "images" },
          { id: "bookings", label: "Bookings", icon: "calendar" },
          { id: "earnings", label: "Earnings", icon: "wallet" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? "#2c5a73" : "#94a3b8"}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderWalletCard = () => (
    <LinearGradient
      colors={["#2c5a73", "#1e3c4f"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.walletCard}
    >
      <View style={styles.walletHeader}>
        <View style={styles.walletTitleContainer}>
          <Ionicons name="wallet-outline" size={24} color="#fff" />
          <Text style={styles.walletTitle}>Available Balance</Text>
        </View>
        <TouchableOpacity style={styles.withdrawBtn} onPress={() => setWithdrawalModal(true)}>
          <Text style={styles.withdrawBtnText}>Withdraw</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.walletAmount}>{formatCurrency(wallet)}</Text>
      <View style={styles.walletFooter}>
        <View style={styles.walletStat}>
          <Text style={styles.walletStatLabel}>Total Earned</Text>
          <Text style={styles.walletStatValue}>{formatCurrency(wallet)}</Text>
        </View>
        <View style={styles.walletDivider} />
        <View style={styles.walletStat}>
          <Text style={styles.walletStatLabel}>Pending</Text>
          <Text style={styles.walletStatValue}>{formatCurrency(pendingWithdrawal)}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderStatusToggle = () => (
    <View style={styles.statusCard}>
      <View style={styles.statusContent}>
        <View style={styles.statusInfo}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={isActive ? "flash" : "flash-off"}
              size={24}
              color={isActive ? "#10B981" : "#94a3b8"}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {isActive ? "Accepting Bookings" : "Not Accepting Bookings"}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isActive
                ? "Tourists can book your services"
                : "Toggle on to start receiving bookings"}
            </Text>
          </View>
        </View>
        <Switch
          value={isActive}
          onValueChange={toggleStatus}
          trackColor={{ false: "#e2e8f0", true: "#10B981" }}
          thumbColor="#fff"
          ios_backgroundColor="#e2e8f0"
        />
      </View>
    </View>
  );

  const renderStatsGrid = () => {
    const stats = [
      {
        label: "Total Tours",
        value: bookings.length,
        icon: "calendar",
        color: "#3B82F6",
        bgColor: "#DBEAFE",
      },
      {
        label: "Packages",
        value: services.length,
        icon: "map",
        color: "#8B5CF6",
        bgColor: "#EDE9FE",
      },
      {
        label: "Photos",
        value: gallery.length,
        icon: "images",
        color: "#10B981",
        bgColor: "#D1FAE5",
      },
      {
        label: "Rating",
        value: profile?.rating?.toFixed(1) || "0.0",
        icon: "star",
        color: "#F59E0B",
        bgColor: "#FEF3C7",
      },
    ];

    return (
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsCard}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            resetServiceForm();
            setServiceModal(true);
          }}
        >
          <LinearGradient colors={["#3B82F6", "#2563EB"]} style={styles.quickActionGradient}>
            <Ionicons name="add-circle" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionLabel}>Add Package</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={() => setGalleryModal(true)}>
          <LinearGradient colors={["#10B981", "#059669"]} style={styles.quickActionGradient}>
            <Ionicons name="cloud-upload" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionLabel}>Upload Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={() => setWithdrawalModal(true)}>
          <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.quickActionGradient}>
            <Ionicons name="wallet" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionLabel}>Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={() => setEditProfileModal(true)}>
          <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.quickActionGradient}>
            <Ionicons name="create" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionLabel}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentBookings = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="calendar" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab("bookings")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {bookings.slice(0, 3).map((item) => (
        <View key={item.id} style={styles.bookingItem}>
          <View style={styles.bookingItemLeft}>
            <View style={[styles.bookingStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.bookingItemContent}>
              <Text style={styles.bookingServiceTitle}>
                {item.serviceTitle || "Tour Package"}
              </Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="person-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.customerName || "Tourist"}</Text>
                <View style={styles.bookingMetaDot} />
                <Ionicons name="calendar-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>
                  {new Date(item.createdOn).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.bookingItemRight}>
            <Text style={styles.bookingAmount}>{formatCurrency(item.amount)}</Text>
            <View style={[styles.bookingStatusBadge, { backgroundColor: getStatusBg(item.status) }]}>
              <Text style={[styles.bookingStatusBadgeText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {item.status === "REQUESTED" && (
                <>
                  <TouchableOpacity
                    style={{ backgroundColor: "#10B981", padding: 6, borderRadius: 6 }}
                    onPress={() => respondBooking(item.id, "ACCEPTED")}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: "#EF4444", padding: 6, borderRadius: 6 }}
                    onPress={() => {
                      setSelectedBooking(item);
                      setRejectModal(true);
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.status === "ACCEPTED" && (
                <TouchableOpacity
                  style={{ backgroundColor: "#3B82F6", padding: 6, borderRadius: 6 }}
                  onPress={() => {
                    setSelectedBooking(item);
                    setBookingModal(true);
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12 }}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ))}

      {bookings.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
          <Text style={styles.emptyStateText}>
            When tourists book your tours, they will appear here
          </Text>
        </View>
      )}
    </View>
  );

  const renderServices = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="map" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>My Tour Packages</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetServiceForm();
            setServiceModal(true);
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {services.map((item) => (
        <View key={item.id} style={styles.serviceItem}>
          {item.image && (
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.serviceItemImage} />
          )}
          <View style={styles.serviceItemContent}>
            <View style={styles.serviceItemHeader}>
              <Text style={styles.serviceItemTitle}>{item.title}</Text>
              <Text style={styles.serviceItemPrice}>{formatCurrency(item.servicePrice)}</Text>
            </View>
            <Text style={styles.serviceItemDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.serviceItemFooter}>
              <View style={styles.serviceItemStats}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.serviceItemStatsText}>
                  {item.bookings || 0} bookings
                </Text>
              </View>
              <View style={styles.serviceItemActions}>
                <TouchableOpacity
                  style={styles.serviceEditBtn}
                  onPress={() => {
                    setServiceForm({
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      servicePrice: item.servicePrice?.toString(),
                      image: null,
                    });
                    setServiceModal(true);
                  }}
                >
                  <Feather name="edit-2" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.serviceDeleteBtn}
                  onPress={() => handleDeleteService(item.id)}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}

      {services.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Tour Packages</Text>
          <Text style={styles.emptyStateText}>
            Add your first tour package to start receiving bookings
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => {
              resetServiceForm();
              setServiceModal(true);
            }}
          >
            <Text style={styles.emptyStateButtonText}>Add Package</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderGallery = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="images" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>My Gallery</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setGalleryModal(true)}>
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={gallery}
        keyExtractor={(item) => item.id?.toString()}
        numColumns={3}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.galleryItem}
            onLongPress={() => handleDeleteImage(item.id)}
          >
            <Image
              source={{ uri: item.url || getImageUrl(item.image) }}
              style={styles.galleryItemImage}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Photos</Text>
            <Text style={styles.emptyStateText}>
              Upload photos of tourist places to showcase your expertise
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setGalleryModal(true)}>
              <Text style={styles.emptyStateButtonText}>Upload Photos</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );

  const renderBookings = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="calendar" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>All Bookings</Text>
        </View>
      </View>

      {bookings.map((item) => (
        <View key={item.id} style={styles.bookingItem}>
          <View style={styles.bookingItemLeft}>
            <View style={[styles.bookingStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.bookingItemContent}>
              <Text style={styles.bookingServiceTitle}>
                {item.serviceTitle || "Tour Package"}
              </Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="person-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.customerName || "Tourist"}</Text>
                <View style={styles.bookingMetaDot} />
                <Ionicons name="time-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.time || "Flexible"}</Text>
              </View>
            </View>
          </View>
          <View style={styles.bookingItemRight}>
            <Text style={styles.bookingAmount}>{formatCurrency(item.amount)}</Text>
            <View style={[styles.bookingStatusBadge, { backgroundColor: getStatusBg(item.status) }]}>
              <Text style={[styles.bookingStatusBadgeText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {item.status === "REQUESTED" && (
                <>
                  <TouchableOpacity
                    style={{ backgroundColor: "#10B981", padding: 6, borderRadius: 6 }}
                    onPress={() => respondBooking(item.id, "ACCEPTED")}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: "#EF4444", padding: 6, borderRadius: 6 }}
                    onPress={() => {
                      setSelectedBooking(item);
                      setRejectModal(true);
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.status === "ACCEPTED" && (
                <TouchableOpacity
                  style={{ backgroundColor: "#3B82F6", padding: 6, borderRadius: 6 }}
                  onPress={() => {
                    setSelectedBooking(item);
                    setBookingModal(true);
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12 }}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ))}

      {bookings.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Bookings</Text>
          <Text style={styles.emptyStateText}>
            You don't have any booking requests at the moment
          </Text>
        </View>
      )}
    </View>
  );

  const renderEarnings = () => (
    <View>
      <LinearGradient
        colors={["#2c5a73", "#1e3c4f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.earningsCard}
      >
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsAmount}>{formatCurrency(wallet)}</Text>
        <View style={styles.earningsStats}>
          <View style={styles.earningsStat}>
            <Text style={styles.earningsStatLabel}>Available</Text>
            <Text style={styles.earningsStatValue}>{formatCurrency(wallet - pendingWithdrawal)}</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsStat}>
            <Text style={styles.earningsStatLabel}>Pending</Text>
            <Text style={styles.earningsStatValue}>{formatCurrency(pendingWithdrawal)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="swap-horizontal" size={20} color="#2c5a73" />
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>
        </View>

        {transactions.map((item) => (
          <View key={item.id} style={styles.transactionItem}>
            <View style={[styles.transactionIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="arrow-down" size={20} color="#10B981" />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>Payment Received</Text>
              <Text style={styles.transactionDate}>
                {new Date(item.createdOn).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.transactionCredit}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}

        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Transactions</Text>
            <Text style={styles.emptyStateText}>
              Your transaction history will appear here
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="wallet" size={20} color="#2c5a73" />
            <Text style={styles.sectionTitle}>Withdrawal History</Text>
          </View>
        </View>

        {withdrawals.map((item) => (
          <View key={item.id} style={styles.transactionItem}>
            <View style={[styles.transactionIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="arrow-up" size={20} color="#EF4444" />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>Withdrawal Request</Text>
              <Text style={styles.transactionDate}>
                {new Date(item.createdOn).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionDebit}>-{formatCurrency(item.amount)}</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: getWithdrawalStatusBg(item.paymentStatus) }]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: getWithdrawalStatusColor(item.paymentStatus) }]}
                >
                  {item.paymentStatus}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {withdrawals.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Withdrawals</Text>
            <Text style={styles.emptyStateText}>
              Your withdrawal history will appear here
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // ============ MODALS ============
  const renderServiceModal = () => (
    <Modal
      visible={serviceModal}
      animationType="slide"
      transparent
      onRequestClose={() => {
        resetServiceForm();
        setServiceModal(false);
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {serviceForm.id ? "Edit Tour Package" : "Add New Tour Package"}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                resetServiceForm();
                setServiceModal(false);
              }}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.modalImagePicker} onPress={pickServiceImage}>
              {serviceForm.image ? (
                <Image source={{ uri: serviceForm.image.uri }} style={styles.modalPreviewImage} />
              ) : (
                <View style={styles.modalImagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#94a3b8" />
                  <Text style={styles.modalImageText}>Add Package Photo</Text>
                  <Text style={styles.modalImageSubtext}>Show tourists what to expect</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Package Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Heritage Walk, City Tour"
                placeholderTextColor="#94a3b8"
                value={serviceForm.title}
                onChangeText={(text) => setServiceForm({ ...serviceForm, title: text })}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Price (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 1500"
                placeholderTextColor="#94a3b8"
                value={serviceForm.servicePrice}
                onChangeText={(text) => setServiceForm({ ...serviceForm, servicePrice: text })}
                keyboardType="numeric"
              />
              <Text style={styles.hintText}>💡 Keep prices competitive to get more bookings</Text>
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Describe what's included in this tour..."
                placeholderTextColor="#94a3b8"
                value={serviceForm.description}
                onChangeText={(text) => setServiceForm({ ...serviceForm, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                resetServiceForm();
                setServiceModal(false);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveService}>
              <Text style={styles.modalSaveText}>{serviceForm.id ? "Update" : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderGalleryModal = () => (
    <Modal
      visible={galleryModal}
      animationType="slide"
      transparent
      onRequestClose={() => {
        setGalleryModal(false);
        setSelectedImages([]);
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload to Gallery</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setGalleryModal(false);
                setSelectedImages([]);
              }}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedImages.length > 0 ? (
            <>
              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.selectedImagesGrid}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.selectedImageItem}>
                      <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => {
                          const newImages = [...selectedImages];
                          newImages.splice(index, 1);
                          setSelectedImages(newImages);
                        }}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.addMoreBtn} onPress={pickGalleryImages}>
                  <Ionicons name="add" size={20} color="#3B82F6" />
                  <Text style={styles.addMoreText}>Add More</Text>
                </TouchableOpacity>
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setGalleryModal(false);
                    setSelectedImages([]);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={uploadGalleryImages}>
                  <Text style={styles.modalSaveText}>
                    Upload {selectedImages.length} Photo{selectedImages.length > 1 ? "s" : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.uploadPrompt}>
              <Ionicons name="cloud-upload-outline" size={64} color="#94a3b8" />
              <Text style={styles.uploadTitle}>Upload Photos</Text>
              <Text style={styles.uploadText}>Showcase tourist places and your tours</Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickGalleryImages}>
                <Ionicons name="images-outline" size={20} color="#fff" />
                <Text style={styles.uploadBtnText}>Select Photos</Text>
              </TouchableOpacity>
              <Text style={styles.uploadTip}>💡 High-quality photos get more bookings</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderWithdrawalModal = () => {
  const amount = parseFloat(withdrawalAmount) || 0;
  const commission = (amount * commissionRate) / 100;
  const amountToBeSettled = amount - commission;
  const availableBalance = wallet - pendingWithdrawal;

  return (
    <Modal
      visible={withdrawalModal}
      animationType="slide"
      transparent
      onRequestClose={() => {
        setWithdrawalModal(false);
        setWithdrawalAmount("");
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setWithdrawalModal(false);
                setWithdrawalAmount("");
              }}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.balancePreview}>
              <Text style={styles.balancePreviewLabel}>Available Balance</Text>
              <Text style={styles.balancePreviewAmount}>
                {formatCurrency(wallet)}
              </Text>
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Withdrawal Amount</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter amount"
                placeholderTextColor="#94a3b8"
                value={withdrawalAmount}
                onChangeText={setWithdrawalAmount}
                keyboardType="numeric"
              />
            </View>

            {amount > 0 && (
              <View style={styles.commissionPreview}>
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionLabel}>Withdrawal Amount:</Text>
                  <Text style={styles.commissionValue}>₹{amount.toFixed(2)}</Text>
                </View>
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionLabel}>Commission ({commissionRate}%):</Text>
                  <Text style={styles.commissionValue}>- ₹{commission.toFixed(2)}</Text>
                </View>
                <View style={styles.commissionDivider} />
                <View style={styles.commissionRow}>
                  <Text style={styles.commissionTotalLabel}>You'll Receive:</Text>
                  <Text style={styles.commissionTotalValue}>₹{amountToBeSettled.toFixed(2)}</Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionSubtitle}>Bank Details</Text>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="As per bank records"
                placeholderTextColor="#94a3b8"
                value={bankDetails.accountHolderName}
                onChangeText={(text) => setBankDetails({ ...bankDetails, accountHolderName: text })}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Bank Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., State Bank of India"
                placeholderTextColor="#94a3b8"
                value={bankDetails.bankName}
                onChangeText={(text) => setBankDetails({ ...bankDetails, bankName: text })}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Account Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter account number"
                placeholderTextColor="#94a3b8"
                value={bankDetails.accountNumber}
                onChangeText={(text) => setBankDetails({ ...bankDetails, accountNumber: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.modalFormGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.modalLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="IFSC"
                  placeholderTextColor="#94a3b8"
                  value={bankDetails.ifsc}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, ifsc: text })}
                />
              </View>
              <View style={[styles.modalFormGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.modalLabel}>UPI ID</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="UPI ID (optional)"
                  placeholderTextColor="#94a3b8"
                  value={bankDetails.upiId}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, upiId: text })}
                />
              </View>
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.noteText}>
                Withdrawals are processed within 24-48 hours. You'll receive a notification once completed.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setWithdrawalModal(false);
                setWithdrawalAmount("");
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleWithdrawal}>
              <Text style={styles.modalSaveText}>Request Withdrawal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


  const renderBookingModal = () => (
    <Modal
      visible={bookingModal}
      animationType="slide"
      transparent
      onRequestClose={() => setBookingModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setBookingModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedBooking && (
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.bookingDetailSection}>
                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Tourist Name</Text>
                  <Text style={styles.bookingDetailValue}>
                    {selectedBooking.customerName || "N/A"}
                  </Text>
                </View>

                {selectedBooking.status === "ACCEPTED" && selectedBooking.customerPhone && (
                  <View style={styles.bookingDetailRow}>
                    <Text style={styles.bookingDetailLabel}>Contact Number</Text>
                    <View style={styles.contactRow}>
                      <Text style={styles.bookingDetailValue}>
                        {selectedBooking.customerPhone}
                      </Text>
                      <TouchableOpacity style={styles.callBtn}>
                        <Ionicons name="call" size={16} color="#fff" />
                        <Text style={styles.callBtnText}>Call</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Tour Package</Text>
                  <Text style={styles.bookingDetailValue}>
                    {selectedBooking.serviceTitle || "Tour Package"}
                  </Text>
                </View>

                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Booking Date</Text>
                  <Text style={styles.bookingDetailValue}>
                    {new Date(selectedBooking.createdOn).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Amount</Text>
                  <Text style={styles.bookingDetailValue}>
                    {formatCurrency(selectedBooking.amount)}
                  </Text>
                </View>

                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Status</Text>
                  <View
                    style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedBooking.status) }]}
                  >
                    <Text
                      style={[styles.statusBadgeText, { color: getStatusColor(selectedBooking.status) }]}
                    >
                      {selectedBooking.status}
                    </Text>
                  </View>
                </View>

                {selectedBooking.rating > 0 && (
                  <>
                    <View style={styles.bookingDetailRow}>
                      <Text style={styles.bookingDetailLabel}>Rating</Text>
                      <View style={styles.ratingDisplay}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.ratingValue}>{selectedBooking.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    {selectedBooking.feedback && (
                      <View style={styles.bookingDetailRow}>
                        <Text style={styles.bookingDetailLabel}>Feedback</Text>
                        <Text style={styles.feedbackText}>"{selectedBooking.feedback}"</Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {selectedBooking.status === "REQUESTED" && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.acceptModalBtn}
                    onPress={() => {
                      respondBooking(selectedBooking.id, "ACCEPTED");
                      setBookingModal(false);
                    }}
                  >
                    <Text style={styles.acceptModalBtnText}>Accept Booking</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectModalBtn}
                    onPress={() => {
                      setBookingModal(false);
                      setRejectModal(true);
                    }}
                  >
                    <Text style={styles.rejectModalBtnText}>Reject Booking</Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedBooking.status === "ACCEPTED" && (
                <TouchableOpacity
                  style={styles.completeModalBtn}
                  onPress={handleCompleteBooking}
                >
                  <Text style={styles.completeModalBtnText}>Complete Tour</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderRejectModal = () => (
    <Modal
      visible={rejectModal}
      animationType="slide"
      transparent
      onRequestClose={() => {
        setRejectModal(false);
        setRejectionReason("");
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reject Booking</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setRejectModal(false);
                setRejectionReason("");
              }}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.warningContainer}>
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
              <Text style={styles.warningTitle}>Are you sure?</Text>
              <Text style={styles.warningText}>
                Rejecting bookings will affect your acceptance rate and ranking. Only reject if
                absolutely necessary.
              </Text>
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Reason for Rejection</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Please explain why you cannot accept this booking"
                placeholderTextColor="#94a3b8"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setRejectModal(false);
                setRejectionReason("");
              }}
            >
              <Text style={styles.modalCancelText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: "#EF4444" }]}
              onPress={handleRejectBooking}
            >
              <Text style={styles.modalSaveText}>Confirm Rejection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditProfileModal = () => (
    <Modal
      visible={editProfileModal}
      animationType="slide"
      transparent
      onRequestClose={() => setEditProfileModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditProfileModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Profile Photo */}
            <TouchableOpacity style={styles.profilePhotoPicker} onPress={pickProfileImage}>
              <Image
                source={{
                  uri: profileImage
                    ? profileImage.uri
                    : getImageUrl(profile?.photograph) || "https://via.placeholder.com/100",
                }}
                style={styles.profilePhoto}
              />
              <View style={styles.profilePhotoOverlay}>
                <Ionicons name="camera" size={24} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Firm/Agency Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your agency name"
                placeholderTextColor="#94a3b8"
                value={editForm.firmName}
                onChangeText={(text) => setEditForm({ ...editForm, firmName: text })}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter email"
                placeholderTextColor="#94a3b8"
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Phone</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter phone number"
                placeholderTextColor="#94a3b8"
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Address</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Enter your address"
                placeholderTextColor="#94a3b8"
                value={editForm.address}
                onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Experience (Years)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Years of experience"
                placeholderTextColor="#94a3b8"
                value={editForm.experience}
                onChangeText={(text) => setEditForm({ ...editForm, experience: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Languages (comma-separated)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Hindi, English, French"
                placeholderTextColor="#94a3b8"
                value={editForm.languages}
                onChangeText={(text) => setEditForm({ ...editForm, languages: text })}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Service Areas (Select up to 3)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.placesScroll}
              >
                {places.slice(0, 10).map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={[
                      styles.placeChip,
                      selectedPlaces.some((p) => p.id === place.id) && styles.placeChipSelected,
                    ]}
                    onPress={() => togglePlace(place)}
                  >
                    <Text
                      style={[
                        styles.placeChipText,
                        selectedPlaces.some((p) => p.id === place.id) && styles.placeChipTextSelected,
                      ]}
                    >
                      {place.placeName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.hintText}>Selected: {selectedPlaces.length}/3 places</Text>
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>About You</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Tell tourists about your guiding experience and services"
                placeholderTextColor="#94a3b8"
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditProfileModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateProfile}>
              <Text style={styles.modalSaveText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabBar()}

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2c5a73"
            colors={["#2c5a73"]}
          />
        }
      >
        {activeTab === "dashboard" && (
          <View style={styles.dashboardContent}>
            {renderWalletCard()}
            {renderStatusToggle()}
            {renderStatsGrid()}
            {renderQuickActions()}
            {renderRecentBookings()}
          </View>
        )}

        {activeTab === "services" && renderServices()}
        {activeTab === "gallery" && renderGallery()}
        {activeTab === "bookings" && renderBookings()}
        {activeTab === "earnings" && renderEarnings()}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Modals */}
      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        profile={profile}
        user={user}
        onEditProfile={() => setEditProfileModal(true)}
        onSettings={() => navigation.navigate("Settings")}
        onHelp={() => navigation.navigate("Help")}
        onPrivacyPolicy={() => navigation.navigate("PrivacyPolicy")}
        onLogout={handleLogout}
        getImageUrl={getImageUrl}
      />

      {renderServiceModal()}
      {renderGalleryModal()}
      {renderWithdrawalModal()}
      {renderBookingModal()}
      {renderRejectModal()}
      {renderEditProfileModal()}
    </View>
  );
}

// ---------- Styles (unchanged) ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1 },
  loadingGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#fff", fontWeight: "500" },
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 20 },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  menuIcon: { marginRight: 15, padding: 5 },
  headerTextContainer: { flex: 1 },
  headerGreeting: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginBottom: 2 },
  headerName: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  notificationBtn: { padding: 8, marginRight: 12, position: "relative" },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationCount: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  tabBarContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarScroll: { paddingHorizontal: 16 },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
  },
  activeTabItem: { backgroundColor: "#e6f0f5" },
  tabLabel: { fontSize: 14, color: "#64748b", marginLeft: 6, fontWeight: "500" },
  activeTabLabel: { color: "#2c5a73", fontWeight: "600" },
  scrollContent: { flex: 1 },
  dashboardContent: { padding: 16 },
  walletCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  walletTitleContainer: { flexDirection: "row", alignItems: "center" },
  walletTitle: { fontSize: 16, color: "#fff", marginLeft: 8, opacity: 0.9 },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  withdrawBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", marginRight: 4 },
  walletAmount: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  walletFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  walletStat: { flex: 1 },
  walletStatLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  walletStatValue: { fontSize: 16, fontWeight: "600", color: "#fff" },
  walletDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 16 },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusTextContainer: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  statusSubtitle: { fontSize: 12, color: "#64748b" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 16 },
  statCard: { width: "50%", paddingHorizontal: 4, marginBottom: 8 },
  statIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#1e293b", marginBottom: 2 },
  statLabel: { fontSize: 12, color: "#64748b" },
  quickActionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 16 },
  quickActionsGrid: { flexDirection: "row", justifyContent: "space-between" },
  quickAction: { alignItems: "center", flex: 1 },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionLabel: { fontSize: 12, color: "#64748b", textAlign: "center" },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitleContainer: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginLeft: 8 },
  viewAllText: { fontSize: 14, color: "#2c5a73", fontWeight: "600" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c5a73",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 4 },
  bookingItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  bookingItemLeft: { flexDirection: "row", flex: 1 },
  bookingStatusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  bookingItemContent: { flex: 1 },
  bookingServiceTitle: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  bookingMeta: { flexDirection: "row", alignItems: "center" },
  bookingMetaText: { fontSize: 11, color: "#64748b", marginLeft: 4 },
  bookingMetaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#cbd5e1", marginHorizontal: 8 },
  bookingItemRight: { alignItems: "flex-end" },
  bookingAmount: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  bookingStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  bookingStatusBadgeText: { fontSize: 10, fontWeight: "600" },
  serviceItem: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  serviceItemImage: { width: 70, height: 70, borderRadius: 8, marginRight: 12 },
  serviceItemContent: { flex: 1 },
  serviceItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  serviceItemTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b", flex: 1 },
  serviceItemPrice: { fontSize: 15, fontWeight: "bold", color: "#2c5a73" },
  serviceItemDesc: { fontSize: 12, color: "#64748b", lineHeight: 18, marginBottom: 8 },
  serviceItemFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serviceItemStats: { flexDirection: "row", alignItems: "center" },
  serviceItemStatsText: { fontSize: 11, color: "#64748b", marginLeft: 4 },
  serviceItemActions: { flexDirection: "row" },
  serviceEditBtn: { padding: 6, marginRight: 8 },
  serviceDeleteBtn: { padding: 6 },
  galleryItem: { flex: 1, aspectRatio: 1, margin: 4, borderRadius: 8, overflow: "hidden", elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  galleryItemImage: { width: "100%", height: "100%" },
  earningsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  earningsLabel: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginBottom: 8 },
  earningsAmount: { fontSize: 36, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  earningsStats: { flexDirection: "row", alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  earningsStat: { flex: 1 },
  earningsStatLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  earningsStatValue: { fontSize: 18, fontWeight: "600", color: "#fff" },
  earningsDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 16 },
  transactionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  transactionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontSize: 14, fontWeight: "500", color: "#1e293b", marginBottom: 2 },
  transactionDate: { fontSize: 11, color: "#64748b" },
  transactionCredit: { fontSize: 15, fontWeight: "600", color: "#10B981" },
  transactionDebit: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  transactionRight: { alignItems: "flex-end" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyStateTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 16 },
  emptyStateButton: { backgroundColor: "#2c5a73", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyStateButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  bottomSpace: { height: 20 },
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  modalCloseBtn: { padding: 4 },
  modalImagePicker: {
    width: "100%",
    height: 180,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    marginBottom: 20,
    overflow: "hidden",
  },
  modalPreviewImage: { width: "100%", height: "100%" },
  modalImagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  modalImageText: { marginTop: 12, fontSize: 16, fontWeight: "600", color: "#1e293b" },
  modalImageSubtext: { marginTop: 4, fontSize: 12, color: "#64748b" },
  modalFormGroup: { marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: "500", color: "#1e293b", marginBottom: 6 },
  modalInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, fontSize: 14, color: "#1e293b" },
  modalTextArea: { minHeight: 100, textAlignVertical: "top" },
  hintText: { fontSize: 11, color: "#64748b", marginTop: 4, fontStyle: "italic" },
  modalFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, marginRight: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, alignItems: "center" },
  modalCancelText: { fontSize: 16, fontWeight: "500", color: "#64748b" },
  modalSaveBtn: { flex: 1, paddingVertical: 14, marginLeft: 8, backgroundColor: "#2c5a73", borderRadius: 8, alignItems: "center" },
  modalSaveText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  selectedImagesGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  selectedImageItem: { width: "33.33%", aspectRatio: 1, padding: 4, position: "relative" },
  selectedImage: { width: "100%", height: "100%", borderRadius: 8 },
  removeImageBtn: { position: "absolute", top: 0, right: 0, backgroundColor: "#fff", borderRadius: 12 },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#2c5a73",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addMoreText: { color: "#2c5a73", fontSize: 14, fontWeight: "600", marginLeft: 8 },
  uploadPrompt: { alignItems: "center", paddingVertical: 32 },
  uploadTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginTop: 16, marginBottom: 8 },
  uploadText: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 },
  uploadBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2c5a73", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  uploadBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  uploadTip: { fontSize: 12, color: "#64748b", marginTop: 16, fontStyle: "italic" },
  balancePreview: { backgroundColor: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 20, alignItems: "center" },
  balancePreviewLabel: { fontSize: 14, color: "#64748b", marginBottom: 8 },
  balancePreviewAmount: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  commissionPreview: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  commissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  commissionLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  commissionValue: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
  },
  commissionDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
  },
  commissionTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  commissionTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c5a73",
  },
  sectionSubtitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 12 },
  row: { flexDirection: "row" },
  noteBox: { flexDirection: "row", backgroundColor: "#eff6ff", padding: 12, borderRadius: 8, marginTop: 16, alignItems: "center" },
  noteText: { flex: 1, fontSize: 12, color: "#1e293b", marginLeft: 8, lineHeight: 18 },
  bookingDetailSection: { marginBottom: 20 },
  bookingDetailRow: { marginBottom: 16 },
  bookingDetailLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  bookingDetailValue: { fontSize: 15, color: "#1e293b", fontWeight: "500" },
  contactRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  callBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#10B981", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  callBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", marginLeft: 6 },
  ratingDisplay: { flexDirection: "row", alignItems: "center" },
  ratingValue: { fontSize: 15, fontWeight: "600", color: "#F59E0B", marginLeft: 4 },
  feedbackText: { fontSize: 14, color: "#64748b", fontStyle: "italic", marginTop: 4 },
  modalActions: { flexDirection: "row", marginTop: 20 },
  acceptModalBtn: { flex: 1, backgroundColor: "#10B981", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginRight: 8 },
  acceptModalBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  rejectModalBtn: { flex: 1, backgroundColor: "#fff", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginLeft: 8, borderWidth: 1, borderColor: "#EF4444" },
  rejectModalBtnText: { color: "#EF4444", fontSize: 16, fontWeight: "600" },
  completeModalBtn: { backgroundColor: "#10B981", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 20 },
  completeModalBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  warningContainer: { alignItems: "center", marginBottom: 20 },
  warningTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginTop: 12, marginBottom: 8 },
  warningText: { fontSize: 14, color: "#64748b", textAlign: "center" },
  placesScroll: { flexDirection: "row", marginBottom: 8 },
  placeChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f8fafc", borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  placeChipSelected: { backgroundColor: "#2c5a73", borderColor: "#2c5a73" },
  placeChipText: { fontSize: 12, color: "#64748b" },
  placeChipTextSelected: { color: "#fff" },
  profilePhotoPicker: { alignItems: "center", marginBottom: 24, position: "relative" },
  profilePhoto: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#e2e8f0" },
  profilePhotoOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2c5a73",
    borderRadius: 20,
    padding: 6,
  },
});

// ... rest of the styles remain unchanged