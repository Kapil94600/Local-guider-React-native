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
import api from "../../api/apiClient";

const BASE_URL = "https://localguider.sinfode.com";

/* ================= 🔥 FIXED: IMAGE URL - CHECKING MULTIPLE POSSIBLE PATHS ================= */
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  
  // Clean the path - remove any leading slashes
  const cleanPath = path.replace(/^\/+/, "");
  
  // Try multiple possible paths
  const possiblePaths = [
    `${BASE_URL}/files/${cleanPath}`,                    // /files/filename.jpg
    `${BASE_URL}/api/image/download/${cleanPath}`,       // /api/image/download/filename.jpg
    `${BASE_URL}/uploads/${cleanPath}`,                  // /uploads/filename.jpg
    `${BASE_URL}/images/${cleanPath}`,                   // /images/filename.jpg
  ];
  
  console.log(`🖼️ Trying paths for: ${cleanPath}`);
  return possiblePaths[0]; // Return first path, we'll let the Image component handle errors
};

/* ================= SAFE IMAGE COMPONENT WITH FALLBACKS ================= */
const SafeImage = ({ path, style, fallbackIcon, fallbackText }) => {
  const [hasError, setHasError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  
  // Generate possible URLs
  const getPossibleUrls = (imagePath) => {
    if (!imagePath) return [];
    const cleanPath = imagePath.replace(/^\/+/, "");
    return [
      `${BASE_URL}/files/${cleanPath}`,
      `${BASE_URL}/api/image/download/${cleanPath}`,
      `${BASE_URL}/uploads/${cleanPath}`,
      `${BASE_URL}/images/${cleanPath}`,
    ];
  };

  const possibleUrls = getPossibleUrls(path);
  const currentUrl = possibleUrls[currentUrlIndex];

  useEffect(() => {
    if (path) {
      console.log(`🖼️ Loading image: ${path}`);
      console.log(`🖼️ Trying URL ${currentUrlIndex + 1}/${possibleUrls.length}: ${currentUrl}`);
    }
    setHasError(false);
    setCurrentUrlIndex(0);
  }, [path]);

  const handleError = () => {
    console.log(`❌ Image failed: ${currentUrl}`);
    
    // Try next URL if available
    if (currentUrlIndex < possibleUrls.length - 1) {
      console.log(`🔄 Trying next URL...`);
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      // All URLs failed
      console.log(`❌ All URLs failed for: ${path}`);
      setHasError(true);
    }
  };

  if (!path || hasError || !currentUrl) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <Icon name={fallbackIcon || "image-off"} size={30} color="#94a3b8" />
        <Text style={styles.placeholderText}>{fallbackText || "No image"}</Text>
      </View>
    );
  }

  return (
    <Image
      key={currentUrl} // Force re-render when URL changes
      source={{ uri: currentUrl }}
      style={style}
      resizeMode="cover"
      onError={handleError}
    />
  );
};

