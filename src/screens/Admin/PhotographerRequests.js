// PhotographerRequests.js - SHOW ONLY IN REVIEW
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
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

const BASE_URL = "https://localguider.sinfode.com";

// Image handling
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace(/^\/+/, "");
  return `${BASE_URL}/api/image/download/${cleanPath}`;
};

const SafeImage = ({ path, style, fallbackIcon }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getImageUrl(path);

  if (!path || hasError) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <Icon name={fallbackIcon || "image-off"} size={30} color="#94a3b8" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
};

export default function PhotographerRequests({ navigation }) {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // ✅ Load only IN_REVIEW photographers
  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      console.log("📡 Loading IN_REVIEW photographers...");

     const formData = new URLSearchParams();
formData.append("page", "1");
formData.append("perPage", "100");
formData.append("status", "In review");
formData.append("admin", "true");

const response = await api.post(
  API.GET_PHOTOGRAPHERS_ALL,
  formData.toString(),
  {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  }
);

      if (response.data?.status) {
        const photographersData = response.data.data || [];
        console.log(`📡 Found ${photographersData.length} IN_REVIEW photographers`);
        setPhotographers(photographersData);
      } else {
        setPhotographers([]);
      }
    } catch (error) {
      console.error("❌ Error loading photographers:", error);
      Alert.alert("Error", "Failed to load photographer requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingRequests();
  };

  // ✅ Approve photographer
  const handleApprove = async (photographerId) => {
    Alert.alert(
      "Approve Photographer",
      "Are you sure you want to approve this photographer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setProcessingId(photographerId);
              
              const formData = new URLSearchParams();
              formData.append("photographerId", photographerId.toString());
              formData.append("status", "Approved");
              
              const response = await api.post(API.RESPOND_PHOTOGRAPHER_REQUEST, formData.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
              });

              if (response.data?.status) {
                setPhotographers(prev => prev.filter(p => p.id !== photographerId));
                Alert.alert("✅ Success", "Photographer approved successfully!");
                setActionModal(false);
                setSelectedPhotographer(null);
                setDeclineReason("");
              } else {
                Alert.alert("Error", response.data?.message || "Failed to approve");
              }
            } catch (error) {
              console.error("❌ Error:", error);
              Alert.alert("Error", "Failed to approve. Please try again.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  // ✅ Decline photographer
  const handleDecline = async (photographerId) => {
    if (!declineReason.trim()) {
      Alert.alert("Reason Required", "Please enter reason for declining");
      return;
    }

    Alert.alert(
      "Decline Photographer",
      "Are you sure you want to decline this photographer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(photographerId);
              
              const formData = new URLSearchParams();
              formData.append("photographerId", photographerId.toString());
              formData.append("status", "DECLINED");
              formData.append("reasonOfDecline", declineReason);
              
              const response = await api.post(API.RESPOND_PHOTOGRAPHER_REQUEST, formData.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
              });

              if (response.data?.status) {
                setPhotographers(prev => prev.filter(p => p.id !== photographerId));
                Alert.alert("✅ Success", "Photographer declined");
                setActionModal(false);
                setSelectedPhotographer(null);
                setDeclineReason("");
              } else {
                Alert.alert("Error", response.data?.message || "Failed to decline");
              }
            } catch (error) {
              console.error("❌ Error:", error);
              Alert.alert("Error", "Failed to decline. Please try again.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const viewPhotographerDetails = (photographer) => {
    setSelectedPhotographer(photographer);
    setDeclineReason("");
    setActionModal(true);
  };

  const renderPhotographerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => viewPhotographerDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <SafeImage
          path={item.photograph || item.featuredImage}
          style={styles.avatar}
          fallbackIcon="camera"
        />

        <View style={styles.userInfo}>
          <Text style={styles.name} numberOfLines={1}>{item.firmName || item.name}</Text>
          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
          {item.placeName && (
            <Text style={styles.location}>
              <Icon name="map-marker" size={12} color="#666" />
              {" " + item.placeName}
            </Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
            <Text style={[styles.statusText, { color: "#F59E0B" }]}>PENDING REVIEW</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.requestDate}>
          Requested: {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : "N/A"}
        </Text>
        <Icon name="chevron-right" size={20} color="#2c5a73" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c5a73" />
        <Text style={styles.loadingText}>Loading photographer requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2c5a73', '#1e3c4f']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Pending Requests ({photographers.length})
        </Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* List */}
      {photographers.length === 0 ? (
        <View style={styles.center}>
          <Icon name="camera-off" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptySubtitle}>All photographer requests have been processed</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photographers}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderPhotographerItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2c5a73"]} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Details Modal */}
      <Modal 
        visible={actionModal} 
        animationType="slide"
        transparent={false}
        onRequestClose={() => setActionModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <LinearGradient
            colors={['#2c5a73', '#1e3c4f']}
            style={styles.modalHeader}
          >
            <TouchableOpacity onPress={() => setActionModal(false)} style={styles.modalBackButton}>
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Application Details</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          {selectedPhotographer && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Profile Image Section */}
              <View style={styles.modalProfileSection}>
                <SafeImage
                  path={selectedPhotographer.photograph || selectedPhotographer.featuredImage}
                  style={styles.modalAvatar}
                  fallbackIcon="camera"
                />
                <Text style={styles.modalName}>
                  {selectedPhotographer.firmName || selectedPhotographer.name}
                </Text>
                <View style={[styles.modalStatusBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.modalStatusText, { color: "#F59E0B" }]}>
                    PENDING REVIEW
                  </Text>
                </View>
              </View>

              {/* Personal Information */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>👤 Personal Information</Text>
                <View style={styles.modalInfoGrid}>
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoLabelContainer}>
                      <Icon name="account" size={18} color="#2c5a73" />
                      <Text style={styles.modalInfoLabel}>Full Name:</Text>
                    </View>
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.name || "N/A"}</Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoLabelContainer}>
                      <Icon name="store" size={18} color="#2c5a73" />
                      <Text style={styles.modalInfoLabel}>Studio Name:</Text>
                    </View>
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.firmName || "N/A"}</Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoLabelContainer}>
                      <Icon name="phone" size={18} color="#2c5a73" />
                      <Text style={styles.modalInfoLabel}>Phone:</Text>
                    </View>
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.phone || "N/A"}</Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoLabelContainer}>
                      <Icon name="email" size={18} color="#2c5a73" />
                      <Text style={styles.modalInfoLabel}>Email:</Text>
                    </View>
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.email || "N/A"}</Text>
                  </View>
                </View>
              </View>

              {/* Business Details */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>💼 Business Details</Text>
                <View style={styles.modalInfoGrid}>
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoLabelContainer}>
                      <Icon name="text" size={18} color="#2c5a73" />
                      <Text style={styles.modalInfoLabel}>Description:</Text>
                    </View>
                  </View>
                  <Text style={styles.modalDescription}>
                    {selectedPhotographer.description || "No description provided"}
                  </Text>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoLabelContainer}>
                      <Icon name="map-marker" size={18} color="#2c5a73" />
                      <Text style={styles.modalInfoLabel}>Address:</Text>
                    </View>
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.address || "N/A"}</Text>
                  </View>

                  {selectedPhotographer.placeName && (
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoLabelContainer}>
                        <Icon name="city" size={18} color="#2c5a73" />
                        <Text style={styles.modalInfoLabel}>City/Place:</Text>
                      </View>
                      <Text style={styles.modalInfoValue}>{selectedPhotographer.placeName}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Request Information */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>📅 Request Information</Text>
                <View style={styles.modalInfoGrid}>
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoLabelContainer}>
                      <Icon name="calendar" size={18} color="#2c5a73" />
                      <Text style={styles.modalInfoLabel}>Requested On:</Text>
                    </View>
                    <Text style={styles.modalInfoValue}>
                      {selectedPhotographer.createdOn 
                        ? new Date(selectedPhotographer.createdOn).toLocaleDateString() + " at " + 
                          new Date(selectedPhotographer.createdOn).toLocaleTimeString()
                        : "N/A"}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoLabelContainer}>
                      <Icon name="star" size={18} color="#2c5a73" />
                      <Text style={styles.modalInfoLabel}>Current Rating:</Text>
                    </View>
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.rating || "0"}</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.modalActionSection}>
                <Text style={styles.modalActionTitle}>⚡ Take Action</Text>
                
                {/* Approve Button */}
                <TouchableOpacity
                  style={styles.modalApproveBtn}
                  onPress={() => handleApprove(selectedPhotographer.id)}
                  disabled={processingId === selectedPhotographer.id}
                >
                  {processingId === selectedPhotographer.id ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={24} color="#10B981" />
                      <Text style={styles.modalApproveText}>APPROVE APPLICATION</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Decline Reason Input */}
                <Text style={styles.modalReasonLabel}>Reason for declining (required):</Text>
                <TextInput
                  style={styles.modalReasonInput}
                  placeholder="Enter detailed reason for declining..."
                  placeholderTextColor="#94a3b8"
                  value={declineReason}
                  onChangeText={setDeclineReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {/* Decline Button */}
                <TouchableOpacity
                  style={styles.modalDeclineBtn}
                  onPress={() => handleDecline(selectedPhotographer.id)}
                  disabled={processingId === selectedPhotographer.id}
                >
                  {processingId === selectedPhotographer.id ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <Icon name="close-circle" size={24} color="#EF4444" />
                      <Text style={styles.modalDeclineText}>DECLINE APPLICATION</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: "#2c5a73" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  
  listContent: { padding: 16 },
  
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: "row" },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 16 },
  userInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 2 },
  email: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  phone: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  location: { fontSize: 12, color: "#666", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: "bold" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  requestDate: { fontSize: 11, color: "#94a3b8" },
  
  emptyTitle: { fontSize: 20, fontWeight: "600", color: "#64748b", marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 10 },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#2c5a73",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  
  // MODAL STYLES
  modalContainer: { flex: 1, backgroundColor: "#f5f7fa" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  modalContent: { flex: 1, padding: 16 },
  
  // Profile Section
  modalProfileSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#2c5a73",
  },
  modalName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  modalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalStatusText: { fontSize: 12, fontWeight: "bold" },
  
  // Info Sections
  modalSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
  },
  modalInfoGrid: { gap: 12 },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalInfoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  modalInfoLabel: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  modalInfoValue: { flex: 1, fontSize: 14, color: "#1e293b", fontWeight: "500", textAlign: "right" },
  modalDescription: {
    fontSize: 14,
    color: "#1e293b",
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 26,
  },
  
  // Action Section
  modalActionSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalActionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 16 },
  modalApproveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#10B981",
    gap: 8,
  },
  modalApproveText: { color: "#10B981", fontSize: 16, fontWeight: "bold" },
  modalReasonLabel: { fontSize: 14, color: "#475569", marginBottom: 8, fontWeight: "500" },
  modalReasonInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#f8fafc",
    minHeight: 100,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalDeclineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
    gap: 8,
  },
  modalDeclineText: { color: "#EF4444", fontSize: 16, fontWeight: "bold" },
  
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 8,
  },
});