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
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { API } from "../api/endpoints";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import MenuModal from "../components/MenuModal";

const { width } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

export default function PhotographerDashboard({ navigation }) {
  const { user, refreshUser, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
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

  // Modal States
  const [serviceModal, setServiceModal] = useState(false);
  const [galleryModal, setGalleryModal] = useState(false);
  const [withdrawalModal, setWithdrawalModal] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  // Form States
  const [rejectionReason, setRejectionReason] = useState("");
  const [otpCode, setOtpCode] = useState("");
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

  useEffect(() => {
    loadAllData();
    requestPermissions();
    loadNotifications();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
    }
  };

  // ✅ Safe image URL function with null check
  const getImageUrl = (path) => {
    if (!path) return null;
    if (typeof path !== 'string') return null;
    if (path.startsWith("http")) return path;
    try {
      const filename = path.split("/").pop();
      return `${BASE_URL}/api/image/download/${filename}`;
    } catch (error) {
      console.error("Error parsing image path:", error);
      return null;
    }
  };

  // ✅ ALL API CALLS USE POST METHOD
  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPhotographerDetails(),
        loadBookings(),
        loadServices(),
        loadGallery(),
        loadTransactions(),
        loadWithdrawals(),
      ]);
    } catch (error) {
      console.log("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotographerDetails = async () => {
    try {
      const response = await api.post(API.GET_PHOTOGRAPHERS_DETAILS, {
        photographerId: user?.id
      });
      if (response.data?.status) {
        setProfile(response.data.data);
        setIsActive(response.data.data?.active || false);
        setEditForm({
          firmName: response.data.data?.firmName || "",
          email: response.data.data?.email || "",
          phone: response.data.data?.phone || "",
          address: response.data.data?.address || "",
          description: response.data.data?.description || "",
        });
      }
    } catch (error) {
      console.error("Error loading photographer details:", error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await api.post(API.GET_APPOINTMENTS, {
        photographerId: user?.id,
        page: 1,
        perPage: 50
      });
      if (response.data?.status) {
        setBookings(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.post(API.GET_SERVICES, {
        photographerId: user?.id
      });
      if (response.data?.status) {
        setServices(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadGallery = async () => {
    try {
      const response = await api.post(API.ALL_IMAGES_BY_ID, {
        photographerId: user?.id,
        page: 1
      });
      if (response.data?.status) {
        setGallery(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading gallery:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await api.post(API.GET_TRANSACTION, {
        photographerId: user?.id,
        page: 1
      });
      if (response.data?.status) {
        setTransactions(response.data.data || []);
        const totalEarnings = response.data.data
          .filter(t => t.paymentStatus === "SUCCESS")
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        setWallet(totalEarnings);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const response = await api.post(API.GET_WITHDRAWAL, {
        photographerId: user?.id,
        page: 1
      });
      if (response.data?.status) {
        setWithdrawals(response.data.data || []);
        const pending = response.data.data
          .filter(w => w.status === "PENDING")
          .reduce((sum, w) => sum + (w.amount || 0), 0);
        setPendingWithdrawal(pending);
      }
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await api.post(API.GET_NOTIFICATIONS, {
        userId: user?.id,
        userRole: "PHOTOGRAPHER",
        page: 1
      });
      if (response.data?.status) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);

  // ✅ POST: Change Active Status
  const toggleStatus = async () => {
    try {
      const response = await api.post(API.CHANGE_PHOTOGRAPHER_ACTIVE_STATUS, {
        photographerId: user?.id,
        active: !isActive
      });
      if (response.data?.status) {
        setIsActive(!isActive);
        Alert.alert("Success", `Service ${!isActive ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (err) {
      console.error("Status change error:", err);
      Alert.alert("Error", "Status change failed");
    }
  };

  // ✅ POST: Respond to Appointment
  const respondBooking = async (id, status, note = "") => {
    try {
      const response = await api.post(API.RESPOND_APPOINTMENT, {
        appointmentId: id,
        status: status,
        note: note
      });
      if (response.data?.status) {
        Alert.alert("Success", `Booking ${status.toLowerCase()} successfully`);
        loadBookings();
      }
    } catch (err) {
      console.error("Booking response error:", err);
      Alert.alert("Error", "Action failed");
    }
  };

  // ✅ Handle reject booking
  const handleRejectBooking = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }
    await respondBooking(selectedBooking?.id, "REJECTED", rejectionReason);
    setRejectModal(false);
    setRejectionReason("");
  };

  // ✅ POST: Complete Appointment with OTP
  const handleCompleteBooking = async () => {
    if (!otpCode.trim()) {
      Alert.alert("Error", "Please enter OTP");
      return;
    }
    try {
      const response = await api.post("/appointment/complete", {
        appointmentId: selectedBooking?.id,
        otp: otpCode
      });
      if (response.data?.status) {
        Alert.alert("Success", "Service completed successfully");
        setOtpModal(false);
        setOtpCode("");
        loadBookings();
        loadTransactions();
      } else {
        Alert.alert("Error", response.data?.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Complete booking error:", error);
      Alert.alert("Error", "Failed to complete service");
    }
  };

  // ✅ POST: Save Service (Create/Update)
  const handleSaveService = async () => {
    if (!serviceForm.title.trim()) {
      Alert.alert("Error", "Service title is required");
      return;
    }
    if (!serviceForm.servicePrice || parseFloat(serviceForm.servicePrice) <= 0) {
      Alert.alert("Error", "Valid price is required");
      return;
    }
    if (!serviceForm.description.trim()) {
      Alert.alert("Error", "Service description is required");
      return;
    }

    try {
      const formData = new FormData();
      if (serviceForm.id) {
        formData.append("serviceId", serviceForm.id);
      }
      formData.append("photographerId", user?.id.toString());
      formData.append("title", serviceForm.title.trim());
      formData.append("description", serviceForm.description.trim());
      formData.append("servicePrice", parseFloat(serviceForm.servicePrice).toString());
      if (serviceForm.image) {
        formData.append("image", serviceForm.image);
      }

      const endpoint = serviceForm.id ? API.UPDATE_SERVICE : API.CREATE_SERVICE;
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.status) {
        Alert.alert("Success", `Service ${serviceForm.id ? 'updated' : 'added'} successfully`);
        setServiceModal(false);
        resetServiceForm();
        loadServices();
      }
    } catch (error) {
      console.error("Save service error:", error);
      Alert.alert("Error", "Failed to save service");
    }
  };

  // ✅ POST: Delete Service
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
              const response = await api.post(API.DELETE_SERVICE, { serviceId });
              if (response.data?.status) {
                Alert.alert("Success", "Service deleted successfully");
                loadServices();
              }
            } catch (error) {
              console.error("Delete service error:", error);
              Alert.alert("Error", "Failed to delete service");
            }
          }
        }
      ]
    );
  };

  // ✅ POST: Upload Gallery Images
  const uploadGalleryImages = async () => {
    if (selectedImages.length === 0) {
      Alert.alert("Error", "Please select images to upload");
      return;
    }

    try {
      setLoading(true);
      for (const image of selectedImages) {
        const formData = new FormData();
        formData.append("photographerId", user?.id.toString());
        formData.append("image", {
          uri: image.uri,
          type: image.mimeType || 'image/jpeg',
          name: `gallery_${Date.now()}.jpg`,
        });
        await api.post(API.ADD_IMAGE, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      Alert.alert("Success", `${selectedImages.length} photo(s) uploaded successfully`);
      setGalleryModal(false);
      setSelectedImages([]);
      loadGallery();
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload images");
    } finally {
      setLoading(false);
    }
  };

  // ✅ POST: Delete Image
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
              const response = await api.post(API.DELETE_IMAGE, { imageId });
              if (response.data?.status) {
                Alert.alert("Success", "Image deleted successfully");
                loadGallery();
              }
            } catch (error) {
              console.error("Delete image error:", error);
              Alert.alert("Error", "Failed to delete image");
            }
          }
        }
      ]
    );
  };

  // ✅ POST: Create Withdrawal
  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      Alert.alert("Error", "Please enter valid amount");
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount > wallet - pendingWithdrawal) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }

    if (!bankDetails.accountNumber && !bankDetails.upiId) {
      Alert.alert("Error", "Please provide bank account or UPI details");
      return;
    }

    try {
      const response = await api.post(API.CREATE_WITHDRAWAL, {
        photographerId: user?.id,
        amount: amount,
        amountToBeSettled: amount,
        charge: 0,
        paymentToken: `WD_${Date.now()}`,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountHolderName: bankDetails.accountHolderName,
        ifsc: bankDetails.ifsc,
        upiId: bankDetails.upiId,
      });

      if (response.data?.status) {
        Alert.alert("Success", "Withdrawal request submitted successfully");
        setWithdrawalModal(false);
        setWithdrawalAmount("");
        loadWithdrawals();
        loadTransactions();
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      Alert.alert("Error", "Failed to submit withdrawal request");
    }
  };

  // ✅ POST: Update Profile
  const handleUpdateProfile = async () => {
    try {
      const response = await api.post(API.UPDATE_PHOTOGRAPHER, {
        photographerId: user?.id,
        firmName: editForm.firmName,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        description: editForm.description,
      });

      if (response.data?.status) {
        Alert.alert("Success", "Profile updated successfully");
        setEditProfileModal(false);
        loadPhotographerDetails();
      }
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // ✅ Handle Logout
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
          }
        }
      ]
    );
  };

  const pickServiceImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setServiceForm({
          ...serviceForm,
          image: {
            uri: result.assets[0].uri,
            type: result.assets[0].mimeType || 'image/jpeg',
            name: `service_${Date.now()}.jpg`,
          }
        });
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  const pickGalleryImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        setSelectedImages(result.assets);
      }
    } catch (error) {
      console.error("Gallery picker error:", error);
    }
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

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString() || 0}`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return '#10B981';
      case 'ACCEPTED': return '#3B82F6';
      case 'PENDING': return '#F59E0B';
      case 'REJECTED': return '#EF4444';
      case 'CANCELLED': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'COMPLETED': return '#D1FAE5';
      case 'ACCEPTED': return '#DBEAFE';
      case 'PENDING': return '#FEF3C7';
      case 'REJECTED': return '#FEE2E2';
      case 'CANCELLED': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  };

  // ============ RENDER SECTIONS ============

  const renderHeader = () => (
    <LinearGradient
      colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1e3c4f" />
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuIcon}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>
                {profile?.firmName || profile?.name || 'Photographer Dashboard'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationBtn}
              onPress={() => navigation?.navigate("Notifications")}
            >
              <Ionicons name="notifications-outline" size={28} color="#fff" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {notifications.filter(n => !n.isRead).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => setEditProfileModal(true)}
            >
              {profile?.featuredImage ? (
                <Image 
                  source={{ uri: getImageUrl(profile.featuredImage) }} 
                  style={styles.headerProfileImage}
                />
              ) : (
                <View style={styles.headerProfilePlaceholder}>
                  <Text style={styles.headerProfileInitial}>
                    {profile?.firmName?.charAt(0) || profile?.name?.charAt(0) || 'P'}
                  </Text>
                </View>
              )}
            </TouchableOpacity> */}
          </View>
        </View>

        <View style={styles.verificationContainer}>
          {/* <View style={styles.verificationBadge}>
            <Ionicons 
              name={profile?.approvalStatus === 'APPROVED' ? 'checkmark-circle' : 'time'} 
              size={16} 
              color={profile?.approvalStatus === 'APPROVED' ? '#10B981' : '#F59E0B'} 
            />
            <Text style={[
              styles.verificationText,
              { color: profile?.approvalStatus === 'APPROVED' ? '#10B981' : '#F59E0B' }
            ]}>
              {profile?.approvalStatus || 'PENDING'}
            </Text>
          </View> */}
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
          { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { id: 'services', label: 'Services', icon: 'camera' },
          { id: 'gallery', label: 'Gallery', icon: 'images' },
          { id: 'bookings', label: 'Bookings', icon: 'calendar' },
          { id: 'earnings', label: 'Earnings', icon: 'wallet' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabItem,
              activeTab === tab.id && styles.activeTabItem
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? '#2c5a73' : '#94a3b8'} 
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderWalletCard = () => (
    <LinearGradient
      colors={['#2c5a73', '#1e3c4f']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.walletCard}
    >
      <View style={styles.walletHeader}>
        <View style={styles.walletTitleContainer}>
          <Ionicons name="wallet-outline" size={24} color="#fff" />
          <Text style={styles.walletTitle}>Available Balance</Text>
        </View>
        <TouchableOpacity 
          style={styles.withdrawBtn}
          onPress={() => setWithdrawalModal(true)}
        >
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
        <View style={styles.statusInfo}>
          <View style={styles.statusIconContainer}>
            <Ionicons 
              name={isActive ? 'flash' : 'flash-off'} 
              size={24} 
              color={isActive ? '#10B981' : '#94a3b8'} 
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {isActive ? 'Accepting Bookings' : 'Not Accepting Bookings'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isActive 
                ? 'Customers can book your services' 
                : 'Toggle on to start receiving bookings'}
            </Text>
          </View>
        </View>
        <Switch
          value={isActive}
          onValueChange={toggleStatus}
          trackColor={{ false: '#e2e8f0', true: '#10B981' }}
          thumbColor="#fff"
          ios_backgroundColor="#e2e8f0"
        />
      </View>
    </View>
  );

  const renderStatsGrid = () => {
    const stats = [
      { 
        label: 'Total Bookings', 
        value: bookings.length, 
        icon: 'calendar', 
        color: '#3B82F6',
        bgColor: '#DBEAFE'
      },
      { 
        label: 'Services', 
        value: services.length, 
        icon: 'camera', 
        color: '#8B5CF6',
        bgColor: '#EDE9FE'
      },
      { 
        label: 'Photos', 
        value: gallery.length, 
        icon: 'images', 
        color: '#10B981',
        bgColor: '#D1FAE5'
      },
      { 
        label: 'Rating', 
        value: profile?.rating?.toFixed(1) || '0.0', 
        icon: 'star', 
        color: '#F59E0B',
        bgColor: '#FEF3C7'
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
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="add-circle" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionLabel}>Add Service</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => setGalleryModal(true)}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="cloud-upload" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionLabel}>Upload Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => setWithdrawalModal(true)}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.quickActionGradient}
          >
            <Ionicons name="wallet" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.quickActionLabel}>Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => setEditProfileModal(true)}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.quickActionGradient}
          >
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
        <TouchableOpacity
          key={item.id}
          style={styles.bookingItem}
          onPress={() => {
            setSelectedBooking(item);
            setBookingModal(true);
          }}
        >
          <View style={styles.bookingItemLeft}>
            <View style={[styles.bookingStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.bookingItemContent}>
              <Text style={styles.bookingServiceTitle}>
                {item.serviceTitle || 'Photography Service'}
              </Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="person-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.customerName || 'Customer'}</Text>
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
          </View>
        </TouchableOpacity>
      ))}

      {bookings.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
          <Text style={styles.emptyStateText}>
            When customers book your services, they will appear here
          </Text>
        </View>
      )}
    </View>
  );

  const renderServices = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="camera" size={20} color="#2c5a73" />
          <Text style={styles.sectionTitle}>My Services</Text>
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
            <Image 
              source={{ uri: getImageUrl(item.image) }} 
              style={styles.serviceItemImage}
            />
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
                <Ionicons name="calendar-check" size={14} color="#64748b" />
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
          <Ionicons name="camera-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateTitle}>No Services</Text>
          <Text style={styles.emptyStateText}>
            Add your first photography service to start receiving bookings
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => {
              resetServiceForm();
              setServiceModal(true);
            }}
          >
            <Text style={styles.emptyStateButtonText}>Add Service</Text>
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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setGalleryModal(true)}
        >
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
              Upload your best work to showcase your photography skills
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setGalleryModal(true)}
            >
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
        <TouchableOpacity
          key={item.id}
          style={styles.bookingItem}
          onPress={() => {
            setSelectedBooking(item);
            setBookingModal(true);
          }}
        >
          <View style={styles.bookingItemLeft}>
            <View style={[styles.bookingStatusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.bookingItemContent}>
              <Text style={styles.bookingServiceTitle}>
                {item.serviceTitle || 'Photography Service'}
              </Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="person-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.customerName || 'Customer'}</Text>
                <View style={styles.bookingMetaDot} />
                <Ionicons name="time-outline" size={12} color="#64748b" />
                <Text style={styles.bookingMetaText}>{item.time || 'Flexible'}</Text>
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
          </View>
        </TouchableOpacity>
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
        colors={['#2c5a73', '#1e3c4f']}
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
            <View style={[styles.transactionIcon, { backgroundColor: '#D1FAE5' }]}>
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
            <View style={[styles.transactionIcon, { backgroundColor: '#FEE2E2' }]}>
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
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                  {item.status}
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
      transparent={true}
      onRequestClose={() => {
        resetServiceForm();
        setServiceModal(false);
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {serviceForm.id ? 'Edit Service' : 'Add New Service'}
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

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.modalImagePicker}
              onPress={pickServiceImage}
            >
              {serviceForm.image ? (
                <Image
                  source={{ uri: serviceForm.image.uri }}
                  style={styles.modalPreviewImage}
                />
              ) : (
                <View style={styles.modalImagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#94a3b8" />
                  <Text style={styles.modalImageText}>Add Service Photo</Text>
                  <Text style={styles.modalImageSubtext}>Recommended: 4:3 ratio</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Service Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Wedding Photography, Birthday Shoot"
                placeholderTextColor="#94a3b8"
                value={serviceForm.title}
                onChangeText={(text) => setServiceForm({...serviceForm, title: text})}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Price (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 5000"
                placeholderTextColor="#94a3b8"
                value={serviceForm.servicePrice}
                onChangeText={(text) => setServiceForm({...serviceForm, servicePrice: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Describe what's included in this service..."
                placeholderTextColor="#94a3b8"
                value={serviceForm.description}
                onChangeText={(text) => setServiceForm({...serviceForm, description: text})}
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
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleSaveService}
            >
              <Text style={styles.modalSaveText}>
                {serviceForm.id ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderGalleryModal = () => (
    <Modal
      visible={galleryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setGalleryModal(false);
        setSelectedImages([]);
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
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
              <ScrollView>
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
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={pickGalleryImages}
                >
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
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={uploadGalleryImages}
                >
                  <Text style={styles.modalSaveText}>
                    Upload {selectedImages.length} Photo{selectedImages.length > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.uploadPrompt}>
              <Ionicons name="cloud-upload-outline" size={64} color="#94a3b8" />
              <Text style={styles.uploadTitle}>Upload Photos</Text>
              <Text style={styles.uploadText}>
                Showcase your best photography work
              </Text>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={pickGalleryImages}
              >
                <Ionicons name="images-outline" size={20} color="#fff" />
                <Text style={styles.uploadBtnText}>Select Photos</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderWithdrawalModal = () => (
    <Modal
      visible={withdrawalModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setWithdrawalModal(false);
        setWithdrawalAmount("");
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
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

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.balancePreview}>
              <Text style={styles.balancePreviewLabel}>Available Balance</Text>
              <Text style={styles.balancePreviewAmount}>
                {formatCurrency(wallet - pendingWithdrawal)}
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

            <Text style={styles.sectionSubtitle}>Bank Details</Text>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="As per bank records"
                placeholderTextColor="#94a3b8"
                value={bankDetails.accountHolderName}
                onChangeText={(text) => setBankDetails({...bankDetails, accountHolderName: text})}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Bank Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., State Bank of India"
                placeholderTextColor="#94a3b8"
                value={bankDetails.bankName}
                onChangeText={(text) => setBankDetails({...bankDetails, bankName: text})}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Account Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter account number"
                placeholderTextColor="#94a3b8"
                value={bankDetails.accountNumber}
                onChangeText={(text) => setBankDetails({...bankDetails, accountNumber: text})}
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
                  onChangeText={(text) => setBankDetails({...bankDetails, ifsc: text})}
                />
              </View>
              <View style={[styles.modalFormGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.modalLabel}>UPI ID</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="UPI ID (optional)"
                  placeholderTextColor="#94a3b8"
                  value={bankDetails.upiId}
                  onChangeText={(text) => setBankDetails({...bankDetails, upiId: text})}
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
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleWithdrawal}
            >
              <Text style={styles.modalSaveText}>Request Withdrawal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBookingModal = () => (
    <Modal
      visible={bookingModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setBookingModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setBookingModal(false)}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedBooking && (
            <ScrollView>
              <View style={styles.bookingDetailSection}>
                <View style={styles.bookingDetailRow}>
                  <Text style={styles.bookingDetailLabel}>Customer Name</Text>
                  <Text style={styles.bookingDetailValue}>
                    {selectedBooking.customerName || 'N/A'}
                  </Text>
                </View>

                {selectedBooking.status === 'ACCEPTED' && selectedBooking.customerPhone && (
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
                  <Text style={styles.bookingDetailLabel}>Service</Text>
                  <Text style={styles.bookingDetailValue}>
                    {selectedBooking.serviceTitle || 'Photography Service'}
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

              {selectedBooking.status === 'PENDING' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.acceptModalBtn}
                    onPress={() => {
                      respondBooking(selectedBooking.id, 'ACCEPTED');
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
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderRejectModal = () => (
    <Modal
      visible={rejectModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setRejectModal(false);
        setRejectionReason("");
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
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

          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle" size={32} color="#EF4444" />
            <Text style={styles.warningTitle}>Are you sure?</Text>
            <Text style={styles.warningText}>
              Rejecting bookings will affect your acceptance rate and ranking. 
              Only reject if absolutely necessary.
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
              style={[styles.modalSaveBtn, { backgroundColor: '#EF4444' }]}
              onPress={handleRejectBooking}
            >
              <Text style={styles.modalSaveText}>Confirm Rejection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOtpModal = () => (
    <Modal
      visible={otpModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setOtpModal(false);
        setOtpCode("");
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Service</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setOtpModal(false);
                setOtpCode("");
              }}
            >
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

            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={handleCompleteBooking}
            >
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

  const renderEditProfileModal = () => (
    <Modal
      visible={editProfileModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditProfileModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setEditProfileModal(false)}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Firm/Company Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your business name"
                placeholderTextColor="#94a3b8"
                value={editForm.firmName}
                onChangeText={(text) => setEditForm({...editForm, firmName: text})}
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter email"
                placeholderTextColor="#94a3b8"
                value={editForm.email}
                onChangeText={(text) => setEditForm({...editForm, email: text})}
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
                onChangeText={(text) => setEditForm({...editForm, phone: text})}
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
                onChangeText={(text) => setEditForm({...editForm, address: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalFormGroup}>
              <Text style={styles.modalLabel}>About You</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Tell customers about your photography services"
                placeholderTextColor="#94a3b8"
                value={editForm.description}
                onChangeText={(text) => setEditForm({...editForm, description: text})}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setEditProfileModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.modalSaveText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1e3c4f', '#2c5a73']}
          style={styles.loadingGradient}
        >
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
            colors={['#2c5a73']}
          />
        }
      >
        {activeTab === 'dashboard' && (
          <View style={styles.dashboardContent}>
            {renderWalletCard()}
            {renderStatusToggle()}
            {renderStatsGrid()}
            {renderQuickActions()}
            {renderRecentBookings()}
          </View>
        )}
        
        {activeTab === 'services' && renderServices()}
        {activeTab === 'gallery' && renderGallery()}
        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'earnings' && renderEarnings()}
        
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
      {renderOtpModal()}
      {renderEditProfileModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop:20,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 15,
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    padding: 8,
    marginRight: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerProfileImage: {
    width: '100%',
    height: '100%',
  },
  headerProfilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  verificationContainer: {
    marginTop: 15,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tabBarContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  activeTabItem: {
    backgroundColor: '#e6f0f5',
  },
  tabLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#2c5a73',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  dashboardContent: {
    padding: 16,
  },
  walletCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletTitle: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    opacity: 0.9,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  withdrawBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  walletAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  walletFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  walletStat: {
    flex: 1,
  },
  walletStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  walletStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  walletDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2c5a73',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c5a73',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bookingItemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  bookingStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  bookingItemContent: {
    flex: 1,
  },
  bookingServiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  bookingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingMetaText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 4,
  },
  bookingMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  bookingItemRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  bookingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  bookingStatusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  serviceItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  serviceItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  serviceItemContent: {
    flex: 1,
  },
  serviceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  serviceItemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c5a73',
  },
  serviceItemDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  serviceItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceItemStatsText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 4,
  },
  serviceItemActions: {
    flexDirection: 'row',
  },
  serviceEditBtn: {
    padding: 6,
    marginRight: 8,
  },
  serviceDeleteBtn: {
    padding: 6,
  },
  galleryItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  galleryItemImage: {
    width: '100%',
    height: '100%',
  },
  earningsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  earningsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  earningsStat: {
    flex: 1,
  },
  earningsStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  earningsStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  earningsDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#64748b',
  },
  transactionCredit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  transactionDebit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#2c5a73',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalImagePicker: {
    width: '100%',
    height: 180,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
  },
  modalPreviewImage: {
    width: '100%',
    height: '100%',
  },
  modalImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalImageText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalImageSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  modalFormGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 8,
    backgroundColor: '#2c5a73',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  selectedImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  selectedImageItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2c5a73',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addMoreText: {
    color: '#2c5a73',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadPrompt: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c5a73',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  balancePreview: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balancePreviewLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  balancePreviewAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#1e293b',
    marginLeft: 8,
    lineHeight: 18,
  },
  bookingDetailSection: {
    marginBottom: 20,
  },
  bookingDetailRow: {
    marginBottom: 16,
  },
  bookingDetailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  bookingDetailValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  acceptModalBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  acceptModalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectModalBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectModalBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  completeModalBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  completeModalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  otpContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  otpIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  otpText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
    color: '#1e293b',
  },
  verifyBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});