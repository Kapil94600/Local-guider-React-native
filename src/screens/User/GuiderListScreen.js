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
import { AuthContext } from "../../context/AuthContext";
import { LocationContext } from "../../context/LocationContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";
import { BlurView } from "expo-blur";
import DateTimePicker from "@react-native-community/datetimepicker";

const BASE_URL = "https://localguider.sinfode.com";

export default function GuiderListScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const { location } = useContext(LocationContext);
  const { type } = route.params || { type: "all" };

  const [guiders, setGuiders] = useState([]);
  const [filteredGuiders, setFilteredGuiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuider, setSelectedGuider] = useState(null);
  const [expandedGuider, setExpandedGuider] = useState(null);
  const [guiderServices, setGuiderServices] = useState({});
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

  useEffect(() => {
    fetchGuiders();
  }, [location, sortBy, minRating]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = guiders.filter(
        (guider) =>
          (guider.firmName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (guider.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
          (guider.placeName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
      );
      setFilteredGuiders(filtered);
    } else {
      setFilteredGuiders(guiders);
    }
  }, [searchQuery, guiders]);

  const fetchGuiders = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.post(API.GET_GUIDERS_ALL, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page: pageNum,
        perPage: 10,
        sortBy: sortBy,
        minRating: minRating > 0 ? minRating : undefined,
        status: "APPROVED",
        admin: false,
      });

      console.log("📥 Guiders API Response:", response.data);

      if (response.data?.status) {
        const newGuiders = response.data.data || [];
        
        if (append) {
          setGuiders(prev => [...prev, ...newGuiders]);
        } else {
          setGuiders(newGuiders);
        }
        
        setHasMore(newGuiders.length === 10);
        setPage(pageNum);
      } else {
        setGuiders([]);
      }
    } catch (error) {
      console.error("Error fetching guiders:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load guiders");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const fetchGuiderServices = async (guiderId) => {
    if (guiderServices[guiderId]) return; // Already loaded
    
    try {
      console.log(`📡 Fetching services for guider ID: ${guiderId}`);
      const response = await api.post(API.GET_SERVICES, {
        guiderId: guiderId,
        status: "ACTIVE"
      });
      
      console.log("📦 Services response:", response.data);
      
      if (response.data?.status) {
        const services = response.data.data || [];
        setGuiderServices(prev => ({
          ...prev,
          [guiderId]: services
        }));
      } else {
        // Set default services if API fails
        setGuiderServices(prev => ({
          ...prev,
          [guiderId]: [
            {
              id: `basic_${guiderId}`,
              title: "Basic Tour Package",
              description: "Standard guided tour of local attractions",
              price: "500",
              duration: "2 hours",
              features: ["Local attractions", "Photo stops", "Basic information"]
            },
            {
              id: `premium_${guiderId}`,
              title: "Premium Tour Package",
              description: "Extended tour with personalized experience",
              price: "1000",
              duration: "4 hours",
              features: ["All basic features", "Local food tasting", "Hidden gems"]
            }
          ]
        }));
      }
    } catch (error) {
      console.error("Error fetching guider services:", error);
      // Set default services if API fails
      setGuiderServices(prev => ({
        ...prev,
        [guiderId]: [
          {
            id: `basic_${guiderId}`,
            title: "Basic Tour Package",
            description: "Standard guided tour of local attractions",
            price: "500",
            duration: "2 hours",
            features: ["Local attractions", "Photo stops", "Basic information"]
          },
          {
            id: `premium_${guiderId}`,
            title: "Premium Tour Package",
            description: "Extended tour with personalized experience",
            price: "1000",
            duration: "4 hours",
            features: ["All basic features", "Local food tasting", "Hidden gems"]
          }
        ]
      }));
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchGuiders(page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setGuiderServices({}); // Clear cached services
    fetchGuiders(1, false);
  };

  const toggleGuiderExpand = (guider) => {
    if (!guider) return;
    
    if (expandedGuider === guider.id) {
      setExpandedGuider(null);
    } else {
      setExpandedGuider(guider.id);
      setSelectedGuider(guider);
      fetchGuiderServices(guider.id);
    }
  };

  const handleBookNow = (guider, service) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedGuider(guider);
    setSelectedService(service);
    setBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService) {
      Alert.alert("Error", "Please select a service package");
      return;
    }

    if (!timeSlot) {
      Alert.alert("Error", "Please select a time slot");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Please login to book");
      navigation.navigate("Login");
      return;
    }

    try {
      setBookingLoading(true);

      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const formattedDateTime = `${year}-${month}-${day} ${timeSlot}`;

      const price = parseFloat(selectedService.price) || 0;

      const bookingPayload = {
        userId: user.id,
        guiderId: selectedGuider.id,
        serviceId: selectedService.id,
        dateTime: formattedDateTime,
        appointmentCharge: 0,
        serviceCost: price,
        totalPayment: price,
        transactionId: `txn_${Date.now()}`,
        note: notes || "",
      };

      console.log("📤 FINAL BOOKING PAYLOAD:", bookingPayload);

      const response = await api.post(
        API.CREATE_APPOINTMENT,
        bookingPayload
      );

      console.log("📥 Booking response:", response.data);

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
                setSelectedGuider(null);
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
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to create booking. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    try {
      // Remove any leading slashes
      const cleanPath = path.replace(/^\/+/, '');
      return `${BASE_URL}/api/image/download/${cleanPath}`;
    } catch (error) {
      return null;
    }
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
    setGuiders([]);
    fetchGuiders(1, false);
  };

  const resetFilters = () => {
    setSortBy("rating");
    setMinRating(0);
    setFilterModal(false);
    setPage(1);
    setGuiders([]);
    fetchGuiders(1, false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
  ];

  const renderServiceItem = (service, guider) => (
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
        onPress={() => handleBookNow(guider, service)}
      >
        <LinearGradient
          colors={["#2c5a73", "#1e3c4f"]}
          style={styles.bookServiceGradient}
        >
          <Text style={styles.bookServiceText}>Book This Package</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGuiderCard = ({ item }) => {
    const isExpanded = expandedGuider === item.id;
    const services = guiderServices[item.id] || [];
    
    return (
      <View style={styles.guiderCard}>
        <TouchableOpacity
          onPress={() => toggleGuiderExpand(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            {item.photograph ? (
              <Image
                source={{ uri: getImageUrl(item.photograph) }}
                style={styles.guiderImage}
              />
            ) : (
              <View style={[styles.guiderImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>
                  {item.firmName?.charAt(0) || item.name?.charAt(0) || "G"}
                </Text>
              </View>
            )}

            <View style={styles.guiderInfo}>
              <Text style={styles.guiderName}>
                {item.firmName || item.name || "Tour Guide"}
              </Text>
              
              <View style={styles.ratingContainer}>
                {renderRating(item.rating)}
                <Text style={styles.ratingText}>
                  ({item.rating?.toFixed(1) || "0.0"})
                </Text>
              </View>
              
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.placeName || "Local Guide"}
                </Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={14} color="#64748b" />
                  <Text style={styles.statText}>{item.totalBookings || 0} tours</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <Text style={styles.statText}>Available</Text>
                </View>
              </View>
            </View>

            <View style={styles.expandIcon}>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#2c5a73" 
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* About Section */}
            {item.description && (
              <View style={styles.aboutSection}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>{item.description}</Text>
              </View>
            )}

            {/* Languages Section - Add dummy data if not present */}
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
                    <View style={styles.languageTag}>
                      <Text style={styles.languageText}>Hindi</Text>
                    </View>
                    <View style={styles.languageTag}>
                      <Text style={styles.languageText}>English</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Experience & Expertise - Add dummy data if not present */}
            <View style={styles.expertiseSection}>
              <Text style={styles.sectionTitle}>Experience & Expertise</Text>
              <View style={styles.experienceRow}>
                <Ionicons name="briefcase-outline" size={16} color="#2c5a73" />
                <Text style={styles.experienceText}>
                  {item.experience || "5+"} years experience
                </Text>
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
                    <View style={styles.expertiseTag}>
                      <Text style={styles.expertiseText}>Local History</Text>
                    </View>
                    <View style={styles.expertiseTag}>
                      <Text style={styles.expertiseText}>Food Tours</Text>
                    </View>
                    <View style={styles.expertiseTag}>
                      <Text style={styles.expertiseText}>Photography</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Services Section */}
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Tour Packages</Text>
              
              {services.length > 0 ? (
                <View style={styles.servicesList}>
                  {services.map(service => renderServiceItem(service, item))}
                </View>
              ) : (
                <View style={styles.loadingServices}>
                  <ActivityIndicator size="small" color="#2c5a73" />
                  <Text style={styles.loadingServicesText}>Loading packages...</Text>
                </View>
              )}
            </View>

            {/* Reviews Summary */}
            {item.reviewCount > 0 && (
              <TouchableOpacity 
                style={styles.reviewsLink}
                onPress={() => navigation.navigate("GuiderReviews", { guiderId: item.id })}
              >
                <Text style={styles.reviewsLinkText}>
                  View {item.reviewCount} reviews →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Guides</Text>
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
                  style={[
                    styles.sortOption,
                    sortBy === option.value && styles.sortOptionSelected,
                  ]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.value && styles.sortOptionTextSelected,
                    ]}
                  >
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
                  style={[
                    styles.ratingOption,
                    minRating === rating && styles.ratingOptionSelected,
                  ]}
                  onPress={() => setMinRating(minRating === rating ? 0 : rating)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text
                      style={[
                        styles.ratingOptionText,
                        minRating === rating && styles.ratingOptionTextSelected,
                      ]}
                    >
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
                <LinearGradient
                  colors={["#2c5a73", "#1e3c4f"]}
                  style={styles.applyGradient}
                >
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
      transparent={true}
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

          {selectedGuider && selectedService && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Guide Info */}
              <View style={styles.selectedGuideInfo}>
                {selectedGuider.photograph ? (
                  <Image
                    source={{ uri: getImageUrl(selectedGuider.photograph) }}
                    style={styles.selectedGuideImage}
                  />
                ) : (
                  <View style={[styles.selectedGuideImage, styles.imagePlaceholder]}>
                    <Text style={styles.placeholderText}>
                      {selectedGuider.firmName?.charAt(0) ||
                        selectedGuider.name?.charAt(0) ||
                        "G"}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.selectedGuideName}>
                    {selectedGuider.firmName || selectedGuider.name || "Tour Guide"}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {renderRating(selectedGuider.rating)}
                    <Text style={styles.ratingText}>
                      ({selectedGuider.rating?.toFixed(1) || "0.0"})
                    </Text>
                  </View>
                </View>
              </View>

              {/* Selected Service Summary */}
              <View style={styles.selectedServiceSummary}>
                <Text style={styles.summaryTitle}>Selected Package</Text>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryServiceName}>{selectedService.title}</Text>
                  <Text style={styles.summaryServicePrice}>₹{selectedService.price}</Text>
                  <Text style={styles.summaryServiceDuration}>{selectedService.duration}</Text>
                </View>
              </View>

              {/* Date Selection */}
              <Text style={styles.sectionSubtitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
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

              {/* Time Slot */}
              <Text style={styles.sectionSubtitle}>Select Time Slot</Text>
              <View style={styles.timeSlotsGrid}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeSlot,
                      timeSlot === slot && styles.timeSlotSelected,
                    ]}
                    onPress={() => setTimeSlot(slot)}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        timeSlot === slot && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
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

              {/* Price Summary */}
              <View style={styles.priceSummary}>
                <Text style={styles.priceSummaryTitle}>Price Summary</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Service Charge</Text>
                  <Text style={styles.priceValue}>
                    ₹{parseFloat(selectedService.price).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>
                    ₹{parseFloat(selectedService.price).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
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
                <TouchableOpacity
                  style={[styles.confirmBtn, bookingLoading && styles.buttonDisabled]}
                  onPress={handleConfirmBooking}
                  disabled={bookingLoading || !timeSlot}
                >
                  <LinearGradient
                    colors={["#2c5a73", "#1e3c4f"]}
                    style={styles.confirmGradient}
                  >
                    {bookingLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                    )}
                  </LinearGradient>
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
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLoginPrompt(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.promptContent}>
          <Ionicons name="log-in-outline" size={50} color="#2c5a73" />
          <Text style={styles.promptTitle}>Login Required</Text>
          <Text style={styles.promptText}>
            Please login or create an account to book a tour guide.
          </Text>
          <View style={styles.promptButtons}>
            <TouchableOpacity
              style={styles.promptCancelBtn}
              onPress={() => setShowLoginPrompt(false)}
            >
              <Text style={styles.promptCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.promptLoginBtn}
              onPress={() => {
                setShowLoginPrompt(false);
                navigation.navigate("Login");
              }}
            >
              <LinearGradient
                colors={["#2c5a73", "#1e3c4f"]}
                style={styles.promptLoginGradient}
              >
                <Text style={styles.promptLoginText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1e3c4f", "#2c5a73", "#3b7a8f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tour Guides</Text>
          <TouchableOpacity onPress={() => setFilterModal(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guides by name or location..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Results Count */}
        <Text style={styles.resultsCount}>
          {filteredGuiders.length} guides found
        </Text>
      </LinearGradient>

      {/* Guiders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.loadingText}>Finding best guides for you...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGuiders}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderGuiderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={["#2c5a73"]}
              tintColor="#2c5a73"
            />
          }
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
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Guides Found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search query
              </Text>
              <TouchableOpacity style={styles.resetFiltersBtn} onPress={resetFilters}>
                <Text style={styles.resetFiltersText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modals */}
      {renderFilterModal()}
      {renderBookingModal()}
      {renderLoginPromptModal()}
    </View>
  );
}

// Add the missing promptContent styles to the StyleSheet
// Add these styles to your existing styles object:

// promptContent: {
//   backgroundColor: "#fff",
//   borderRadius: 20,
//   padding: 24,
//   alignItems: "center",
//   marginHorizontal: 20,
// },
// promptTitle: {
//   fontSize: 20,
//   fontWeight: "bold",
//   color: "#1e293b",
//   marginTop: 16,
//   marginBottom: 8,
// },
// promptText: {
//   fontSize: 14,
//   color: "#64748b",
//   textAlign: "center",
//   marginBottom: 24,
// },
// promptButtons: {
//   flexDirection: "row",
//   gap: 12,
// },
// promptCancelBtn: {
//   flex: 1,
//   paddingVertical: 12,
//   borderRadius: 8,
//   borderWidth: 1,
//   borderColor: "#e2e8f0",
//   alignItems: "center",
// },
// promptCancelText: {
//   fontSize: 14,
//   fontWeight: "600",
//   color: "#64748b",
// },
// promptLoginBtn: {
//   flex: 1,
//   borderRadius: 8,
//   overflow: "hidden",
// },
// promptLoginGradient: {
//   paddingVertical: 12,
//   alignItems: "center",
// },
// promptLoginText: {
//   fontSize: 14,
//   fontWeight: "600",
//   color: "#fff",
// },

// Make sure to add these to your styles object
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 46,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  filterBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1e293b",
    padding: 0,
  },
  resultsCount: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  guiderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
  },
  guiderImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: "#2c5a73",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  guiderInfo: {
    flex: 1,
  },
  guiderName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: "row",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 11,
    color: "#64748b",
    marginLeft: 4,
  },
  expandIcon: {
    justifyContent: "center",
    marginLeft: 8,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    marginTop: 4,
  },
  aboutSection: {
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  languagesSection: {
    marginBottom: 12,
  },
  languagesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageTag: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  languageText: {
    fontSize: 11,
    color: "#1e293b",
    fontWeight: "500",
  },
  expertiseSection: {
    marginBottom: 12,
  },
  experienceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  experienceText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 6,
  },
  expertiseTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  expertiseTag: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  expertiseText: {
    fontSize: 11,
    color: "#1e40af",
    fontWeight: "500",
  },
  servicesSection: {
    marginBottom: 12,
  },
  servicesList: {
    marginTop: 8,
  },
  serviceItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  serviceBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  serviceDuration: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "500",
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c5a73",
  },
  serviceDescription: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
    lineHeight: 16,
  },
  serviceFeatures: {
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 11,
    color: "#475569",
    marginLeft: 6,
  },
  bookServiceBtn: {
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 4,
  },
  bookServiceGradient: {
    paddingVertical: 8,
    alignItems: "center",
  },
  bookServiceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingServices: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  loadingServicesText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 8,
  },
  reviewsLink: {
    marginTop: 8,
    alignItems: "center",
  },
  reviewsLinkText: {
    fontSize: 12,
    color: "#2c5a73",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  resetFiltersBtn: {
    backgroundColor: "#2c5a73",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetFiltersText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  bookingModalContent: {
    maxHeight: "95%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  sortOptionSelected: {
    backgroundColor: "#2c5a73",
  },
  sortOptionText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  sortOptionTextSelected: {
    color: "#fff",
  },
  ratingOptions: {
    flexDirection: "row",
    marginBottom: 20,
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 8,
  },
  ratingOptionSelected: {
    backgroundColor: "#2c5a73",
  },
  ratingOptionText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 4,
    fontWeight: "500",
  },
  ratingOptionTextSelected: {
    color: "#fff",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 20,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  applyBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  applyGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // Booking Modal Styles
  selectedGuideInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedGuideImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedGuideName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  selectedServiceSummary: {
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 12,
    color: "#1e40af",
    marginBottom: 4,
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryServiceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  summaryServicePrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c5a73",
  },
  summaryServiceDuration: {
    fontSize: 11,
    color: "#64748b",
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    marginTop: 8,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    marginLeft: 10,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  timeSlot: {
    width: "48%",
    marginHorizontal: "1%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  timeSlotSelected: {
    backgroundColor: "#2c5a73",
    borderColor: "#2c5a73",
  },
  timeSlotText: {
    fontSize: 12,
    color: "#64748b",
  },
  timeSlotTextSelected: {
    color: "#fff",
  },
  notesInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1e293b",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  priceSummary: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  priceSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  priceValue: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c5a73",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  confirmBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1e293b",
  },
});