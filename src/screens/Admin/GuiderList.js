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
  StatusBar,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  Share,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

const { width } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

// 🔥 Get image URL from filename
const getImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;

  let imageName = filename;
  if (filename.includes("/")) {
    imageName = filename.split("/").pop();
  }
  if (filename.includes("\\")) {
    imageName = filename.split("\\").pop();
  }

  return `${BASE_URL}/api/image/download/${imageName}`;
};

// 🔥 Image Component
const GuiderImage = ({ imagePath, style }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setError(true);
      return;
    }
    setImageUrl(getImageUrl(imagePath));
  }, [imagePath]);

  if (error || !imageUrl) {
    return (
      <View style={[style, styles.avatarPlaceholder]}>
        <Icon name="map-marker-account" size={30} color="#2c5a73" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      onError={() => setError(true)}
      resizeMode="cover"
    />
  );
};

// 🔥 Excel Download Handler
const downloadGuidersAsExcel = async () => {
  try {
    const response = await api.get(`${BASE_URL}/${API.DOWNLOAD_GUIDERS}`, {
      responseType: "blob",
    });

    const fileName = `guiders_${new Date().getTime()}.xlsx`;
    const fileUri = `${FileSystem.DocumentDirectoryPath}/${fileName}`;

    // Convert blob to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Download Guiders",
        });
      }
    };
    reader.readAsDataURL(new Blob([response.data]));
  } catch (error) {
    console.error("Error downloading Excel:", error);
    Alert.alert("Error", "Failed to download guiders data");
  }
};

