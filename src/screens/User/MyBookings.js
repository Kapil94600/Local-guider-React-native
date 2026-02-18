import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

const BASE_URL = "https://localguider.sinfode.com";

export default function MyBookings({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, confirmed, completed, cancelled

  const loadBookings = async () => {
    try {
      console.log("📡 Loading bookings...");
      const response = await api.post(API.GET_APPOINTMENTS, {
        admin: false, // User ki apni bookings
      });
      
      console.log("📥 API Response:", response.data);
      
      const responseData = response.data || {};
      let bookingsData = responseData.data || [];
      
      // Ensure bookingsData is an array
      if (!Array.isArray(bookingsData)) {
        bookingsData = [];
      }
      
      console.log("✅ Bookings loaded:", bookingsData.length);
      
      // Sort by date (newest first)
      const sortedBookings = bookingsData.sort((a, b) => {
        const dateA = a.createdOn || a.createdAt || 0;
        const dateB = b.createdOn || b.createdAt || 0;
        return new Date(dateB) - new Date(dateA);
      });
      
      setBookings(sortedBookings);
    } catch (error) {
      console.error("❌ Error loading bookings:", error);
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status) => {
    if (!status) return '#6B7280';
    
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'confirmed':
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#3B82F6';
      case 'cancelled':
      case 'declined':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getServiceTypeIcon = (type) => {
    if (!type) return 'calendar';
    
    const typeLower = type.toLowerCase();
    switch (typeLower) {
      case 'photographer':
        return 'camera';
      case 'guider':
      case 'guide':
        return 'map';
      case 'place':
        return 'location';
      default:
        return 'calendar';
    }
  };

  const getServiceProviderName = (booking) => {
    if (booking?.photographer) {
      return booking.photographer.firmName || booking.photographer.name || "Photographer";
    }
    if (booking?.guider) {
      return booking.guider.firmName || booking.guider.name || "Tour Guide";
    }
    if (booking?.place) {
      return booking.place.placeName || "Place";
    }
    return "Service Provider";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const cancelBooking = (bookingId) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const formData = new FormData();
              formData.append("bookingId", bookingId.toString());

              const response = await api.post(API.USER_CANCEL_APPOINTMENT, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });

              if (response.data?.status) {
                Alert.alert("Success", "Booking cancelled successfully");
                loadBookings();
              } else {
                Alert.alert("Error", response.data?.message || "Failed to cancel booking");
              }
            } catch (error) {
              console.error("Error cancelling booking:", error);
              Alert.alert("Error", "Failed to cancel booking");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  // ✅ FIXED: Safe filtering with null/undefined check
  const filteredBookings = () => {
    if (statusFilter === "all") {
      return bookings;
    }
    
    return bookings.filter(booking => {
      const status = booking?.status?.toLowerCase() || "";
      return status === statusFilter.toLowerCase();
    });
  };

  const renderBookingItem = ({ item }) => {
    if (!item) return null;
    
    const statusColor = getStatusColor(item.status);
    const serviceIcon = getServiceTypeIcon(item.serviceType);
    const serviceProvider = getServiceProviderName(item);
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => openBookingDetails(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.serviceIconContainer}>
            <Ionicons name={serviceIcon} size={24} color="#42738fe3" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.serviceProvider}>{serviceProvider}</Text>
            <Text style={styles.bookingDate}>
              {formatDate(item.bookingDate || item.createdOn)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.toUpperCase() || "PENDING"}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          {item.date && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {item.time && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.time}</Text>
            </View>
          )}
          
          {item.duration && (
            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.duration} hours</Text>
            </View>
          )}
          
          {item.totalAmount > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={14} color="#666" />
              <Text style={styles.detailText}>₹{item.totalAmount}</Text>
            </View>
          )}
        </View>

        {item.status?.toLowerCase() === 'pending' && (
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => cancelBooking(item.id)}
            >
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        statusFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setStatusFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        statusFilter === value && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const filteredData = filteredBookings();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton title="All" value="all" />
          <FilterButton title="Pending" value="pending" />
          <FilterButton title="Confirmed" value="confirmed" />
          <FilterButton title="Completed" value="completed" />
          <FilterButton title="Cancelled" value="cancelled" />
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#42738fe3" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            {statusFilter === "all" 
              ? "You haven't made any bookings yet" 
              : `No ${statusFilter} bookings found`
            }
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.exploreButtonText}>Explore Places</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#42738fe3"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Booking Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Booking ID</Text>
                  <Text style={styles.modalValue}>#{selectedBooking.id}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Service Type</Text>
                  <Text style={styles.modalValue}>
                    {selectedBooking.serviceType || "Booking"}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Service Provider</Text>
                  <Text style={styles.modalValue}>
                    {getServiceProviderName(selectedBooking)}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={[styles.modalStatusBadge, { 
                    backgroundColor: `${getStatusColor(selectedBooking.status)}20` 
                  }]}>
                    <Text style={[styles.modalStatusText, { 
                      color: getStatusColor(selectedBooking.status) 
                    }]}>
                      {selectedBooking.status?.toUpperCase() || "PENDING"}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Booking Date</Text>
                  <Text style={styles.modalValue}>
                    {formatDate(selectedBooking.bookingDate || selectedBooking.createdOn)}
                  </Text>
                </View>

                {selectedBooking.date && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Service Date</Text>
                    <Text style={styles.modalValue}>
                      {new Date(selectedBooking.date).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {selectedBooking.time && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Service Time</Text>
                    <Text style={styles.modalValue}>{selectedBooking.time}</Text>
                  </View>
                )}

                {selectedBooking.duration && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Duration</Text>
                    <Text style={styles.modalValue}>{selectedBooking.duration} hours</Text>
                  </View>
                )}

                {selectedBooking.totalAmount > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Total Amount</Text>
                    <Text style={[styles.modalValue, styles.amountText]}>
                      ₹{selectedBooking.totalAmount}
                    </Text>
                  </View>
                )}

                {selectedBooking.notes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Special Requests</Text>
                    <Text style={styles.modalValue}>{selectedBooking.notes}</Text>
                  </View>
                )}

                {selectedBooking.status?.toLowerCase() === 'pending' && (
                  <TouchableOpacity 
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setModalVisible(false);
                      cancelBooking(selectedBooking.id);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.modalCancelText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#42738fe3",
    borderBottomWidth: 1,
    borderBottomColor: "#42738fe3",
    height: 100,
    paddingTop: 35,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f3f4f6",
  },
  filterButtonActive: {
    backgroundColor: "#42738fe3",
  },
  filterButtonText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0e6f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  serviceProvider: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#FEE2E2",
  },
  cancelButtonText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: "#42738fe3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  modalValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  amountText: {
    color: "#10B981",
    fontWeight: "bold",
    fontSize: 18,
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalCancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  modalCancelText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 15,
  },
});