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
  KeyboardAvoidingView,
  Platform,
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

export default function PhotographersListScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const { location } = useContext(LocationContext);
  const { type } = route.params || { type: "all" };

  const [photographers, setPhotographers] = useState([]);
  const [filteredPhotographers, setFilteredPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
  }, [location, sortBy, minRating, priceRange]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = photographers.filter(
        (photographer) =>
          photographer.firmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          photographer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          photographer.placeName?.toLowerCase().includes(searchQuery.toLowerCase())
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
    fetchPhotographers(1, false);
  };

  const handlePhotographerPress = (photographer) => {
    setSelectedPhotographer(photographer);
    fetchPhotographerServices(photographer.id);
  };

  const fetchPhotographerServices = async (photographerId) => {
    try {
      const response = await api.post(API.GET_SERVICES, {
        photographerId: photographerId,
      });
      
      if (response.data?.status) {
        setServices(response.data.data || []);
        setBookingModal(true);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      Alert.alert("Error", "Failed to load services");
    }
  };

  const handleBookNow = (service) => {
    setSelectedService(service);
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

      const bookingData = {
        userId: user.id,
        photographerId: selectedPhotographer.id,
        serviceId: selectedService.id,
        appointmentDate: date.toISOString().split('T')[0],
        timeSlot: timeSlot,
        amount: selectedService.servicePrice,
        notes: notes,
        status: "PENDING",
      };

      const response = await api.post(API.CREATE_APPOINTMENT, bookingData);

      if (response.data?.status) {
        Alert.alert(
          "Success",
          "Booking request sent successfully! The photographer will respond shortly.",
          [
            {
              text: "OK",
              onPress: () => {
                setBookingModal(false);
                setSelectedService(null);
                setTimeSlot("");
                setNotes("");
                navigation.navigate("MyBookings");
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", response.data?.message || "Failed to book");
      }
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert("Error", "Failed to create booking");
    } finally {
      setBookingLoading(false);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    try {
      const filename = path.split("/").pop();
      return `${BASE_URL}/api/image/download/${filename}`;
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
    fetchPhotographers(1, false);
  };

  const resetFilters = () => {
    setSortBy("rating");
    setMinRating(0);
    setPriceRange({ min: 0, max: 50000 });
    setFilterModal(false);
    setPage(1);
    fetchPhotographers(1, false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const renderPhotographerCard = ({ item }) => (
    <TouchableOpacity
      style={styles.photographerCard}
      onPress={() => handlePhotographerPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        {item.featuredImage ? (
          <Image
            source={{ uri: getImageUrl(item.featuredImage) }}
            style={styles.photographerImage}
          />
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
        </View>
      </View>

      <View style={styles.cardFooter}>
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

        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <LinearGradient
        colors={["#56829a", "#2c5a73"]}
        style={styles.bookBadge}
      >
        <Text style={styles.bookBadgeText}>Book Now</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderServiceCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.serviceCard,
        selectedService?.id === item.id && styles.selectedServiceCard,
      ]}
      onPress={() => setSelectedService(item)}
    >
      {item.image && (
        <Image
          source={{ uri: getImageUrl(item.image) }}
          style={styles.serviceImage}
        />
      )}
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceTitle}>{item.title}</Text>
        <Text style={styles.serviceDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.serviceFooter}>
          <Text style={styles.servicePrice}>₹{item.servicePrice}</Text>
          <Text style={styles.serviceDuration}>{item.duration || "2 hours"}</Text>
        </View>
      </View>
      {selectedService?.id === item.id && (
        <View style={styles.selectedCheck}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
      )}
    </TouchableOpacity>
  );

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
            <Text style={styles.modalTitle}>Filter Photographers</Text>
            <TouchableOpacity onPress={() => setFilterModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sort By */}
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

            {/* Minimum Rating */}
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

            {/* Action Buttons */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <LinearGradient
                 colors={["#56829a", "#2c5a73"]}
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
      }}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.bookingModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Photography Session</Text>
            <TouchableOpacity
              onPress={() => {
                setBookingModal(false);
                setSelectedService(null);
              }}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedPhotographer && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Photographer Info */}
              <View style={styles.selectedPhotographerInfo}>
                {selectedPhotographer.featuredImage ? (
                  <Image
                    source={{ uri: getImageUrl(selectedPhotographer.featuredImage) }}
                    style={styles.selectedPhotographerImage}
                  />
                ) : (
                  <View style={[styles.selectedPhotographerImage, styles.imagePlaceholder]}>
                    <Text style={styles.placeholderText}>
                      {selectedPhotographer.firmName?.charAt(0) ||
                        selectedPhotographer.name?.charAt(0) ||
                        "P"}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.selectedPhotographerName}>
                    {selectedPhotographer.firmName || selectedPhotographer.name || "Photographer"}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {renderRating(selectedPhotographer.rating)}
                    <Text style={styles.ratingText}>
                      ({selectedPhotographer.rating?.toFixed(1) || "0.0"})
                    </Text>
                  </View>
                </View>
              </View>

              {/* Select Service */}
              <Text style={styles.sectionSubtitle}>Select Photography Package</Text>
              <FlatList
                data={services}
                keyExtractor={(item) => item.id?.toString()}
                renderItem={renderServiceCard}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyServices}>
                    <Ionicons name="cube-outline" size={40} color="#94a3b8" />
                    <Text style={styles.emptyServicesText}>
                      No packages available for this photographer
                    </Text>
                  </View>
                }
              />

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
                placeholder="Any special requirements or preferences?"
                placeholderTextColor="#94a3b8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Price Summary */}
              {selectedService && (
                <View style={styles.priceSummary}>
                  <Text style={styles.priceSummaryTitle}>Price Summary</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Package Price</Text>
                    <Text style={styles.priceValue}>₹{selectedService.servicePrice}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>GST (5%)</Text>
                    <Text style={styles.priceValue}>
                      ₹{(selectedService.servicePrice * 0.05).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>
                      ₹{(selectedService.servicePrice * 1.05).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setBookingModal(false);
                    setSelectedService(null);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, bookingLoading && styles.buttonDisabled]}
                  onPress={handleConfirmBooking}
                  disabled={bookingLoading || !selectedService}
                >
                  <LinearGradient
                    colors={["#56829a", "#2c5a73"]}
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
          <Text style={styles.headerTitle}>Photographers</Text>
          <TouchableOpacity onPress={() => setFilterModal(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search photographers by name or location..."
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
          {filteredPhotographers.length} photographers found
        </Text>
      </LinearGradient>

      {/* Photographers List */}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
              <Ionicons name="camera-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Photographers Found</Text>
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
    </View>
  );
}

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
  photographerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  photographerImage: {
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
  photographerInfo: {
    flex: 1,
  },
  photographerName: {
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
  },
  locationText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    color: "#10B981",
    marginLeft: 2,
    fontWeight: "600",
  },
  bookBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookBadgeText: {
    color: "#fff",
    fontSize: 10,
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
  selectedPhotographerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedPhotographerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedPhotographerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    marginTop: 8,
  },
  serviceCard: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedServiceCard: {
    borderColor: "#2c5a73",
    backgroundColor: "#f3e8ff",
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 4,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2c5a73",
  },
  serviceDuration: {
    fontSize: 11,
    color: "#64748b",
  },
  selectedCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  emptyServices: {
    alignItems: "center",
    padding: 20,
  },
  emptyServicesText: {
    fontSize: 12,
    color: "#64748b",
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