export default function GuiderRequests({ navigation }) {
  const [guiders, setGuiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGuider, setSelectedGuider] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  /* ================= LOAD ONLY IN REVIEW ================= */
  const loadGuiderRequests = async () => {
    try {
      setLoading(true);
      console.log("📡 Loading guider requests...");
      
      // ✅ Send params in URL - Backend @RequestParam expects this
      const response = await api.post("/guider/get_all", null, {
        params: {
          admin: true,
          status: "In Review",
          page: 1,
          perPage: 100,
        },
      });

      const allGuiders = response?.data?.data || [];
      console.log(`📊 Total: ${allGuiders.length}`);
      
      // ✅ Filter only "In Review"
      const inReviewGuiders = allGuiders.filter(g => 
        g.approvalStatus === "In Review"
      );
      
      console.log(`✅ In Review: ${inReviewGuiders.length}`);
      setGuiders(inReviewGuiders);
      
    } catch (error) {
      console.error("❌ Error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load guider requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGuiderRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGuiderRequests();
  };

  /* ================= APPROVE - URLSearchParams ================= */
  const handleApprove = async (guiderId) => {
    Alert.alert(
      "Approve Guider",
      "Are you sure you want to approve this guider?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setProcessingId(guiderId);
              
              // ✅ Backend @RequestParam expects x-www-form-urlencoded
              const params = new URLSearchParams();
              params.append("guiderId", guiderId);
              params.append("status", "Approved");

              console.log("🚀 Approving:", guiderId);

              const response = await api.post(
                "/guider/respond_on_request",
                params,
                {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                }
              );

              console.log("✅ Approve response:", response.data);

              if (response?.data?.status) {
                Alert.alert("✅ Success", "Guider approved!");
                setActionModal(false);
                setSelectedGuider(null);
                loadGuiderRequests();
              }
            } catch (error) {
              console.error("❌ Error:", error.response?.data || error.message);
              Alert.alert("Error", error.response?.data?.message || "Failed to approve");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  /* ================= DECLINE - URLSearchParams ================= */
  const handleDecline = async (guiderId) => {
    if (!declineReason.trim()) {
      Alert.alert("Reason Required", "Please enter reason for declining");
      return;
    }

    Alert.alert(
      "Decline Guider",
      "Are you sure you want to decline this guider?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(guiderId);
              
              const params = new URLSearchParams();
              params.append("guiderId", guiderId);
              params.append("status", "Declined");
              params.append("reasonOfDecline", declineReason.trim());

              console.log("🚀 Declining:", guiderId);

              const response = await api.post(
                "/guider/respond_on_request",
                params,
                {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                }
              );

              console.log("✅ Decline response:", response.data);

              if (response?.data?.status) {
                Alert.alert("✅ Success", "Guider declined!");
                setActionModal(false);
                setSelectedGuider(null);
                setDeclineReason("");
                loadGuiderRequests();
              }
            } catch (error) {
              console.error("❌ Error:", error.response?.data || error.message);
              Alert.alert("Error", error.response?.data?.message || "Failed to decline");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  /* ================= LOAD DETAILS ================= */
  const viewGuiderDetails = async (guider) => {
    try {
      setActionModal(true);
      setSelectedGuider(guider);
      setDeclineReason("");
      
      // Load fresh details if needed
      const response = await api.post("/guider/get_details", null, {
        params: { guiderId: guider.id }
      });
      
      if (response?.data?.status) {
        setSelectedGuider(response.data.data);
      }
    } catch (error) {
      console.error("❌ Details error:", error);
    }
  };

  /* ================= RENDER DOCUMENT ================= */
  const renderDocumentThumb = (imagePath, label) => (
    <View style={styles.documentItem}>
      <Text style={styles.documentLabel}>{label}:</Text>
      <SafeImage
        path={imagePath}
        style={styles.documentThumb}
        fallbackIcon="file-image-outline"
        fallbackText={`No ${label}`}
      />
    </View>
  );

  /* ================= RENDER SERVICE ================= */
  const renderService = (service, index) => (
    <View key={index} style={styles.serviceItem}>
      <Text style={styles.serviceTitle}>{service.title || `Service ${index + 1}`}</Text>
      <Text style={styles.serviceDesc}>{service.description || "No description"}</Text>
      <Text style={styles.servicePrice}>₹{service.servicePrice || 0}</Text>
      {service.image && (
        <SafeImage
          path={service.image}
          style={styles.serviceThumb}
          fallbackIcon="image"
        />
      )}
    </View>
  );

  /* ================= RENDER GUIDER ITEM ================= */
  const renderGuiderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => viewGuiderDetails(item)}
    >
      <View style={styles.cardHeader}>
        <SafeImage
          path={item.photograph}
          style={styles.avatar}
          fallbackIcon="account"
          fallbackText="No photo"
        />

        <View style={styles.userInfo}>
          <Text style={styles.name}>{item.firmName || "Unnamed Guider"}</Text>
          <Text style={styles.email}>{item.email || "No email"}</Text>
          <Text style={styles.phone}>{item.phone || "No phone"}</Text>
          <Text style={styles.location}>
            <Icon name="map-marker" size={12} color="#666" />
            {" " + (item.placeName || `Place ID: ${item.placeId}`)}
          </Text>
          <View style={styles.reviewBadge}>
            <Text style={styles.statusText}>IN REVIEW</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.requestDate}>
        Requested: {new Date(item.createdOn).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  /* ================= UI ================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#42738f" />
        <Text style={styles.loadingText}>Loading pending requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Pending Requests {guiders.length > 0 && `(${guiders.length})`}
        </Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Icon name={refreshing ? "loading" : "refresh"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {guiders.length === 0 ? (
        <View style={styles.center}>
          <Icon name="account-check" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Pending Requests</Text>
          <Text style={styles.emptySubtitle}>All guider requests have been processed</Text>
        </View>
      ) : (
        <FlatList
          data={guiders}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderGuiderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Details Modal */}
      <Modal visible={actionModal} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setActionModal(false)}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Application Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {selectedGuider && (
          <ScrollView style={styles.modalContent}>
            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <InfoRow label="Firm Name" value={selectedGuider.firmName} />
              <InfoRow label="Description" value={selectedGuider.description} />
              <InfoRow label="Phone" value={selectedGuider.phone} />
              <InfoRow label="Email" value={selectedGuider.email} />
              <InfoRow label="Address" value={selectedGuider.address} />
            </View>

            {/* Place Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Place Information</Text>
              <InfoRow 
                label="Primary Place" 
                value={selectedGuider.placeName || `ID: ${selectedGuider.placeId}`} 
              />
              {selectedGuider.places && (
                <InfoRow label="Other Places" value={selectedGuider.places} />
              )}
            </View>

            {/* Documents */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <InfoRow label="ID Type" value={selectedGuider.idProofType} />
              <View style={styles.docGrid}>
                {renderDocumentThumb(selectedGuider.idProofFront, "ID Front")}
                {renderDocumentThumb(selectedGuider.idProofBack, "ID Back")}
                {renderDocumentThumb(selectedGuider.photograph, "Photograph")}
                {renderDocumentThumb(selectedGuider.featuredImage, "Featured")}
              </View>
            </View>

            {/* Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              {selectedGuider.services?.length > 0 ? (
                selectedGuider.services.map(renderService)
              ) : (
                <Text style={styles.noDataText}>No services added</Text>
              )}
            </View>

            {/* Request Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Request Information</Text>
              <InfoRow 
                label="Requested On" 
                value={new Date(selectedGuider.createdOn).toLocaleString()} 
              />
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.badgeText, { color: "#9A3412" }]}>
                    {selectedGuider.approvalStatus}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionSection}>
              <Text style={styles.actionTitle}>Take Action</Text>
              
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApprove(selectedGuider.id)}
                disabled={processingId === selectedGuider.id}
              >
                {processingId === selectedGuider.id ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <>
                    <Icon name="check-circle" size={20} color="#10B981" />
                    <Text style={styles.approveText}>APPROVE</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.reasonLabel}>Reason for decline:</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Enter reason here..."
                value={declineReason}
                onChangeText={setDeclineReason}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => handleDecline(selectedGuider.id)}
                disabled={processingId === selectedGuider.id}
              >
                {processingId === selectedGuider.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Icon name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.declineText}>DECLINE</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

/* ================= HELPER COMPONENT ================= */
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#42738f",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 40,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  
  listContent: { padding: 16 },
  
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row" },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 16 },
  userInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 2 },
  email: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  phone: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  location: { fontSize: 12, color: "#666", marginTop: 2 },
  reviewBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: "bold", color: "#9A3412" },
  requestDate: { 
    fontSize: 11, 
    color: "#94a3b8", 
    marginTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: "#f1f5f9", 
    paddingTop: 12 
  },
  
  emptyTitle: { fontSize: 20, fontWeight: "600", color: "#64748b", marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  modalContent: { padding: 16 },
  
  section: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 8 },
  
  infoRow: { flexDirection: "row", marginBottom: 8 },
  infoLabel: { width: 100, fontSize: 14, color: "#64748b", fontWeight: "500" },
  infoValue: { flex: 1, fontSize: 14, color: "#1e293b" },
  
  docGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  documentItem: { width: "48%", marginBottom: 16 },
  documentLabel: { fontSize: 13, fontWeight: "500", color: "#475569", marginBottom: 6 },
  documentThumb: { width: "100%", height: 100, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 8,
  },
  placeholderText: { fontSize: 11, color: "#94a3b8", marginTop: 4, textAlign: "center" },
  
  serviceItem: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 8 },
  serviceTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  serviceDesc: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  servicePrice: { fontSize: 14, fontWeight: "600", color: "#10B981", marginBottom: 4 },
  serviceThumb: { width: 60, height: 60, borderRadius: 6, marginTop: 8 },
  
  noDataText: { fontSize: 14, color: "#94a3b8", fontStyle: "italic" },
  
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "bold" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  statusLabel: { fontSize: 14, color: "#64748b", fontWeight: "500", width: 100 },
  
  actionSection: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 32, elevation: 2 },
  actionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b", marginBottom: 16 },
  
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  approveText: { color: "#10B981", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  
  reasonLabel: { fontSize: 14, color: "#475569", marginBottom: 8 },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#f8fafc",
    minHeight: 80,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  
  declineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  declineText: { color: "#EF4444", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
});