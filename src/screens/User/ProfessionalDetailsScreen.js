import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import DateTimePicker from "@react-native-community/datetimepicker";
import RazorpayCheckout from "react-native-razorpay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

const BASE_URL = "https://localguider.sinfode.com";
const API_BASE = "https://localguider.sinfode.com/api";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const filename = path.split("/").pop();
    return `${BASE_URL}/api/image/download/${filename}`;
  } catch {
    return null;
  }
};

const RatingStars = ({ rating, size = 14 }) => {
  const stars = [];
  const fullStars = Math.floor(rating || 0);
  const hasHalf = (rating || 0) % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Ionicons key={i} name="star" size={size} color="#FFD700" />);
    } else if (i === fullStars && hasHalf) {
      stars.push(<Ionicons key={i} name="star-half" size={size} color="#FFD700" />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={size} color="#FFD700" />);
    }
  }
  return <View style={styles.ratingStars}>{stars}</View>;
};

export default function ProfessionalDetailsScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const { professionalId, professionalType } = route.params; // 'guider' or 'photographer'

  const [professional, setProfessional] = useState(null);
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]); // New: gallery images
  const [loading, setLoading] = useState(true);
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState("");

  // Booking modal state
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  ];

  useEffect(() => {
    fetchProfessionalDetails();
    fetchServices();
    fetchGallery(); // New: fetch gallery
    if (user) fetchUserBalance();
  }, []);

  const fetchProfessionalDetails = async () => {
    try {
      const endpoint = professionalType === 'guider'
        ? API.GET_GUIDERS_DETAILS
        : API.GET_PHOTOGRAPHERS_DETAILS;
      const paramName = professionalType === 'guider' ? 'guiderId' : 'photographerId';
      const response = await api.post(endpoint, null, {
        params: { [paramName]: professionalId }
      });
      if (response.data?.status) {
        setProfessional(response.data.data);
      } else {
        Alert.alert("Error", response.data?.message || "Failed to load details");
      }
    } catch (error) {
      console.error("Error fetching professional:", error);
      Alert.alert("Error", "Failed to load professional details");
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.post(API.GET_SERVICES, null, {
        params: { [professionalType === 'guider' ? 'guiderId' : 'photographerId']: professionalId }
      });
      if (response.data?.status && Array.isArray(response.data.data)) {
        const servicesData = response.data.data.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description,
          price: s.servicePrice,
          duration: s.duration || "2 hours",
        }));
        setServices(servicesData);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    }
  };

  // New: fetch gallery images for this professional
  const fetchGallery = async () => {
    try {
      const params = new URLSearchParams();
      params.append(professionalType === 'guider' ? "guiderId" : "photographerId", professionalId.toString());
      params.append("page", "1");
      const response = await api.post(API.ALL_IMAGES_BY_ID, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) {
        setGallery(response.data.data || []);
      } else {
        setGallery([]);
      }
    } catch (error) {
      console.error("Error fetching gallery:", error);
      setGallery([]);
    } finally {
      setLoading(false);
    }
  };

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

  // ---------- Booking functions ----------
  const performBooking = async () => {
  try {
    setBookingLoading(true);

    // ✅ पक्का करें कि userId सही मिल रही है
    const currentUserId = user?.userId || user?.id; 

    if (!currentUserId) {
      Alert.alert("Error", "User session not found. Please login again.");
      return;
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const formattedDateTime = `${year}-${month}-${day} ${timeSlot}`;
    const price = parseFloat(selectedService.price) || 0;

    const bookingPayload = {
      // ✅ यहाँ सुधार किया गया है
      userId: currentUserId, 
      [professionalType === 'guider' ? 'guiderId' : 'photographerId']: professionalId,
      serviceId: selectedService.id,
      dateTime: formattedDateTime,
      appointmentCharge: 0,
      serviceCost: price,
      totalPayment: price,
      transactionId: `txn_${Date.now()}`,
      note: notes || "",
    };

    console.log("Booking Payload:", bookingPayload); // Debug के लिए

    const response = await api.post(API.CREATE_APPOINTMENT, bookingPayload);
    
    if (response.data?.status) {
      Alert.alert("Success", "Booking request sent successfully!");
      setBookingModal(false);
      navigation.navigate("MyBookings");
    } else {
      // अगर अब भी User not found आता है, तो इसका मतलब API 'userId' की जगह 'id' मांग रही है
      Alert.alert("Error", response.data?.message || "Booking failed");
    }
  } catch (error) {
    console.log("Booking error:", error.response?.data || error.message);
    Alert.alert("Error", "Something went wrong while booking");
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
    fetchUserBalance(); // refresh balance
  };

  const handleRazorpayForBooking = async () => {
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
        theme: { color: "#2c5a73" },
      };

      const data = await RazorpayCheckout.open(options);
      console.log("Payment success", data);

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

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleServiceSelect = (service) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedService(service);
    setBookingModal(true);
    fetchUserBalance();
  };

  const openFullImage = (url) => {
    setFullImageUrl(url);
    setFullImageVisible(true);
  };

  const renderServiceItem = (service) => (
    <View key={service.id} style={styles.serviceItem}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceTitleContainer}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceDuration}>{service.duration}</Text>
          </View>
        </View>
        <Text style={styles.servicePrice}>₹{service.price}</Text>
      </View>
      <Text style={styles.serviceDescription}>{service.description}</Text>
      <TouchableOpacity
        style={styles.bookServiceBtn}
        onPress={() => handleServiceSelect(service)}
      >
        <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.bookServiceGradient}>
          <Text style={styles.bookServiceText}>Book This Package</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ---------- Modals ----------
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

          {professional && selectedService && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Professional summary */}
              <View style={styles.selectedProfessionalInfo}>
                {professional.photograph || professional.featuredImage ? (
                  <Image
                    source={{ uri: getImageUrl(professional.photograph || professional.featuredImage) }}
                    style={styles.selectedProfessionalImage}
                  />
                ) : (
                  <LinearGradient
                    colors={professionalType === 'guider' ? ['#3B82F6', '#1E40AF'] : ['#8B5CF6', '#6D28D9']}
                    style={styles.selectedProfessionalImagePlaceholder}
                  >
                    <Text style={styles.selectedProfessionalInitial}>
                      {(professional.firmName || professional.name || "P").charAt(0)}
                    </Text>
                  </LinearGradient>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.selectedProfessionalName}>
                    {professional.firmName || professional.name || "Professional"}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <RatingStars rating={professional.rating} size={12} />
                    <Text style={styles.ratingText}>({professional.rating?.toFixed(1) || "0.0"})</Text>
                  </View>
                </View>
              </View>

              {/* Selected service summary */}
              <View style={styles.selectedServiceSummary}>
                <Text style={styles.summaryTitle}>Selected Package</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryServiceName}>{selectedService.title}</Text>
                  <Text style={styles.summaryServicePrice}>₹{selectedService.price}</Text>
                  <Text style={styles.summaryServiceDuration}>{selectedService.duration}</Text>
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
                placeholder="Any special requests or requirements?"
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
                  <Text style={styles.priceValue}>
                    ₹{(parseFloat(selectedService.price) || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>
                    ₹{(parseFloat(selectedService.price) || 0).toFixed(2)}
                  </Text>
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
    <Modal
      visible={showLoginPrompt}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLoginPrompt(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.promptContent}>
          <Ionicons name="log-in-outline" size={50} color="#2c5a73" />
          <Text style={styles.promptTitle}>Login Required</Text>
          <Text style={styles.promptText}>
            Please login or create an account to book this service.
          </Text>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5a73" />
      </View>
    );
  }

  if (!professional) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Professional not found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = professional.firmName || professional.name || "Professional";
  const location = professional.city || professional.state || professional.placeName || "Location not specified";

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {professionalType === 'guider' ? "Tour Guide" : "Photographer"}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Professional info card */}
        <View style={styles.professionalCard}>
          <View style={styles.professionalHeader}>
            {professional.photograph || professional.featuredImage ? (
              <Image
                source={{ uri: getImageUrl(professional.photograph || professional.featuredImage) }}
                style={styles.professionalImage}
              />
            ) : (
              <LinearGradient
                colors={professionalType === 'guider' ? ['#3B82F6', '#1E40AF'] : ['#8B5CF6', '#6D28D9']}
                style={styles.professionalImagePlaceholder}
              >
                <Text style={styles.professionalInitial}>{name.charAt(0)}</Text>
              </LinearGradient>
            )}
            <View style={styles.professionalInfo}>
              <Text style={styles.professionalName}>{name}</Text>
              <View style={styles.professionalLocation}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.professionalLocationText}>{location}</Text>
              </View>
              <View style={styles.professionalRating}>
                <RatingStars rating={professional.rating} size={14} />
                <Text style={styles.professionalRatingText}>({professional.rating?.toFixed(1) || '0.0'})</Text>
              </View>
              {professional.experience && (
                <Text style={styles.professionalExperience}>Experience: {professional.experience} years</Text>
              )}
            </View>
          </View>
          {professional.description && (
            <Text style={styles.professionalDescription}>{professional.description}</Text>
          )}
        </View>

        {/* New: Gallery Section */}
        {gallery.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.galleryTitle}>Photo Gallery</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {gallery.map((img, idx) => (
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

        {/* Services */}
        <View style={styles.servicesContainer}>
          <Text style={styles.servicesTitle}>Available Packages</Text>
          {services.length > 0 ? (
            services.map(service => renderServiceItem(service))
          ) : (
            <Text style={styles.noServices}>No packages available.</Text>
          )}
        </View>
      </ScrollView>

      {renderBookingModal()}
      {renderLoginPromptModal()}
      {renderFullImageModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 18, color: "#ef4444", marginTop: 12, marginBottom: 20 },
  errorButton: { backgroundColor: "#2c5a73", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  errorButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 46,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", color: "#fff", textAlign: "center" },

  professionalCard: { backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 16, elevation: 2 },
  professionalHeader: { flexDirection: "row", marginBottom: 12 },
  professionalImage: { width: 80, height: 80, borderRadius: 40, marginRight: 16 },
  professionalImagePlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginRight: 16 },
  professionalInitial: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  professionalInfo: { flex: 1 },
  professionalName: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  professionalLocation: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  professionalLocationText: { fontSize: 13, color: "#64748b", marginLeft: 4 },
  professionalRating: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  professionalRatingText: { fontSize: 13, color: "#64748b", marginLeft: 4 },
  professionalExperience: { fontSize: 13, color: "#475569", marginTop: 2 },
  professionalDescription: { fontSize: 14, color: "#475569", lineHeight: 20 },

  // Gallery styles
  gallerySection: { marginHorizontal: 16, marginBottom: 16 },
  galleryTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 8 },
  galleryScroll: { paddingVertical: 4 },
  galleryImage: { width: 100, height: 100, borderRadius: 8, marginRight: 8, backgroundColor: "#e2e8f0" },

  servicesContainer: { marginHorizontal: 16, marginBottom: 20 },
  servicesTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 12 },
  serviceItem: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  serviceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  serviceTitleContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  serviceTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  serviceBadge: { backgroundColor: "#e2e8f0", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  serviceDuration: { fontSize: 11, color: "#475569" },
  servicePrice: { fontSize: 18, fontWeight: "700", color: "#2c5a73" },
  serviceDescription: { fontSize: 13, color: "#64748b", marginBottom: 8, lineHeight: 18 },
  bookServiceBtn: { borderRadius: 8, overflow: "hidden", marginTop: 4 },
  bookServiceGradient: { paddingVertical: 8, alignItems: "center" },
  bookServiceText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  noServices: { color: "#94a3b8", textAlign: "center", marginVertical: 20 },

  ratingStars: { flexDirection: "row", gap: 2 },

  // Booking Modal styles
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%" },
  bookingModalContent: { maxHeight: "95%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  selectedProfessionalInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", padding: 12, borderRadius: 12, marginBottom: 20 },
  selectedProfessionalImage: { width: 50, height: 50, borderRadius: 25 },
  selectedProfessionalImagePlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  selectedProfessionalInitial: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  selectedProfessionalName: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
  ratingContainer: { flexDirection: "row", alignItems: "center" },
  ratingText: { fontSize: 12, color: "#64748b", marginLeft: 4 },
  selectedServiceSummary: { backgroundColor: "#dbeafe", padding: 12, borderRadius: 12, marginBottom: 16 },
  summaryTitle: { fontSize: 12, color: "#1e40af", marginBottom: 4 },
  summaryContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryServiceName: { fontSize: 14, fontWeight: "600", color: "#1e293b", flex: 1 },
  summaryServicePrice: { fontSize: 16, fontWeight: "700", color: "#2c5a73", marginHorizontal: 8 },
  summaryServiceDuration: { fontSize: 11, color: "#64748b" },
  sectionSubtitle: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 12, marginTop: 8 },
  dateSelector: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 14, marginBottom: 16 },
  dateText: { flex: 1, fontSize: 14, color: "#1e293b", marginLeft: 10 },
  timeSlotsGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  timeSlot: { width: "48%", marginHorizontal: "1%", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 12, marginBottom: 8, alignItems: "center" },
  timeSlotSelected: { backgroundColor: "#2c5a73", borderColor: "#2c5a73" },
  timeSlotText: { fontSize: 13, color: "#64748b" },
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
  walletButton: {},
  razorpayButton: {},
  insufficientWallet: { backgroundColor: "#fee2e2", padding: 12, borderRadius: 12, marginBottom: 12, alignItems: "center" },
  insufficientText: { color: "#b91c1c", fontSize: 14 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },

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

  // Full image modal styles
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