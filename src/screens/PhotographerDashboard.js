import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, Image, SafeAreaView, StatusBar, FlatList, Dimensions,
  Platform, KeyboardAvoidingView, Switch
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { API } from "../api/endpoints";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { useMediaLibraryPermissions } from "expo-image-picker";
import MenuModal from "../components/MenuModal";

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

export default function PhotographerDashboard({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const photographerId = user?.pid || user?.id;

  // ---------- State ----------
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallet, setWallet] = useState(0);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [notifications, setNotifications] = useState([]);
const [otpModal, setOtpModal] = useState(false);
const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [menuVisible, setMenuVisible] = useState(false);

  // Modals
  const [serviceModal, setServiceModal] = useState(false);
  const [galleryModal, setGalleryModal] = useState(false);
  const [withdrawalModal, setWithdrawalModal] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState("");

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
  });

  const [mediaLibraryPermission, requestMediaLibraryPermission] = useMediaLibraryPermissions();

  // ---------- Data Fetching (using URLSearchParams) ----------
  const fetchData = useCallback(async () => {
    if (!photographerId) return;
    try {
      setLoading(true);

      const post = (endpoint, params = {}) => {
        const form = new URLSearchParams();
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            form.append(key, params[key].toString());
          }
        });
        return api.post(endpoint, form.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
      };

      // 1. Profile Details
      const resDetails = await post(API.GET_PHOTOGRAPHERS_DETAILS, { photographerId });
      if (resDetails.data?.status) {
        setProfile(resDetails.data.data);
        setIsActive(resDetails.data.data?.active || false);
        setEditForm({
          firmName: resDetails.data.data?.firmName || "",
          email: resDetails.data.data?.email || "",
          phone: resDetails.data.data?.phone || "",
          address: resDetails.data.data?.address || "",
          description: resDetails.data.data?.description || "",
        });
      }

      // 2. Services
      const resServices = await post(API.GET_SERVICES, { photographerId });
      if (resServices.data?.status) setServices(resServices.data.data || []);

      // 3. Appointments – fetch ALL statuses
      const statuses = ["REQUESTED", "ACCEPTED", "COMPLETED", "CANCELED", "REJECTED"];
      let allAppointments = [];

      for (const status of statuses) {
        const response = await post(API.GET_APPOINTMENTS, {
          photographerId,
          status,
          page: 1,
          perPage: 50
        });

        if (response.data?.status && Array.isArray(response.data.data)) {
         // Inside fetchData, when mapping appointments:
const mapped = response.data.data.map(item => ({
  id: item.id,
  serviceTitle: item.serviceName || item.serviceTitle || "Photography Service",
  customerName: item.customerName || "Customer",
  amount: item.serviceCost || item.totalPayment || item.totalAmount || 0,
  status: (item.appointmentStatus || item.status || "").toUpperCase(), // ✅ force uppercase
  createdOn: item.date || item.createdOn,
  time: item.time || "Flexible",
  customerPhone: item.customerPhone,
  rating: item.rating,
  feedback: item.feedback,
}));
          allAppointments = [...allAppointments, ...mapped];
        }
      }

      allAppointments.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
      setAppointments(allAppointments);

      // 4. Gallery
      const resGallery = await post(API.ALL_IMAGES_BY_ID, { photographerId, page: 1 });
      if (resGallery.data?.status) setGallery(resGallery.data.data || []);

      // 5. Transactions
      const resTrans = await post(API.GET_TRANSACTION, { photographerId, page: 1 });
      if (resTrans.data?.status) {
        const trans = resTrans.data.data || [];
        setTransactions(trans);
        const totalEarnings = trans
          .filter(t => t.paymentStatus === "SUCCESS")
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        setWallet(totalEarnings);
      }

      // 6. Withdrawals
      const resWith = await post(API.GET_WITHDRAWAL, { photographerId, page: 1 });
      if (resWith.data?.status) {
        const withs = resWith.data.data || [];
        setWithdrawals(withs);
        const pending = withs
          .filter(w => w.status === "PENDING")
          .reduce((sum, w) => sum + (w.amount || 0), 0);
        setPendingWithdrawal(pending);
      }

      // 7. Notifications
      const resNotif = await post(API.GET_NOTIFICATIONS, { userId: photographerId, userRole: "PHOTOGRAPHER", page: 1 });
      if (resNotif.data?.status) setNotifications(resNotif.data.data || []);

    } catch (e) {
      console.log("Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [photographerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // ---------- Status Toggle ----------
  const toggleStatus = async () => {
    try {
      const form = new URLSearchParams();
      form.append("photographerId", photographerId.toString());
      form.append("active", (!isActive).toString());
      const response = await api.post(API.CHANGE_PHOTOGRAPHER_ACTIVE_STATUS, form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      if (response.data?.status) {
        setIsActive(!isActive);
        Alert.alert("Success", `Service ${!isActive ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (err) {
      Alert.alert("Error", "Status change failed");
    }
  };

  // ---------- Service Management ----------
  const resetServiceForm = () => setServiceForm({ id: null, title: "", description: "", servicePrice: "", image: null });
  
  const pickServiceImage = async () => {
    if (!mediaLibraryPermission?.granted) {
      const { status } = await requestMediaLibraryPermission();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
  };
  // Add this function after handleCompleteBooking or before renderRejectModal
// Add this function after handleCompleteBooking
const handleRejectBooking = async () => {
  if (!rejectionReason.trim()) {
    Alert.alert("Error", "Please provide a reason for rejection");
    return;
  }
  await handleStatusUpdate(selectedBooking?.id, "REJECTED", rejectionReason);
  setRejectModal(false);
  setRejectionReason("");
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
      if (serviceForm.id) formData.append("serviceId", serviceForm.id);
      formData.append("photographerId", photographerId.toString());
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
        fetchData();
      } else {
        Alert.alert("Error", response.data?.message || "Failed to save service");
      }
    } catch (error) {
      console.error("Save service error:", error);
      Alert.alert("Error", "Failed to save service");
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
              const form = new URLSearchParams();
              form.append("serviceId", serviceId.toString());
              const response = await api.post(API.DELETE_SERVICE, form.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              });
              if (response.data?.status) {
                Alert.alert("Success", "Service deleted");
                fetchData();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete service");
            }
          },
        },
      ]
    );
  };

  // ---------- Appointment Handling ----------
const handleStatusUpdate = async (id, status, note = "") => {
  try {
    const form = new URLSearchParams();
    form.append("appointmentId", id.toString());
    form.append("status", status.toLowerCase()); // ✅ send lowercase
    if (note) form.append("note", note);
    const res = await api.post(API.RESPOND_APPOINTMENT, form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (res.data?.status) {
      Alert.alert("Success", `Booking ${status.toLowerCase()} successfully`);
      fetchData();
    } else {
      Alert.alert("Error", res.data?.message || "Action failed");
    }
  } catch (e) {
    Alert.alert("Error", "Action failed");
  }
};


 const handleCompleteBooking = async () => {
  if (!otpCode.trim()) {
    Alert.alert("Error", "Please enter OTP");
    return;
  }
  try {
    const form = new URLSearchParams();
    form.append("appointmentId", selectedBooking.id.toString());
    form.append("otp", otpCode);
    const response = await api.post("/appointment/complete", form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    if (response.data?.status) {
      Alert.alert("Success", "Service completed successfully");
      setOtpModal(false);
      setOtpCode("");
      fetchData(); // refresh appointments
    } else {
      Alert.alert("Error", response.data?.message || "Invalid OTP");
    }
  } catch (error) {
    console.error("Complete booking error:", error);
    Alert.alert("Error", "Failed to complete service");
  }
};
  // ---------- Gallery Functions ----------
  const pickGalleryImages = async () => {
    if (!mediaLibraryPermission?.granted) {
      const { status } = await requestMediaLibraryPermission();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedImages(result.assets);
      setGalleryModal(true);
    }
  };

  const uploadGalleryImages = async () => {
    if (selectedImages.length === 0) {
      Alert.alert("Error", "Please select images to upload");
      return;
    }
    try {
      setLoading(true);
      for (const image of selectedImages) {
        const formData = new FormData();
        formData.append("photographerId", photographerId.toString());
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
      fetchData();
    } catch (error) {
      Alert.alert("Error", "Failed to upload images");
    } finally {
      setLoading(false);
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
              const form = new URLSearchParams();
              form.append("imageId", imageId.toString());
              const response = await api.post(API.DELETE_IMAGE, form.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              });
              if (response.data?.status) {
                Alert.alert("Success", "Image deleted");
                fetchData();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete image");
            }
          },
        },
      ]
    );
  };

  const openFullImage = (url) => {
    setFullImageUrl(url);
    setFullImageVisible(true);
  };

  // ---------- Withdrawal & Profile ----------
  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      Alert.alert("Error", "Please enter valid amount");
      return;
    }
    const amount = parseFloat(withdrawalAmount);
    try {
      const form = new URLSearchParams();
      form.append("photographerId", photographerId.toString());
      form.append("amount", amount.toString());
      form.append("charge", "0");
      form.append("amountToBeSettled", amount.toString());
      form.append("paymentToken", `WD_${Date.now()}`);
      if (bankDetails.bankName) form.append("bankName", bankDetails.bankName);
      if (bankDetails.accountNumber) form.append("accountNumber", bankDetails.accountNumber);
      if (bankDetails.accountHolderName) form.append("accountHolderName", bankDetails.accountHolderName);
      if (bankDetails.ifsc) form.append("ifsc", bankDetails.ifsc);
      if (bankDetails.upiId) form.append("upiId", bankDetails.upiId);
      const response = await api.post(API.CREATE_WITHDRAWAL, form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) {
        Alert.alert("Success", "Withdrawal request submitted");
        setWithdrawalModal(false);
        setWithdrawalAmount("");
        fetchData();
      } else {
        Alert.alert("Error", response.data?.message || "Withdrawal failed");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit withdrawal");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("photographerId", photographerId.toString());
      if (editForm.firmName) formData.append("firmName", editForm.firmName);
      if (editForm.email) formData.append("email", editForm.email);
      if (editForm.phone) formData.append("phone", editForm.phone);
      if (editForm.address) formData.append("address", editForm.address);
      if (editForm.description) formData.append("description", editForm.description);
      // If profile picture is added, you'd handle it here
      const response = await api.post(API.UPDATE_PHOTOGRAPHER, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.status) {
        Alert.alert("Success", "Profile updated");
        setEditProfileModal(false);
        fetchData();
      } else {
        Alert.alert("Error", response.data?.message || "Update failed");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // ---------- Helper Functions ----------
  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || 0}`;

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return '#10B981';
      case 'ACCEPTED': return '#3B82F6';
      case 'REQUESTED': return '#F59E0B';
      case 'REJECTED': return '#EF4444';
      case 'CANCELED': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'COMPLETED': return '#D1FAE5';
      case 'ACCEPTED': return '#DBEAFE';
      case 'REQUESTED': return '#FEF3C7';
      case 'REJECTED': return '#FEE2E2';
      case 'CANCELED': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  };

  // ---------- Render Components ----------
  const renderHeader = () => (
    <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.headerGradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuIcon}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>{profile?.firmName || user?.name || "Photographer"}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate("Notifications")}>
              <Ionicons name="notifications-outline" size={28} color="#fff" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>{notifications.filter(n => !n.isRead).length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerProfileRow}>
          <View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#cbd5e1" />
              <Text style={styles.infoText}>{profile?.placeName || "Location N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.infoText}>{profile?.rating?.toFixed(1) || "0.0"} Rating</Text>
            </View>
          </View>
          <Image source={{ uri: getImageUrl(profile?.photograph) }} style={styles.profileImage} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderTabBar = () => (
    <View style={styles.tabBarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScroll}>
        {[
          { id: "dashboard", label: "Dashboard", icon: "grid-outline" },
          { id: "services", label: "Services", icon: "camera-outline" },
          { id: "gallery", label: "Gallery", icon: "images-outline" },
          { id: "bookings", label: "Bookings", icon: "calendar-outline" },
          { id: "earnings", label: "Earnings", icon: "wallet-outline" },
        ].map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.tabItem, tab === item.id && styles.activeTabItem]}
            onPress={() => setTab(item.id)}
          >
            <Ionicons name={item.icon} size={20} color={tab === item.id ? "#2c5a73" : "#94a3b8"} />
            <Text style={[styles.tabLabel, tab === item.id && styles.activeTabLabel]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderWalletCard = () => (
    <LinearGradient colors={['#2c5a73', '#1e3c4f']} style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="wallet-outline" size={24} color="#fff" />
          <Text style={styles.walletTitle}>Available Balance</Text>
        </View>
        <TouchableOpacity style={styles.withdrawBtn} onPress={() => setWithdrawalModal(true)}>
          <Text style={styles.withdrawBtnText}>Withdraw</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.walletAmount}>{formatCurrency(wallet - pendingWithdrawal)}</Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={styles.statusIconContainer}>
            <Ionicons name={isActive ? "flash" : "flash-off"} size={24} color={isActive ? "#10B981" : "#94a3b8"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{isActive ? "Accepting Bookings" : "Not Accepting Bookings"}</Text>
            <Text style={styles.statusSubtitle}>{isActive ? "Customers can book your services" : "Toggle on to start receiving bookings"}</Text>
          </View>
        </View>
        <Switch value={isActive} onValueChange={toggleStatus} trackColor={{ false: '#e2e8f0', true: '#10B981' }} thumbColor="#fff" />
      </View>
    </View>
  );

  const renderStatsGrid = () => {
    const stats = [
      { label: 'Total Bookings', value: appointments.length, icon: 'calendar-outline', color: '#3B82F6', bgColor: '#DBEAFE' },
      { label: 'Services', value: services.length, icon: 'camera-outline', color: '#8B5CF6', bgColor: '#EDE9FE' },
      { label: 'Photos', value: gallery.length, icon: 'images-outline', color: '#10B981', bgColor: '#D1FAE5' },
      { label: 'Rating', value: profile?.rating?.toFixed(1) || '0.0', icon: 'star-outline', color: '#F59E0B', bgColor: '#FEF3C7' },
    ];
    return (
      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statCard}>
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
        {[
          { label: 'Add Service', icon: 'add-circle', colors: ['#3B82F6', '#2563EB'], onPress: () => { resetServiceForm(); setServiceModal(true); } },
          { label: 'Upload Photos', icon: 'cloud-upload', colors: ['#10B981', '#059669'], onPress: pickGalleryImages },
          { label: 'Withdraw', icon: 'wallet', colors: ['#8B5CF6', '#7C3AED'], onPress: () => setWithdrawalModal(true) },
          { label: 'Edit Profile', icon: 'create', colors: ['#F59E0B', '#D97706'], onPress: () => setEditProfileModal(true) },
        ].map((action, i) => (
          <TouchableOpacity key={i} style={styles.quickAction} onPress={action.onPress}>
            <LinearGradient colors={action.colors} style={styles.quickActionGradient}>
              <Ionicons name={action.icon} size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentBookings = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
        </View>
        <TouchableOpacity onPress={() => setTab("bookings")}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {appointments.slice(0, 3).map(item => (
        <TouchableOpacity key={item.id} style={styles.bookingItem} onPress={() => { setSelectedBooking(item); setBookingModal(true); }}>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <View style={[styles.bookingStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingTitle}>{item.serviceTitle || "Photography Service"}</Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="person-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.customerName || "Customer"}</Text>
                <View style={styles.metaDot} />
                <Ionicons name="calendar-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{new Date(item.createdOn).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bookingAmount}>{formatCurrency(item.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      {appointments.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
          <Text style={styles.emptyStateText}>When customers book your services, they will appear here</Text>
        </View>
      )}
    </View>
  );

  const renderServices = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="camera-outline" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>My Services</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => { resetServiceForm(); setServiceModal(true); }}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {services.map(item => (
        <View key={item.id} style={styles.serviceItem}>
          {item.image && <Image source={{ uri: getImageUrl(item.image) }} style={styles.serviceImage} />}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.servicePrice}>{formatCurrency(item.servicePrice)}</Text>
            </View>
            <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.serviceStatsText}>{item.bookings || 0} bookings</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => { setServiceForm({ id: item.id, title: item.title, description: item.description, servicePrice: item.servicePrice?.toString(), image: null }); setServiceModal(true); }}>
                  <Feather name="edit-2" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteService(item.id)}>
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}
      {services.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Services</Text>
          <Text style={styles.emptyStateText}>Add your first photography service to start receiving bookings</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => { resetServiceForm(); setServiceModal(true); }}>
            <Text style={styles.emptyStateButtonText}>Add Service</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderGallery = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="images-outline" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>My Gallery</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={pickGalleryImages}>
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={gallery}
        keyExtractor={item => item.id?.toString()}
        numColumns={3}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.galleryItem} onPress={() => openFullImage(getImageUrl(item.image))} onLongPress={() => handleDeleteImage(item.id)}>
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.galleryImage} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Photos</Text>
            <Text style={styles.emptyStateText}>Upload your best work to showcase your photography skills</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={pickGalleryImages}>
              <Text style={styles.emptyStateButtonText}>Upload Photos</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );

  // ✅ ADDED: renderBookings (the missing function)
  const renderBookings = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>All Bookings</Text>
        </View>
      </View>

      {appointments.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.bookingItem}
          onPress={() => { setSelectedBooking(item); setBookingModal(true); }}
        >
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <View style={[styles.bookingStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingTitle}>{item.serviceTitle || "Photography Service"}</Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="person-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.customerName || "Customer"}</Text>
                <View style={styles.metaDot} />
                <Ionicons name="time-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.time || "Flexible"}</Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bookingAmount}>{formatCurrency(item.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {appointments.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Bookings</Text>
          <Text style={styles.emptyStateText}>You don't have any booking requests at the moment</Text>
        </View>
      )}
    </View>
  );

  // ✅ Booking Modal (accept/reject/complete)
  const renderBookingModal = () => (
  <Modal visible={bookingModal} animationType="slide" transparent onRequestClose={() => setBookingModal(false)}>
    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Booking Details</Text>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setBookingModal(false)}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {selectedBooking && (
          <ScrollView>
            <View style={styles.bookingDetailSection}>
              <View style={styles.bookingDetailRow}>
                <Text style={styles.bookingDetailLabel}>Customer Name</Text>
                <Text style={styles.bookingDetailValue}>{selectedBooking.customerName || 'N/A'}</Text>
              </View>

              <View style={styles.bookingDetailRow}>
                <Text style={styles.bookingDetailLabel}>Service</Text>
                <Text style={styles.bookingDetailValue}>{selectedBooking.serviceTitle || 'Photography Service'}</Text>
              </View>

              <View style={styles.bookingDetailRow}>
                <Text style={styles.bookingDetailLabel}>Booking Date</Text>
                <Text style={styles.bookingDetailValue}>{new Date(selectedBooking.createdOn).toLocaleString()}</Text>
              </View>

              <View style={styles.bookingDetailRow}>
                <Text style={styles.bookingDetailLabel}>Amount</Text>
                <Text style={styles.bookingDetailValue}>{formatCurrency(selectedBooking.amount)}</Text>
              </View>

              <View style={styles.bookingDetailRow}>
                <Text style={styles.bookingDetailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedBooking.status) }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedBooking.status) }]}>
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

            {/* ✅ Accept/Reject for REQUESTED status (case‑insensitive) */}
            {selectedBooking.status === 'REQUESTED' && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.acceptModalBtn}
                  onPress={() => {
                    handleStatusUpdate(selectedBooking.id, 'ACCEPTED');
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

            {/* ✅ Complete button for ACCEPTED status */}
           {selectedBooking.status === 'ACCEPTED' && (
  <TouchableOpacity
    style={styles.completeModalBtn}
    onPress={() => {
      setBookingModal(false);
      setOtpModal(true);
    }}
  >
    <Text style={styles.completeModalBtnText}>Complete Service</Text>
  </TouchableOpacity>
)}
       

            {/* Debug: if no buttons show, log status */}
            {selectedBooking.status !== 'REQUESTED' && selectedBooking.status !== 'ACCEPTED' && (
              <Text style={{ textAlign: 'center', marginTop: 10, color: '#EF4444' }}>
                No actions available for status: {selectedBooking.status}
              </Text>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  </Modal>
);
const renderOtpModal = () => (
  <Modal visible={otpModal} animationType="slide" transparent onRequestClose={() => { setOtpModal(false); setOtpCode(""); }}>
    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Complete Service</Text>
          <TouchableOpacity onPress={() => { setOtpModal(false); setOtpCode(""); }}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        <View style={styles.otpContainer}>
          <View style={styles.otpIconContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#10B981" />
          </View>
          <Text style={styles.otpTitle}>Enter OTP</Text>
          <Text style={styles.otpText}>
            Ask the customer to share the 6-digit OTP sent to their registered mobile number
          </Text>
          <TextInput
            style={styles.otpInput}
            value={otpCode}
            onChangeText={setOtpCode}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={6}
          />
          <TouchableOpacity style={styles.verifyBtn} onPress={handleCompleteBooking}>
            <Text style={styles.verifyBtnText}>Verify & Complete</Text>
          </TouchableOpacity>
          <Text style={styles.otpNote}>
            Payment will be released to your wallet after successful verification
          </Text>
        </View>
      </View>
    </View>
  </Modal>
);

  const renderRejectModal = () => (
    <Modal visible={rejectModal} animationType="slide" transparent onRequestClose={() => setRejectModal(false)}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reject Booking</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setRejectModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle" size={32} color="#EF4444" />
            <Text style={styles.warningTitle}>Are you sure?</Text>
            <Text style={styles.warningText}>Rejecting bookings will affect your acceptance rate.</Text>
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
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRejectModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: '#EF4444' }]} onPress={handleRejectBooking}>
              <Text style={styles.modalSaveText}>Confirm Rejection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditProfileModal = () => (
    <Modal visible={editProfileModal} animationType="slide" transparent onRequestClose={() => setEditProfileModal(false)}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditProfileModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Firm/Agency Name</Text>
              <TextInput style={styles.modalInput} value={editForm.firmName} onChangeText={t => setEditForm({...editForm, firmName: t})} placeholder="Enter your agency name" />
            </View>
            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Email</Text>
              <TextInput style={styles.modalInput} value={editForm.email} onChangeText={t => setEditForm({...editForm, email: t})} placeholder="Enter email" keyboardType="email-address" />
            </View>
            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Phone</Text>
              <TextInput style={styles.modalInput} value={editForm.phone} onChangeText={t => setEditForm({...editForm, phone: t})} placeholder="Enter phone number" keyboardType="phone-pad" />
            </View>
            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Address</Text>
              <TextInput style={[styles.modalInput, styles.modalTextArea]} value={editForm.address} onChangeText={t => setEditForm({...editForm, address: t})} placeholder="Enter your address" multiline />
            </View>
            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>About You</Text>
              <TextInput style={[styles.modalInput, styles.modalTextArea]} value={editForm.description} onChangeText={t => setEditForm({...editForm, description: t})} placeholder="Tell customers about your photography services" multiline />
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
      </View>
    </Modal>
  );

  const renderServiceModal = () => (
    <Modal visible={serviceModal} animationType="slide" transparent onRequestClose={() => { resetServiceForm(); setServiceModal(false); }}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{serviceForm.id ? "Edit Service" : "Add New Service"}</Text>
            <TouchableOpacity onPress={() => { resetServiceForm(); setServiceModal(false); }}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.modalImagePicker} onPress={pickServiceImage}>
            {serviceForm.image ? <Image source={{ uri: serviceForm.image.uri }} style={styles.modalPreviewImage} /> : <View style={styles.modalImagePlaceholder}><Ionicons name="camera-outline" size={40} color="#94a3b8" /><Text style={styles.modalImageText}>Add Service Photo</Text></View>}
          </TouchableOpacity>
          <View style={styles.modalFormGroup}>
            <Text style={styles.modalLabel}>Service Title</Text>
            <TextInput style={styles.modalInput} value={serviceForm.title} onChangeText={t => setServiceForm({...serviceForm, title: t})} placeholder="e.g., Wedding Photography" />
          </View>
          <View style={styles.modalFormGroup}>
            <Text style={styles.modalLabel}>Price (₹)</Text>
            <TextInput style={styles.modalInput} value={serviceForm.servicePrice} onChangeText={t => setServiceForm({...serviceForm, servicePrice: t})} placeholder="e.g., 5000" keyboardType="numeric" />
          </View>
          <View style={styles.modalFormGroup}>
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput style={[styles.modalInput, styles.modalTextArea]} value={serviceForm.description} onChangeText={t => setServiceForm({...serviceForm, description: t})} placeholder="Describe your service..." multiline />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { resetServiceForm(); setServiceModal(false); }}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveService}><Text style={styles.modalSaveText}>{serviceForm.id ? "Update" : "Save"}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderGalleryModal = () => (
    <Modal visible={galleryModal} animationType="slide" transparent onRequestClose={() => { setGalleryModal(false); setSelectedImages([]); }}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload to Gallery</Text>
            <TouchableOpacity onPress={() => { setGalleryModal(false); setSelectedImages([]); }}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
          </View>
          {selectedImages.length > 0 ? (
            <>
              <ScrollView><View style={styles.selectedImagesGrid}>{selectedImages.map((img, idx) => (<View key={idx} style={styles.selectedImageItem}><Image source={{ uri: img.uri }} style={styles.selectedImage} /><TouchableOpacity style={styles.removeImageBtn} onPress={() => { const newImages = [...selectedImages]; newImages.splice(idx, 1); setSelectedImages(newImages); }}><Ionicons name="close-circle" size={24} color="#EF4444" /></TouchableOpacity></View>))}</View>
              <TouchableOpacity style={styles.addMoreBtn} onPress={pickGalleryImages}><Ionicons name="add" size={20} color="#3B82F6" /><Text style={styles.addMoreText}>Add More</Text></TouchableOpacity></ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setGalleryModal(false); setSelectedImages([]); }}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={uploadGalleryImages}><Text style={styles.modalSaveText}>Upload {selectedImages.length} Photo{selectedImages.length > 1 ? 's' : ''}</Text></TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.uploadPrompt}>
              <Ionicons name="cloud-upload-outline" size={64} color="#94a3b8" />
              <Text style={styles.uploadTitle}>Upload Photos</Text>
              <Text style={styles.uploadText}>Showcase your work</Text>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickGalleryImages}><Ionicons name="images-outline" size={20} color="#fff" /><Text style={styles.uploadBtnText}>Select Photos</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderWithdrawalModal = () => (
    <Modal visible={withdrawalModal} animationType="slide" transparent onRequestClose={() => { setWithdrawalModal(false); setWithdrawalAmount(""); }}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>
            <TouchableOpacity onPress={() => { setWithdrawalModal(false); setWithdrawalAmount(""); }}><Ionicons name="close" size={24} color="#64748b" /></TouchableOpacity>
          </View>
          <View style={styles.balancePreview}><Text style={styles.balancePreviewLabel}>Available Balance</Text><Text style={styles.balancePreviewAmount}>{formatCurrency(wallet - pendingWithdrawal)}</Text></View>
          <View style={styles.modalFormGroup}><Text style={styles.modalLabel}>Withdrawal Amount</Text><TextInput style={styles.modalInput} placeholder="Enter amount" value={withdrawalAmount} onChangeText={setWithdrawalAmount} keyboardType="numeric" /></View>
          <Text style={styles.sectionSubtitle}>Bank Details</Text>
          <View style={styles.modalFormGroup}><Text style={styles.modalLabel}>Account Holder Name</Text><TextInput style={styles.modalInput} value={bankDetails.accountHolderName} onChangeText={t => setBankDetails({...bankDetails, accountHolderName: t})} /></View>
          <View style={styles.modalFormGroup}><Text style={styles.modalLabel}>Bank Name</Text><TextInput style={styles.modalInput} value={bankDetails.bankName} onChangeText={t => setBankDetails({...bankDetails, bankName: t})} /></View>
          <View style={styles.modalFormGroup}><Text style={styles.modalLabel}>Account Number</Text><TextInput style={styles.modalInput} value={bankDetails.accountNumber} onChangeText={t => setBankDetails({...bankDetails, accountNumber: t})} keyboardType="numeric" /></View>
          <View style={styles.row}><View style={[styles.modalFormGroup, { flex: 1, marginRight: 8 }]}><Text style={styles.modalLabel}>IFSC Code</Text><TextInput style={styles.modalInput} value={bankDetails.ifsc} onChangeText={t => setBankDetails({...bankDetails, ifsc: t})} /></View><View style={[styles.modalFormGroup, { flex: 1, marginLeft: 8 }]}><Text style={styles.modalLabel}>UPI ID</Text><TextInput style={styles.modalInput} value={bankDetails.upiId} onChangeText={t => setBankDetails({...bankDetails, upiId: t})} /></View></View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setWithdrawalModal(false); setWithdrawalAmount(""); }}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleWithdrawal}><Text style={styles.modalSaveText}>Request Withdrawal</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEarnings = () => (
    <View>
      <LinearGradient colors={['#2c5a73', '#1e3c4f']} style={styles.earningsCard}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="swap-horizontal" size={20} color="#2c5a73" />
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>
        </View>
        {transactions.map(item => (
          <View key={item.id} style={styles.transactionItem}>
            <View style={[styles.transactionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-down" size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionTitle}>Payment Received</Text>
              <Text style={styles.transactionDate}>{new Date(item.createdOn).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.transactionCredit}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}
        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Transactions</Text>
            <Text style={styles.emptyStateText}>Your transaction history will appear here</Text>
          </View>
        )}
      </View>
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="wallet-outline" size={20} color="#2c5a73" />
            <Text style={styles.sectionTitle}>Withdrawal History</Text>
          </View>
        </View>
        {withdrawals.map(item => (
          <View key={item.id} style={styles.transactionItem}>
            <View style={[styles.transactionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="arrow-up" size={20} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.transactionTitle}>Withdrawal Request</Text>
              <Text style={styles.transactionDate}>{new Date(item.createdOn).toLocaleDateString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.transactionDebit}>-{formatCurrency(item.amount)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
          </View>
        ))}
        {withdrawals.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No Withdrawals</Text>
            <Text style={styles.emptyStateText}>Your withdrawal history will appear here</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c5a73" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabBar()}
      <ScrollView
        style={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2c5a73" />}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'dashboard' && (
          <View style={styles.dashboardContent}>
            {renderWalletCard()}
            {renderStatusToggle()}
            {renderStatsGrid()}
            {renderQuickActions()}
            {renderRecentBookings()}
          </View>
        )}
        {tab === 'services' && renderServices()}
        {tab === 'gallery' && renderGallery()}
        {tab === 'bookings' && renderBookings()}
        {tab === 'earnings' && renderEarnings()}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Menu Modal */}
      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        profile={profile}
        user={user}
        onEditProfile={() => setEditProfileModal(true)}
        onSettings={() => navigation.navigate("Settings")}
        onHelp={() => navigation.navigate("Help")}
        onPrivacyPolicy={() => navigation.navigate("PrivacyPolicy")}
        onLogout={() => {
          Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout }
          ]);
        }}
        getImageUrl={getImageUrl}
      />

      {/* All Modals */}
      {renderServiceModal()}
      {renderGalleryModal()}
      {renderWithdrawalModal()}
      {renderBookingModal()}
      {renderRejectModal()}
      {renderEditProfileModal()}
    </SafeAreaView>
  );
}