export default function GuiderListWithDownload({ navigation }) {
  const [guiders, setGuiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedGuider, setSelectedGuider] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);

  const loadGuiders = async () => {
    try {
      const response = await api.post("/guider/get_all", {
        admin: true,
      });

      const responseData = response.data || {};
      const guidersData = responseData.data || [];

      console.log("Guiders loaded:", guidersData.length);
      setGuiders(guidersData);
    } catch (error) {
      console.error("Error loading guiders:", error);
      Alert.alert("Error", "Failed to load guiders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGuiders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGuiders();
  };

  const getFilteredGuiders = () => {
    if (filter === "all") return guiders;
    return guiders.filter(
      (g) => g.approvalStatus?.toLowerCase() === filter.toLowerCase()
    );
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    switch (statusLower) {
      case "approved":
        return "#10B981";
      case "declined":
        return "#EF4444";
      default:
        return "#F59E0B";
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    switch (statusLower) {
      case "approved":
        return "check-circle";
      case "declined":
        return "close-circle";
      default:
        return "clock-outline";
    }
  };

  // 📊 Get Statistics
  const getStatistics = () => {
    const total = guiders.length;
    const approved = guiders.filter(
      (g) => g.approvalStatus?.toLowerCase() === "approved"
    ).length;
    const pending = guiders.filter(
      (g) => g.approvalStatus?.toLowerCase() === "pending"
    ).length;
    const declined = guiders.filter(
      (g) => g.approvalStatus?.toLowerCase() === "declined"
    ).length;

    return { total, approved, pending, declined };
  };

  // ✅ Show Guider Details
  const showGuiderDetails = (guider) => {
    setSelectedGuider(guider);
    setDetailsModalVisible(true);
  };

  // ✅ Delete Guider
  const deleteGuider = async (guiderId, guiderName) => {
    Alert.alert(
      "Delete Guider",
      `Are you sure you want to delete "${guiderName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);

              console.log("🗑️ Deleting guider with ID:", guiderId);

              const params = new URLSearchParams();
              params.append("guiderId", guiderId.toString());

              const response = await api.delete(API.DELETE_GUIDER, {
                data: params.toString(),
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              });

              console.log("🗑️ Delete Response:", response.data);

              if (response.data?.status) {
                Alert.alert("Success", "Guider deleted successfully!");
                setDetailsModalVisible(false);
                await loadGuiders();
              } else {
                Alert.alert(
                  "Error",
                  response.data?.message || "Failed to delete guider"
                );
              }
            } catch (error) {
              console.error(
                "❌ Error deleting guider:",
                error.response?.data || error.message
              );
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                  "Failed to delete guider. Please try again."
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ✅ Approve Guider
  const approveGuider = async (guiderId, guiderName) => {
    Alert.alert(
      "Approve Guider",
      `Are you sure you want to approve "${guiderName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setActionLoading(true);

              console.log("✅ Approving guider with ID:", guiderId);

              const params = new URLSearchParams();
              params.append("guiderId", guiderId.toString());
              params.append("status", "APPROVED");

              const response = await api.post(
                API.RESPOND_GUIDER_REQUEST,
                params.toString(),
                {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                }
              );

              console.log("✅ Approve Response:", response.data);

              if (response.data?.status) {
                Alert.alert("Success", "Guider approved successfully!");
                setDetailsModalVisible(false);
                await loadGuiders();
              } else {
                Alert.alert(
                  "Error",
                  response.data?.message || "Failed to approve guider"
                );
              }
            } catch (error) {
              console.error(
                "❌ Error approving guider:",
                error.response?.data || error.message
              );
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                  "Failed to approve guider. Please try again."
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ✅ Decline Guider with Reason
  const declineGuider = async (guiderId, guiderName) => {
    if (!declineReason.trim()) {
      Alert.alert("Error", "Please provide a reason for declining");
      return;
    }

    try {
      setActionLoading(true);

      console.log("❌ Declining guider with ID:", guiderId);

      const params = new URLSearchParams();
      params.append("guiderId", guiderId.toString());
      params.append("status", "DECLINED");
      params.append("reasonOfDecline", declineReason);

      const response = await api.post(
        API.RESPOND_GUIDER_REQUEST,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      console.log("❌ Decline Response:", response.data);

      if (response.data?.status) {
        Alert.alert("Success", "Guider declined successfully!");
        setReasonModalVisible(false);
        setDeclineReason("");
        setDetailsModalVisible(false);
        await loadGuiders();
      } else {
        Alert.alert(
          "Error",
          response.data?.message || "Failed to decline guider"
        );
      }
    } catch (error) {
      console.error(
        "❌ Error declining guider:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to decline guider. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // 📥 Download Excel
  const handleDownloadExcel = async () => {
    try {
      setDownloadLoading(true);

      // Get the file from API
      const response = await api.get(`${API.DOWNLOAD_GUIDERS}`, {
        responseType: "arraybuffer",
      });

      const fileName = `Guiders_${new Date().toISOString().split("T")[0]}.xlsx`;
      const fileUri = `${FileSystem.DocumentDirectoryPath}/${fileName}`;

      // Write file to local storage
      await FileSystem.writeAsStringAsync(fileUri, Buffer.from(response.data).toString("base64"), {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Download Guiders Data",
        });
      } else {
        Alert.alert(
          "Success",
          `File saved to: ${fileUri}`
        );
      }
    } catch (error) {
      console.error("Error downloading Excel:", error);
      Alert.alert(
        "Error",
        "Failed to download guiders data. Please try again."
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderGuiderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.95}
      onPress={() => showGuiderDetails(item)}
    >
      <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.cardGradient}>
        {/* Index Counter */}
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <GuiderImage imagePath={item.photograph} style={styles.avatar} />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {item.firmName || item.name || "Unnamed Guider"}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {item.email || "No email provided"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.approvalStatus) },
            ]}
          >
            <Icon
              name={getStatusIcon(item.approvalStatus)}
              size={12}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {item.approvalStatus || "PENDING"}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          {item.phone && (
            <View style={styles.detailRow}>
              <Icon name="phone" size={16} color="#2c5a73" />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          )}

          {item.address && (
            <View style={styles.detailRow}>
              <Icon name="map-marker" size={16} color="#2c5a73" />
              <Text style={styles.detailText} numberOfLines={2}>
                {item.address}
              </Text>
            </View>
          )}

          {item.description && (
            <View style={styles.detailRow}>
              <Icon name="text" size={16} color="#2c5a73" />
              <Text style={styles.detailText} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}

          {item.placeName && (
            <View style={styles.detailRow}>
              <Icon name="map-marker-radius" size={16} color="#2c5a73" />
              <Text style={styles.detailText}>{item.placeName}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.idContainer}>
              <Icon name="identifier" size={12} color="#64748b" />
              <Text style={styles.idText}>ID: {item.id}</Text>
            </View>

            {item.rating > 0 && (
              <View style={styles.rating}>
                <Icon name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.dateContainer}>
            <Icon name="calendar" size={12} color="#64748b" />
            <Text style={styles.dateText}>
              {item.createdOn
                ? new Date(item.createdOn).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => showGuiderDetails(item)}
          >
            <Icon name="eye" size={18} color="#2c5a73" />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="pencil" size={18} color="#2c5a73" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() =>
              deleteGuider(item.id, item.firmName || item.name)
            }
          >
            <Icon name="delete" size={18} color="#EF4444" />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const filteredGuiders = getFilteredGuiders();
  const stats = getStatistics();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c5a73" />

        <LinearGradient
          colors={["#2c5a73", "#1e3c4f"]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tourist Guiders</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Icon name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.loadingText}>Loading guiders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c5a73" />

      <LinearGradient
        colors={["#2c5a73", "#1e3c4f"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Tourist Guiders ({filteredGuiders.length})
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Icon name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats and Download Section */}
        <View style={styles.statsSection}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => setStatsModalVisible(true)}
          >
            <Icon name="chart-box" size={24} color="#fff" />
            <Text style={styles.statLabel}>Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.downloadCard]}
            onPress={handleDownloadExcel}
            disabled={downloadLoading}
          >
            {downloadLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="download" size={24} color="#fff" />
                <Text style={styles.statLabel}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {renderFilterButton("all", "All")}
          {renderFilterButton("pending", "Pending")}
          {renderFilterButton("approved", "Approved")}
          {renderFilterButton("declined", "Declined")}
        </View>
      </LinearGradient>

      {filteredGuiders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="account-off" size={80} color="#2c5a73" />
          <Text style={styles.emptyTitle}>No Guiders Found</Text>
          <Text style={styles.emptySubtext}>
            {filter === "all"
              ? "There are no tourist guiders registered yet"
              : `No ${filter} guiders found`}
          </Text>
          <TouchableOpacity
            style={styles.refreshBigButton}
            onPress={onRefresh}
          >
            <LinearGradient
              colors={["#2c5a73", "#1e3c4f"]}
              style={styles.refreshGradient}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshBigText}>Refresh</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredGuiders}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderGuiderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2c5a73"]}
              tintColor="#2c5a73"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Statistics Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={statsModalVisible}
        onRequestClose={() => setStatsModalVisible(false)}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={styles.modalOverlay}>
          <View style={styles.statsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guiders Statistics</Text>
              <TouchableOpacity onPress={() => setStatsModalVisible(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <View style={styles.statIconContainer}>
                  <Icon name="account-multiple" size={32} color="#2c5a73" />
                </View>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statName}>Total Guiders</Text>
              </View>

              <View style={[styles.statBox, styles.approvedStat]}>
                <View style={styles.statIconContainer}>
                  <Icon name="check-circle" size={32} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>{stats.approved}</Text>
                <Text style={styles.statName}>Approved</Text>
              </View>

              <View style={[styles.statBox, styles.pendingStat]}>
                <View style={styles.statIconContainer}>
                  <Icon name="clock-outline" size={32} color="#F59E0B" />
                </View>
                <Text style={styles.statNumber}>{stats.pending}</Text>
                <Text style={styles.statName}>Pending</Text>
              </View>

              <View style={[styles.statBox, styles.declinedStat]}>
                <View style={styles.statIconContainer}>
                  <Icon name="close-circle" size={32} color="#EF4444" />
                </View>
                <Text style={styles.statNumber}>{stats.declined}</Text>
                <Text style={styles.statName}>Declined</Text>
              </View>
            </View>

            <View style={styles.statsDetails}>
              <Text style={styles.statsDetailTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Approval Rate:</Text>
                <Text style={styles.summaryValue}>
                  {stats.total > 0
                    ? ((stats.approved / stats.total) * 100).toFixed(1)
                    : 0}
                  %
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pending Rate:</Text>
                <Text style={styles.summaryValue}>
                  {stats.total > 0
                    ? ((stats.pending / stats.total) * 100).toFixed(1)
                    : 0}
                  %
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeStatsButton}
              onPress={() => setStatsModalVisible(false)}
            >
              <Text style={styles.closeStatsText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Guider Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guider Details</Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
              >
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedGuider && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.modalProfileSection}>
                  <View style={styles.modalAvatarContainer}>
                    <GuiderImage
                      imagePath={selectedGuider.photograph}
                      style={styles.modalAvatar}
                    />
                  </View>

                  <Text style={styles.modalName}>
                    {selectedGuider.firmName || selectedGuider.name}
                  </Text>

                  <View style={styles.modalStatusRow}>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        {
                          backgroundColor: getStatusColor(
                            selectedGuider.approvalStatus
                          ),
                        },
                      ]}
                    >
                      <Icon
                        name={getStatusIcon(
                          selectedGuider.approvalStatus
                        )}
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.modalStatusText}>
                        {selectedGuider.approvalStatus || "PENDING"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Contact Information
                  </Text>

                  <View style={styles.modalInfoRow}>
                    <Icon name="email" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoLabel}>Email:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.email || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Icon name="phone" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoLabel}>Phone:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.phone || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Icon name="map-marker" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoLabel}>Address:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.address || "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Professional Information */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Professional Information
                  </Text>

                  <View style={styles.modalInfoRow}>
                    <Icon name="text" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoLabel}>Description:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.description || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Icon name="map-marker-radius" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoLabel}>Place:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.placeName || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Icon name="star" size={18} color="#FFD700" />
                    <Text style={styles.modalInfoLabel}>Rating:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.rating?.toFixed(1) || "0.0"}
                    </Text>
                  </View>
                </View>

                {/* ID Proof Information */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    ID Proof Information
                  </Text>

                  <View style={styles.modalInfoRow}>
                    <Icon name="card-account-details" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoLabel}>ID Type:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.idProofType || "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Account Information */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Account Information
                  </Text>

                  <View style={styles.modalInfoRow}>
                    <Icon name="identifier" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoLabel}>User ID:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.userId}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Icon name="calendar" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoLabel}>Created:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedGuider.createdOn
                        ? new Date(
                            selectedGuider.createdOn
                          ).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Decline Reason (if any) */}
                {selectedGuider.reasonOfDecline && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Decline Reason
                    </Text>
                    <View style={styles.declineReasonBox}>
                      <Text style={styles.declineReasonText}>
                        {selectedGuider.reasonOfDecline}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {selectedGuider.approvalStatus?.toLowerCase() ===
                    "pending" && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.modalActionButton,
                          styles.approveModalButton,
                        ]}
                        onPress={() =>
                          approveGuider(
                            selectedGuider.id,
                            selectedGuider.firmName
                          )
                        }
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Icon name="check" size={18} color="#fff" />
                            <Text style={styles.modalActionText}>Approve</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.modalActionButton,
                          styles.declineModalButton,
                        ]}
                        onPress={() => {
                          setDetailsModalVisible(false);
                          setReasonModalVisible(true);
                        }}
                        disabled={actionLoading}
                      >
                        <Icon name="close" size={18} color="#fff" />
                        <Text style={styles.modalActionText}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      styles.deleteModalButton,
                    ]}
                    onPress={() =>
                      deleteGuider(
                        selectedGuider.id,
                        selectedGuider.firmName ||
                          selectedGuider.name
                      )
                    }
                    disabled={actionLoading}
                  >
                    <Icon name="delete" size={18} color="#fff" />
                    <Text style={styles.modalActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Decline Reason Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reasonModalVisible}
        onRequestClose={() => setReasonModalVisible(false)}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={styles.modalOverlay}>
          <View style={styles.reasonModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Decline Reason</Text>
              <TouchableOpacity
                onPress={() => setReasonModalVisible(false)}
              >
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.reasonLabel}>
              Please provide a reason for declining this guider:
            </Text>

            <TextInput
              style={styles.reasonInput}
              value={declineReason}
              onChangeText={setDeclineReason}
              placeholder="Enter reason..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />

            <View style={styles.reasonActions}>
              <TouchableOpacity
                style={[styles.reasonButton, styles.reasonCancelButton]}
                onPress={() => {
                  setReasonModalVisible(false);
                  setDeclineReason("");
                }}
              >
                <Text style={styles.reasonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reasonButton, styles.reasonSubmitButton]}
                onPress={() =>
                  declineGuider(
                    selectedGuider.id,
                    selectedGuider.firmName
                  )
                }
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.reasonSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: "#2c5a73",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginTop: -35,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    justifyContent: "space-around",
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 15,
    paddingVertical: 12,
    gap: 6,
  },
  downloadCard: {
    backgroundColor: "rgba(16,185,129,0.3)",
  },
  statLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 25,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 21,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#fff",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  filterButtonTextActive: {
    color: "#2c5a73",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#2c5a73",
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  cardGradient: {
    padding: 16,
  },
  indexBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2c5a73",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  indexText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#2c5a73",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  cardDetails: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#334155",
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  idText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#1e293b",
    fontWeight: "600",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#64748b",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  actionText: {
    fontSize: 11,
    color: "#2c5a73",
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
  },
  deleteText: {
    color: "#EF4444",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c5a73",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshBigButton: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 3,
  },
  refreshGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 15,
    gap: 8,
  },
  refreshBigText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    padding: 20,
    elevation: 5,
  },
  statsModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    padding: 20,
    elevation: 5,
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
  modalProfileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#2c5a73",
  },
  modalAvatar: {
    width: "100%",
    height: "100%",
  },
  modalName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  modalStatusRow: {
    flexDirection: "row",
    gap: 8,
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 6,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 8,
    marginRight: 4,
    width: 90,
  },
  modalInfoValue: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  declineReasonBox: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  declineReasonText: {
    fontSize: 14,
    color: "#b91c1c",
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  approveModalButton: {
    backgroundColor: "#10B981",
  },
  declineModalButton: {
    backgroundColor: "#EF4444",
  },
  deleteModalButton: {
    backgroundColor: "#DC2626",
  },
  modalActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Reason Modal Styles
  reasonModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "90%",
    maxWidth: 400,
    padding: 20,
    elevation: 5,
  },
  reasonLabel: {
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 12,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  reasonActions: {
    flexDirection: "row",
    gap: 12,
  },
  reasonButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  reasonCancelButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  reasonSubmitButton: {
    backgroundColor: "#2c5a73",
  },
  reasonCancelText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "600",
  },
  reasonSubmitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  // Stats Modal Styles
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  approvedStat: {
    backgroundColor: "#f0fdf4",
    borderColor: "#dcfce7",
  },
  pendingStat: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
  declinedStat: {
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  statName: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  statsDetails: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsDetailTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c5a73",
  },
  closeStatsButton: {
    backgroundColor: "#2c5a73",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeStatsText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});