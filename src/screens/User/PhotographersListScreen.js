import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import DateTimePicker from "@react-native-community/datetimepicker";
import RazorpayCheckout from "react-native-razorpay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../context/AuthContext";
import { LocationContext } from "../../context/LocationContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

// ✅ Import like hook and component
import { useLikes } from '../../context/LikesContext';
import LikeButton from "../../components/LikeButton";

const BASE_URL = "https://localguider.sinfode.com";
const API_BASE = "https://localguider.sinfode.com/api";

export default function PhotographersListScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const { location } = useContext(LocationContext);
  const { type } = route.params || { type: "all" };

  // ✅ Like hook at top level
  const { isLiked, toggleLike } = useLikes();

  const [photographers, setPhotographers] = useState([]);
  const [filteredPhotographers, setFilteredPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [expandedPhotographer, setExpandedPhotographer] = useState(null);
  const [photographerServices, setPhotographerServices] = useState({});
  const [photographerGallery, setPhotographerGallery] = useState({}); // ✅ new state for gallery
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [minRating, setMinRating] = useState(0);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState("");

  // Wallet-related state
  const [userBalance, setUserBalance] = useState(0);

  // Photography specific time slots
  const timeSlots = [
    "08:00 AM - 10:00 AM",
    "10:00 AM - 12:00 PM",
    "12:00 PM - 02:00 PM",
    "02:00 PM - 04:00 PM",
    "04:00 PM - 06:00 PM",
    "06:00 PM - 08:00 PM",
    "08:00 PM - 10:00 PM",
    "10:00 PM - 12:00 AM",
  ];

  useEffect(() => {
    fetchPhotographers();
  }, [location, sortBy, minRating]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = photographers.filter(
        (p) =>
          p.firmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.placeName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPhotographers(filtered);
    } else {
      setFilteredPhotographers(photographers);
    }
  }, [searchQuery, photographers]);

  const fetchPhotographers = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.post(API.GET_PHOTOGRAPHERS_ALL, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page: pageNum,
        perPage: 10,
        sortBy: sortBy,
        minRating: minRating > 0 ? minRating : undefined,
        status: "APPROVED",
        searchText: searchQuery,
      });

      if (response.data?.status) {
        const newPhotographers = response.data.data || [];
        if (append) {
          setPhotographers(prev => [...prev, ...newPhotographers]);
        } else {
          setPhotographers(newPhotographers);
        }
        setHasMore(newPhotographers.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching photographers:", error);
      Alert.alert("Error", "Failed to load photographers");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchPhotographers(page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setPhotographerServices({});
    setPhotographerGallery({});
    fetchPhotographers(1, false);
  };

  const togglePhotographerExpand = (photographer) => {
    if (!photographer) return;
    if (expandedPhotographer === photographer.id) {
      setExpandedPhotographer(null);
    } else {
      setExpandedPhotographer(photographer.id);
      setSelectedPhotographer(photographer);
      fetchPhotographerServices(photographer.id);
      fetchPhotographerGallery(photographer.id);
    }
  };

  const fetchPhotographerServices = async (photographerId) => {
    if (photographerServices[photographerId]) return;

    try {
      const response = await api.post(API.GET_SERVICES, null, {
        params: { photographerId: photographerId }
      });

      if (response.data?.status && Array.isArray(response.data.data)) {
        const services = response.data.data.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          price: s.servicePrice,
          duration: s.duration || "2 hours",
          features: s.features || []
        }));
        setPhotographerServices(prev => ({ ...prev, [photographerId]: services }));
      } else {
        setPhotographerServices(prev => ({ ...prev, [photographerId]: [] }));
        Alert.alert("Info", "This photographer has no active packages.");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      if (error.response?.status === 401) {
        Alert.alert(
          "Authentication Required",
          "Please log in to view service packages.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Login", onPress: () => navigation.navigate("Login") }
          ]
        );
      } else {
        Alert.alert("Network Error", "Could not load services. Please check your internet connection.");
      }
      setPhotographerServices(prev => ({ ...prev, [photographerId]: [] }));
    }
  };

  // ✅ Fetch gallery images for a photographer
  const fetchPhotographerGallery = async (photographerId) => {
    if (photographerGallery[photographerId]) return;
    try {
      const params = new URLSearchParams();
      params.append("photographerId", photographerId.toString());
      params.append("page", "1");
      const response = await api.post(API.ALL_IMAGES_BY_ID, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) {
        const images = response.data.data || [];
        setPhotographerGallery(prev => ({ ...prev, [photographerId]: images }));
      } else {
        setPhotographerGallery(prev => ({ ...prev, [photographerId]: [] }));
      }
    } catch (error) {
      console.error("Error fetching photographer gallery:", error);
      setPhotographerGallery(prev => ({ ...prev, [photographerId]: [] }));
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/^\/+/, '');
    return `${BASE_URL}/api/image/download/${cleanPath}`;
  };

  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalf = (rating || 0) % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Ionicons key={i} name="star-half" size={14} color="#FFD700" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={14} color="#FFD700" />);
      }
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  const applyFilters = () => {
    setFilterModal(false);
    setPage(1);
    setPhotographers([]);
    fetchPhotographers(1, false);
  };

  const resetFilters = () => {
    setSortBy("rating");
    setMinRating(0);
    setFilterModal(false);
    setPage(1);
    setPhotographers([]);
    fetchPhotographers(1, false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  // Service item renderer (inside expanded card)
  const renderServiceItem = (service, photographer) => (
    <View key={service.id} style={styles.serviceItem}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceTitleContainer}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          {/* <View style={styles.serviceBadge}> */}
            {/* <Text style={styles.serviceDuration}></Text> */}
          {/* </View> */}
        </View>
        <Text style={styles.servicePrice}>₹{service.price}</Text>
      </View>
      <Text style={styles.serviceDescription}>{service.description}</Text>
      {service.features && service.features.length > 0 && (
        <View style={styles.serviceFeatures}>
          {service.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={styles.bookServiceBtn}
        onPress={() => handleBookNow(photographer, service)}
      >
        <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.bookServiceGradient}>
          <Text style={styles.bookServiceText}>Book This Package</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render each photographer card with LikeButton, gallery, and expandable details
  const renderPhotographerCard = ({ item }) => {
    const isExpanded = expandedPhotographer === item.id;
    const services = photographerServices[item.id] || [];
    const galleryImages = photographerGallery[item.id] || [];

    return (
      <View style={styles.photographerCard}>
        <LikeButton
          isLiked={isLiked(item.id, 'photographer')}
          onPress={() => toggleLike(item, 'photographer')}
          size={18}
          style={styles.cardLikeButton}
        />

        <TouchableOpacity onPress={() => togglePhotographerExpand(item)} activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            {item.featuredImage ? (
              <Image source={{ uri: getImageUrl(item.featuredImage) }} style={styles.photographerImage} />
            ) : (
              <View style={[styles.photographerImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>
                  {item.firmName?.charAt(0) || item.name?.charAt(0) || "P"}
                </Text>
              </View>
            )}
            <View style={styles.photographerInfo}>
              <Text style={styles.photographerName}>
                {item.firmName || item.name || "Photographer"}
              </Text>
              <View style={styles.ratingContainer}>
                {renderRating(item.rating)}
                <Text style={styles.ratingText}>({item.rating?.toFixed(1) || "0.0"})</Text>
              </View>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.placeName || "Local Photographer"}
                </Text>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="camera-outline" size={14} color="#64748b" />
                  <Text style={styles.statText}>{item.totalBookings || 0} shoots</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <Text style={styles.statText}>Available today</Text>
                </View>
              </View>
            </View>
            <View style={styles.expandIcon}>
              <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#2c5a73" />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.description && (
              <View style={styles.aboutSection}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>{item.description}</Text>
              </View>
            )}
            <View style={styles.languagesSection}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.languagesList}>
                {item.languages && item.languages.length > 0 ? (
                  item.languages.map((lang, idx) => (
                    <View key={idx} style={styles.languageTag}>
                      <Text style={styles.languageText}>{lang}</Text>
                    </View>
                  ))
                ) : (
                  <>
                    <View style={styles.languageTag}><Text style={styles.languageText}>Hindi</Text></View>
                    <View style={styles.languageTag}><Text style={styles.languageText}>English</Text></View>
                  </>
                )}
              </View>
            </View>
            <View style={styles.expertiseSection}>
              <Text style={styles.sectionTitle}>Experience & Expertise</Text>
              <View style={styles.experienceRow}>
                <Ionicons name="briefcase-outline" size={16} color="#2c5a73" />
                <Text style={styles.experienceText}>{item.experience || "5+"} years experience</Text>
              </View>
              <View style={styles.expertiseTags}>
                {item.expertise ? (
                  item.expertise.split(',').map((exp, idx) => (
                    <View key={idx} style={styles.expertiseTag}>
                      <Text style={styles.expertiseText}>{exp.trim()}</Text>
                    </View>
                  ))
                ) : (
                  <>
                    <View style={styles.expertiseTag}><Text style={styles.expertiseText}>Wedding</Text></View>
                    <View style={styles.expertiseTag}><Text style={styles.expertiseText}>Portrait</Text></View>
                    <View style={styles.expertiseTag}><Text style={styles.expertiseText}>Event</Text></View>
                  </>
                )}
              </View>
            </View>

            {/* ✅ Gallery Section (just like guider) */}
            {galleryImages.length > 0 && (
              <View style={styles.gallerySection}>
                <Text style={styles.sectionTitle}>Photo Gallery</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  {galleryImages.map((img, idx) => (
                    <TouchableOpacity
                      key={img.id || idx}
                      onPress={() => openFullImage(getImageUrl(img.image))}
                    >
                      <Image
                        source={{ uri: getImageUrl(img.image) }}
                        style={styles.galleryImage}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Photography Packages</Text>
              {services.length > 0 ? (
                <View style={styles.servicesList}>
                  {services.map(service => renderServiceItem(service, item))}
                </View>
              ) : (
                <View style={styles.loadingServices}>
                  <Text style={styles.noServicesText}>No packages available for this photographer.</Text>
                </View>
              )}
            </View>
            {item.reviewCount > 0 && (
              <TouchableOpacity
                style={styles.reviewsLink}
                onPress={() => navigation.navigate("PhotographerReviews", { photographerId: item.id })}
              >
                <Text style={styles.reviewsLinkText}>View {item.reviewCount} reviews →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // ----- Full‑screen image viewer (shared with guider) -----
  const openFullImage = (url) => {
    setFullImageUrl(url);
    setFullImageVisible(true);
  };

  const renderFullImageModal = () => (
    <Modal
      visible={fullImageVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setFullImageVisible(false)}
    >
      <View style={styles.fullImageContainer}>
        <TouchableOpacity
          style={styles.fullImageCloseBtn}
          onPress={() => setFullImageVisible(false)}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: fullImageUrl }}
          style={styles.fullImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );

  // ----- Wallet & Payment Functions (identical to GuiderListScreen) -----
  const fetchUserBalance = async () => {
    if (!user) return;
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      if (!token || !userId) return;

      const formData = new FormData();
      formData.append("userId", userId);

      const response = await fetch(`${API_BASE}/user/get_profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await response.json();
      if (json?.status && json?.data) {
        setUserBalance(json.data.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const performBooking = async () => {
    try {
      setBookingLoading(true);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const formattedDateTime = `${year}-${month}-${day} ${timeSlot}`;
      const price = parseFloat(selectedService.price) || 0;

      const bookingPayload = {
        userId: user.id,
        photographerId: selectedPhotographer.id,
        serviceId: selectedService.id,
        dateTime: formattedDateTime,
        appointmentCharge: 0,
        serviceCost: price,
        totalPayment: price,
        transactionId: `txn_${Date.now()}`,
        note: notes || "",
      };

      const response = await api.post(API.CREATE_APPOINTMENT, bookingPayload);
      if (response.data?.status) {
        Alert.alert(
          "Success",
          "Booking request sent successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                setBookingModal(false);
                setSelectedService(null);
                setTimeSlot("");
                setNotes("");
                setSelectedPhotographer(null);
                navigation.navigate("MyBookings");
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", response.data?.message || "Booking failed");
      }
    } catch (error) {
      console.log("❌ Booking error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayWithWallet = async () => {
    const total = parseFloat(selectedService.price) || 0;
    if (userBalance < total) {
      Alert.alert("Insufficient Balance", "Please use Razorpay to pay directly.");
      return;
    }
    await performBooking();
    fetchUserBalance();
  };

  const handleRazorpayForBooking = async () => {
    if (!selectedService || !timeSlot) {
      Alert.alert("Error", "Please select a service and time slot");
      return;
    }

    const amount = parseFloat(selectedService.price) || 0;
    if (amount <= 0) {
      Alert.alert("Error", "Invalid service amount");
      return;
    }

    try {
      setBookingLoading(true);

      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      if (!token || !userId) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      const keyRes = await fetch(`${API_BASE}/settings/get`, { method: "POST" });
      const keyJson = await keyRes.json();
      if (!keyJson?.data?.razorpayAPIKey) throw new Error("Failed to fetch Razorpay key");
      const razorpayKey = keyJson.data.razorpayAPIKey;

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("amount", amount.toString());

      const transRes = await fetch(`${API_BASE}/transaction/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const transJson = await transRes.json();
      if (!transJson.data) throw new Error("Transaction creation failed");
      const orderId = transJson.data.paymentToken;

      const options = {
        description: `Booking: ${selectedService.title}`,
        currency: "INR",
        key: razorpayKey,
        amount: amount * 100,
        name: "Local Guider",
        order_id: orderId,
        method: { card: true, upi: true, netbanking: true, wallet: true },
        prefill: { contact: user?.phone || "9999999999" },
        theme: { color: "#3399cc" },
      };

      await RazorpayCheckout.open(options);
      console.log("Payment success");

      const updateForm = new FormData();
      updateForm.append("paymentToken", orderId);
      updateForm.append("paymentStatus", "success");

      await fetch(`${API_BASE}/transaction/update`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: updateForm,
      });

      Alert.alert("Success", "Payment successful! Now confirming your booking...");
      await fetchUserBalance();
      await performBooking();
    } catch (error) {
      console.log("Payment error", error);
      Alert.alert("Payment Failed", error.message || "Could not complete payment");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookNow = (photographer, service) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedPhotographer(photographer);
    setSelectedService(service);
    setBookingModal(true);
    fetchUserBalance();
  };

  // ----- Modal Rendering Functions (same as before, no changes) -----
  const renderFilterModal = () => (
    <Modal visible={filterModal} transparent animationType="slide" onRequestClose={() => setFilterModal(false)}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Photographers</Text>
            <TouchableOpacity onPress={() => setFilterModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { label: "Rating", value: "rating" },
                { label: "Experience", value: "experience" },
                { label: "Price: Low to High", value: "price_asc" },
                { label: "Price: High to Low", value: "price_desc" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.sortOption, sortBy === option.value && styles.sortOptionSelected]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Text style={[styles.sortOptionText, sortBy === option.value && styles.sortOptionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Minimum Rating</Text>
            <View style={styles.ratingOptions}>
              {[4, 3, 2, 1].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[styles.ratingOption, minRating === rating && styles.ratingOptionSelected]}
                  onPress={() => setMinRating(minRating === rating ? 0 : rating)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={[styles.ratingOptionText, minRating === rating && styles.ratingOptionTextSelected]}>
                      {rating}+
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.applyGradient}>
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderBookingModal = () => (
    <Modal
      visible={bookingModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setBookingModal(false);
        setSelectedService(null);
        setTimeSlot("");
        setNotes("");
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.bookingModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            <TouchableOpacity
              onPress={() => {
                setBookingModal(false);
                setSelectedService(null);
                setTimeSlot("");
                setNotes("");
              }}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedPhotographer && selectedService && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.selectedPhotographerInfo}>
                {selectedPhotographer.featuredImage ? (
                  <Image source={{ uri: getImageUrl(selectedPhotographer.featuredImage) }} style={styles.selectedPhotographerImage} />
                ) : (
                  <View style={[styles.selectedPhotographerImage, styles.imagePlaceholder]}>
                    <Text style={styles.placeholderText}>
                      {selectedPhotographer.firmName?.charAt(0) || selectedPhotographer.name?.charAt(0) || "P"}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.selectedPhotographerName}>
                    {selectedPhotographer.firmName || selectedPhotographer.name || "Photographer"}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {renderRating(selectedPhotographer.rating)}
                    <Text style={styles.ratingText}>({selectedPhotographer.rating?.toFixed(1) || "0.0"})</Text>
                  </View>
                </View>
              </View>

              <View style={styles.selectedServiceSummary}>
                <Text style={styles.summaryTitle}>Selected Package</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryServiceName}>{selectedService.title}</Text>
                  <Text style={styles.summaryServicePrice}>₹{selectedService.price}</Text>
                  <Text style={styles.summaryServiceDuration}>{selectedService.duration || "2 hours"}</Text>
                </View>
              </View>

              <Text style={styles.sectionSubtitle}>Select Date</Text>
              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#2c5a73" />
                <Text style={styles.dateText}>
                  {date.toLocaleDateString("en-IN", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.sectionSubtitle}>Select Time Slot</Text>
              <View style={styles.timeSlotsGrid}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timeSlot, timeSlot === slot && styles.timeSlotSelected]}
                    onPress={() => setTimeSlot(slot)}
                  >
                    <Text style={[styles.timeSlotText, timeSlot === slot && styles.timeSlotTextSelected]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionSubtitle}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Any special requirements or preferences?"
                placeholderTextColor="#94a3b8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.priceSummary}>
                <Text style={styles.priceSummaryTitle}>Price Summary</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Service Charge</Text>
                  <Text style={styles.priceValue}>₹{(parseFloat(selectedService.price) || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{(parseFloat(selectedService.price) || 0).toFixed(2)}</Text>
                </View>
              </View>

              {/* Payment Options */}
              <View style={styles.paymentOptions}>
                {userBalance >= (parseFloat(selectedService.price) || 0) ? (
                  <TouchableOpacity
                    style={[styles.payButton, styles.walletButton]}
                    onPress={handlePayWithWallet}
                    disabled={bookingLoading}
                  >
                    <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.payButtonGradient}>
                      {bookingLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.payButtonText}>
                          Pay via Wallet (₹{(parseFloat(selectedService.price) || 0).toFixed(2)})
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.insufficientWallet}>
                    <Text style={styles.insufficientText}>Insufficient wallet balance</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.payButton, styles.razorpayButton]}
                  onPress={handleRazorpayForBooking}
                  disabled={bookingLoading}
                >
                  <LinearGradient colors={["#ff6b6b", "#ee5253"]} style={styles.payButtonGradient}>
                    {bookingLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.payButtonText}>
                        Pay via Razorpay (₹{(parseFloat(selectedService.price) || 0).toFixed(2)})
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setBookingModal(false);
                    setSelectedService(null);
                    setTimeSlot("");
                    setNotes("");
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderLoginPromptModal = () => (
    <Modal visible={showLoginPrompt} transparent animationType="fade" onRequestClose={() => setShowLoginPrompt(false)}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.promptContent}>
          <Ionicons name="log-in-outline" size={50} color="#2c5a73" />
          <Text style={styles.promptTitle}>Login Required</Text>
          <Text style={styles.promptText}>Please login or create an account to book a photographer.</Text>
          <View style={styles.promptButtons}>
            <TouchableOpacity style={styles.promptCancelBtn} onPress={() => setShowLoginPrompt(false)}>
              <Text style={styles.promptCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.promptLoginBtn}
              onPress={() => {
                setShowLoginPrompt(false);
                navigation.navigate("Login");
              }}
            >
              <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.promptLoginGradient}>
                <Text style={styles.promptLoginText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ----- Main Render -----
  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1e3c4f", "#2c5a73", "#3b7a8f"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Photographers</Text>
          <TouchableOpacity onPress={() => setFilterModal(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search photographers by name or location..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.loadingText}>Finding best photographers for you...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPhotographers}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderPhotographerCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2c5a73"]} tintColor="#2c5a73" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#2c5a73" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="camera-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Photographers Found</Text>
              <Text style={styles.emptyText}>Try adjusting your filters or search query</Text>
              <TouchableOpacity style={styles.resetFiltersBtn} onPress={resetFilters}>
                <Text style={styles.resetFiltersText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {renderFilterModal()}
      {renderBookingModal()}
      {renderLoginPromptModal()}
      {renderFullImageModal()}
    </View>
  );
}

// Styles – add gallery and full‑image styles (copy from GuiderListScreen)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingTop: 46, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  filterBtn: { padding: 4 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#1e293b", padding: 0 },
  listContent: { padding: 16, paddingTop: 8 },
  photographerCard: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, overflow: "hidden", position: "relative" },
  cardHeader: { flexDirection: "row", padding: 16 },
  photographerImage: { width: 70, height: 70, borderRadius: 35, marginRight: 12 },
  imagePlaceholder: { backgroundColor: "#2c5a73", justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  photographerInfo: { flex: 1 },
  photographerName: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  ratingContainer: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  ratingText: { fontSize: 12, color: "#64748b", marginLeft: 4 },
  locationContainer: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  locationText: { fontSize: 12, color: "#64748b", marginLeft: 4 },
  statsContainer: { flexDirection: "row" },
  statItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  statText: { fontSize: 11, color: "#64748b", marginLeft: 4 },
  expandIcon: { justifyContent: "center", marginLeft: 8 },
  expandedContent: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 8, marginTop: 4 },
  aboutSection: { marginBottom: 12 },
  aboutText: { fontSize: 13, color: "#475569", lineHeight: 18 },
  languagesSection: { marginBottom: 12 },
  languagesList: { flexDirection: "row", flexWrap: "wrap" },
  languageTag: { backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginBottom: 4 },
  languageText: { fontSize: 11, color: "#1e293b", fontWeight: "500" },
  expertiseSection: { marginBottom: 12 },
  experienceRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  experienceText: { fontSize: 13, color: "#475569", marginLeft: 6 },
  expertiseTags: { flexDirection: "row", flexWrap: "wrap" },
  expertiseTag: { backgroundColor: "#dbeafe", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginBottom: 4 },
  expertiseText: { fontSize: 11, color: "#1e40af", fontWeight: "500" },
  gallerySection: { marginBottom: 12 },
  galleryScroll: { paddingVertical: 4 },
  galleryImage: { width: 80, height: 80, borderRadius: 8, marginRight: 8, backgroundColor: "#e2e8f0" },
  servicesSection: { marginBottom: 12 },
  servicesList: { marginTop: 8 },
  serviceItem: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  serviceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  serviceTitleContainer: { flex: 1, flexDirection: "row", alignItems: "center" },
  serviceTitle: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  serviceBadge: { backgroundColor: "#e2e8f0", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  serviceDuration: { fontSize: 10, color: "#475569", fontWeight: "500" },
  servicePrice: { fontSize: 16, fontWeight: "700", color: "#2c5a73" },
  serviceDescription: { fontSize: 12, color: "#64748b", marginBottom: 8, lineHeight: 16 },
  serviceFeatures: { marginBottom: 10 },
  featureItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  featureText: { fontSize: 11, color: "#475569", marginLeft: 6 },
  bookServiceBtn: { borderRadius: 8, overflow: "hidden", marginTop: 4 },
  bookServiceGradient: { paddingVertical: 8, alignItems: "center" },
  bookServiceText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  loadingServices: { padding: 12, alignItems: "center" },
  noServicesText: { fontSize: 12, color: "#64748b", fontStyle: "italic" },
  reviewsLink: { marginTop: 8, alignItems: "center" },
  reviewsLinkText: { fontSize: 12, color: "#2c5a73", fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },
  footerLoader: { paddingVertical: 20, alignItems: "center" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#1e293b", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 },
  resetFiltersBtn: { backgroundColor: "#2c5a73", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  resetFiltersText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%" },
  bookingModalContent: { maxHeight: "95%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  filterLabel: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginTop: 16, marginBottom: 12 },
  sortOptions: { flexDirection: "row", flexWrap: "wrap" },
  sortOption: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f1f5f9", borderRadius: 20, marginRight: 8, marginBottom: 8 },
  sortOptionSelected: { backgroundColor: "#2c5a73" },
  sortOptionText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  sortOptionTextSelected: { color: "#fff" },
  ratingOptions: { flexDirection: "row", marginBottom: 20 },
  ratingOption: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#f1f5f9", borderRadius: 20, marginRight: 8 },
  ratingOptionSelected: { backgroundColor: "#2c5a73" },
  ratingOptionText: { fontSize: 13, color: "#64748b", marginLeft: 4, fontWeight: "500" },
  ratingOptionTextSelected: { color: "#fff" },
  filterActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 20 },
  resetBtn: { flex: 1, paddingVertical: 14, marginRight: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, alignItems: "center" },
  resetBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  applyBtn: { flex: 1, marginLeft: 8, borderRadius: 12, overflow: "hidden" },
  applyGradient: { paddingVertical: 14, alignItems: "center" },
  applyBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  selectedPhotographerInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", padding: 12, borderRadius: 12, marginBottom: 20 },
  selectedPhotographerImage: { width: 50, height: 50, borderRadius: 25 },
  selectedPhotographerName: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
  selectedServiceSummary: { backgroundColor: "#dbeafe", padding: 12, borderRadius: 12, marginBottom: 16 },
  summaryTitle: { fontSize: 12, color: "#1e40af", marginBottom: 4 },
  summaryContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryServiceName: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  summaryServicePrice: { fontSize: 16, fontWeight: "700", color: "#2c5a73" },
  summaryServiceDuration: { fontSize: 11, color: "#64748b" },
  sectionSubtitle: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 12, marginTop: 8 },
  dateSelector: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 14, marginBottom: 16 },
  dateText: { flex: 1, fontSize: 14, color: "#1e293b", marginLeft: 10 },
  timeSlotsGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  timeSlot: { width: "48%", marginHorizontal: "1%", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 12, marginBottom: 8, alignItems: "center" },
  timeSlotSelected: { backgroundColor: "#2c5a73", borderColor: "#2c5a73" },
  timeSlotText: { fontSize: 12, color: "#64748b" },
  timeSlotTextSelected: { color: "#fff" },
  notesInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 14, fontSize: 14, color: "#1e293b", minHeight: 80, textAlignVertical: "top", marginBottom: 16 },
  priceSummary: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20 },
  priceSummaryTitle: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 12 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  priceLabel: { fontSize: 13, color: "#64748b" },
  priceValue: { fontSize: 13, color: "#1e293b", fontWeight: "500" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  totalLabel: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#2c5a73" },
  paymentOptions: { marginVertical: 16 },
  payButton: { borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  payButtonGradient: { paddingVertical: 14, alignItems: "center" },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  insufficientWallet: { backgroundColor: "#fee2e2", padding: 12, borderRadius: 12, marginBottom: 12, alignItems: "center" },
  insufficientText: { color: "#b91c1c", fontSize: 14 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  buttonDisabled: { opacity: 0.7 },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 14, fontSize: 14, color: "#1e293b" },
  promptContent: { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center", marginHorizontal: 20 },
  promptTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b", marginTop: 16, marginBottom: 8 },
  promptText: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 },
  promptButtons: { flexDirection: "row", gap: 12 },
  promptCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  promptCancelText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  promptLoginBtn: { flex: 1, borderRadius: 8, overflow: "hidden" },
  promptLoginGradient: { paddingVertical: 12, alignItems: "center" },
  promptLoginText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  cardLikeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 6,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});