// ---------- Styles (unchanged from your original – include them here) ----------
// (Copy the entire styles object from your original code – it's large but necessary)
// For brevity, I'm not duplicating the 300+ lines of styles. Use the same styles you already had.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerGradient: { paddingTop: 10, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  menuIcon: { marginRight: 15, padding: 5 },
  headerGreeting: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginBottom: 2 },
  headerName: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  notificationBtn: { padding: 8, marginRight: 12, position: "relative" },
  notificationBadge: { position: "absolute", top: 4, right: 4, backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center" },
  notificationCount: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  headerProfileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  infoText: { color: "#cbd5e1", fontSize: 13, marginLeft: 6 },
  profileImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  tabBarContainer: { backgroundColor: "#fff", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", elevation: 2 },
  tabBarScroll: { paddingHorizontal: 16 },
  tabItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: "#f8fafc" },
  activeTabItem: { backgroundColor: "#e6f0f5" },
  tabLabel: { fontSize: 14, color: "#64748b", marginLeft: 6, fontWeight: "500" },
  activeTabLabel: { color: "#2c5a73", fontWeight: "600" },
  scrollContent: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  dashboardContent: { paddingBottom: 8 },
  walletCard: { borderRadius: 20, padding: 20, marginBottom: 16, elevation: 4 },
  walletHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  walletTitle: { fontSize: 16, color: "#fff", marginLeft: 8, opacity: 0.9 },
  withdrawBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  withdrawBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", marginRight: 4 },
  walletAmount: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  walletFooter: { flexDirection: "row", alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  walletStat: { flex: 1 },
  walletStatLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  walletStatValue: { fontSize: 16, fontWeight: "600", color: "#fff" },
  walletDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 16 },
  statusCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  statusContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center", marginRight: 12 },
  statusTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  statusSubtitle: { fontSize: 12, color: "#64748b" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 16 },
  statCard: { width: "50%", paddingHorizontal: 4, marginBottom: 8 },
  statIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#1e293b", marginBottom: 2 },
  statLabel: { fontSize: 12, color: "#64748b" },
  quickActionsCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 16 },
  quickActionsGrid: { flexDirection: "row", justifyContent: "space-between" },
  quickAction: { alignItems: "center", flex: 1 },
  quickActionGradient: { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 8, elevation: 2 },
  quickActionLabel: { fontSize: 12, color: "#64748b", textAlign: "center" },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginLeft: 8 },
  viewAllText: { fontSize: 14, color: "#2c5a73", fontWeight: "600" },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#2c5a73", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 4 },
  bookingItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  bookingStatusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  bookingTitle: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  bookingMeta: { flexDirection: "row", alignItems: "center" },
  bookingMetaText: { fontSize: 11, color: "#64748b", marginLeft: 4 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#cbd5e1", marginHorizontal: 8 },
  bookingAmount: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  serviceItem: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 12 },
  serviceImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: "#e2e8f0" },
  serviceTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  servicePrice: { fontSize: 15, fontWeight: "bold", color: "#2c5a73" },
  serviceDesc: { fontSize: 12, color: "#64748b", lineHeight: 18, marginTop: 4 },
  serviceStatsText: { fontSize: 11, color: "#64748b", marginLeft: 4 },
  galleryItem: { flex: 1, aspectRatio: 1, margin: 4, borderRadius: 8, overflow: "hidden", elevation: 1 },
  galleryImage: { width: "100%", height: "100%" },
  earningsCard: { borderRadius: 20, padding: 20, marginBottom: 16, marginHorizontal: 4, elevation: 4 },
  earningsLabel: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginBottom: 8 },
  earningsAmount: { fontSize: 36, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  earningsStats: { flexDirection: "row", alignItems: "center", paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
  earningsStat: { flex: 1 },
  earningsStatLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  earningsStatValue: { fontSize: 18, fontWeight: "600", color: "#fff" },
  earningsDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 16 },
  transactionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  transactionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  transactionTitle: { fontSize: 14, fontWeight: "500", color: "#1e293b", marginBottom: 2 },
  transactionDate: { fontSize: 11, color: "#64748b" },
  transactionCredit: { fontSize: 15, fontWeight: "600", color: "#10B981" },
  transactionDebit: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyStateTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 16 },
  emptyStateButton: { backgroundColor: "#2c5a73", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyStateButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  modalCloseBtn: { padding: 4 },
  modalImagePicker: { width: "100%", height: 180, backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 2, borderColor: "#e2e8f0", borderStyle: "dashed", marginBottom: 20, overflow: "hidden" },
  modalPreviewImage: { width: "100%", height: "100%" },
  modalImagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  modalImageText: { marginTop: 12, fontSize: 16, fontWeight: "600", color: "#1e293b" },
  modalFormGroup: { marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: "500", color: "#1e293b", marginBottom: 6 },
  modalInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, fontSize: 14, color: "#1e293b" },
  modalTextArea: { minHeight: 100, textAlignVertical: "top" },
  modalFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, marginRight: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, alignItems: "center" },
  modalCancelText: { fontSize: 16, fontWeight: "500", color: "#64748b" },
  modalSaveBtn: { flex: 1, paddingVertical: 14, marginLeft: 8, backgroundColor: "#2c5a73", borderRadius: 8, alignItems: "center" },
  modalSaveText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  selectedImagesGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  selectedImageItem: { width: "33.33%", aspectRatio: 1, padding: 4, position: "relative" },
  selectedImage: { width: "100%", height: "100%", borderRadius: 8 },
  removeImageBtn: { position: "absolute", top: 0, right: 0, backgroundColor: "#fff", borderRadius: 12 },
  addMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, marginTop: 16, borderWidth: 1, borderColor: "#2c5a73", borderRadius: 8, borderStyle: "dashed" },
  addMoreText: { color: "#2c5a73", fontSize: 14, fontWeight: "600", marginLeft: 8 },
  uploadPrompt: { alignItems: "center", paddingVertical: 32 },
  uploadTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginTop: 16, marginBottom: 8 },
  uploadText: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 },
  uploadBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2c5a73", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  uploadBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  balancePreview: { backgroundColor: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 20, alignItems: "center" },
  balancePreviewLabel: { fontSize: 14, color: "#64748b", marginBottom: 8 },
  balancePreviewAmount: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  sectionSubtitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 12 },
  row: { flexDirection: "row", gap: 12 },
  noteBox: { flexDirection: "row", backgroundColor: "#eff6ff", padding: 12, borderRadius: 8, marginTop: 16, alignItems: "center" },
  noteText: { flex: 1, fontSize: 12, color: "#1e293b", marginLeft: 8, lineHeight: 18 },
  bookingDetailSection: { marginBottom: 20 },
  bookingDetailRow: { marginBottom: 16 },
  bookingDetailLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  bookingDetailValue: { fontSize: 15, color: "#1e293b", fontWeight: "500" },
  ratingDisplay: { flexDirection: "row", alignItems: "center" },
  ratingValue: { fontSize: 15, fontWeight: "600", color: "#F59E0B", marginLeft: 4 },
  feedbackText: { fontSize: 14, color: "#64748b", fontStyle: "italic", marginTop: 4 },
  modalActions: { flexDirection: "row", marginTop: 20, gap: 12 },
  acceptModalBtn: { flex: 1, backgroundColor: "#10B981", paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  acceptModalBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  rejectModalBtn: { flex: 1, backgroundColor: "#EF4444", paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  rejectModalBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  completeModalBtn: { backgroundColor: "#10B981", paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 20 },
  completeModalBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  warningContainer: { alignItems: "center", marginBottom: 20 },
  warningTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginTop: 12, marginBottom: 8 },
  warningText: { fontSize: 14, color: "#64748b", textAlign: "center" },
});