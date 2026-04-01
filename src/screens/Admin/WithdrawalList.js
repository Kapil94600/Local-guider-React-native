import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";
import { AuthContext } from "../../context/AuthContext";

const BASE_URL = "https://localguider.sinfode.com";

export default function WithdrawalListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 15;

  // Modal for details & actions
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch withdrawals (all, for admin)
  const fetchWithdrawals = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("perPage", PAGE_SIZE.toString());

      const response = await api.post(API.GET_WITHDRAWAL, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data?.status) {
        let data = response.data.data || [];
        if (!Array.isArray(data)) data = [data];

        if (append) {
          setWithdrawals(prev => [...prev, ...data]);
        } else {
          setWithdrawals(data);
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageNum);
      } else {
        if (pageNum === 1) setWithdrawals([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Fetch withdrawals error:", error);
      if (pageNum === 1) setWithdrawals([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchWithdrawals(1, false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !refreshing) {
      fetchWithdrawals(page + 1, true);
    }
  };

  const updateStatus = async (withdrawalId, newStatus) => {
    try {
      setActionLoading(true);
      const params = new URLSearchParams();
      params.append("withdrawalId", withdrawalId.toString());
      params.append("status", newStatus);

      const response = await api.post(API.RESPOND_WITHDRAWAL, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data?.status) {
        Alert.alert("Success", `Withdrawal ${newStatus.toLowerCase()} successfully`);
        // Refresh the list
        setWithdrawals([]);
        setPage(1);
        setHasMore(true);
        await fetchWithdrawals(1, false);
        setModalVisible(false);
        setSelectedWithdrawal(null);
      } else {
        Alert.alert("Error", response.data?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Update status error:", error);
      Alert.alert("Error", "Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Success": return "#10B981";
      case "In Progress": return "#F59E0B";
      case "Canceled": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "Success": return "#D1FAE5";
      case "In Progress": return "#FEF3C7";
      case "Canceled": return "#FEE2E2";
      default: return "#F3F4F6";
    }
  };

  const getTypeLabel = (withdrawal) => {
    if (withdrawal.photographerId) return "Photographer";
    if (withdrawal.guiderId) return "Guider";
    return "Unknown";
  };

  const renderWithdrawalCard = ({ item }) => {
    // Use amountToBeSettled if available, otherwise calculate
    const settledAmount = item.amountToBeSettled || (item.amount ? item.amount - (item.charge || 0) : 0);
    const commission = item.charge || (item.amount ? item.amount - settledAmount : 0);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedWithdrawal(item);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{getTypeLabel(item)}</Text>
          </View>
          <Text style={styles.date}>
            {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : ""}
          </Text>
        </View>

        <Text style={styles.amount}>₹{settledAmount?.toLocaleString() || 0}</Text>

        <View style={styles.commissionInfo}>
          <Text style={styles.commissionText}>
            Requested: ₹{item.amount?.toLocaleString() || 0}
          </Text>
          <Text style={styles.commissionText}>
            Commission: -₹{commission?.toLocaleString() || 0}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>
              {item.accountHolderName || "Account holder not provided"}
            </Text>
          </View>
          {item.bankName && (
            <View style={styles.detailItem}>
              <Ionicons name="business-outline" size={14} color="#64748b" />
              <Text style={styles.detailText}>{item.bankName}</Text>
            </View>
          )}
          {item.upiId && (
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={14} color="#64748b" />
              <Text style={styles.detailText}>{item.upiId}</Text>
            </View>
          )}
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.paymentStatus) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}>
              {item.paymentStatus}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Withdrawal Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedWithdrawal && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalDetails}>
                <Text style={styles.modalDetailLabel}>Settled Amount</Text>
                <Text style={styles.modalDetailValue}>
                  ₹{selectedWithdrawal.amountToBeSettled?.toLocaleString() || 
                    (selectedWithdrawal.amount ? (selectedWithdrawal.amount - (selectedWithdrawal.charge || 0)).toLocaleString() : 0)}
                </Text>

                <Text style={styles.modalDetailLabel}>Requested Amount</Text>
                <Text style={styles.modalDetailValue}>₹{selectedWithdrawal.amount?.toLocaleString() || 0}</Text>

                <Text style={styles.modalDetailLabel}>Commission Charged</Text>
                <Text style={styles.modalDetailValue}>₹{selectedWithdrawal.charge?.toLocaleString() || 0}</Text>

                <Text style={styles.modalDetailLabel}>Type</Text>
                <Text style={styles.modalDetailValue}>{getTypeLabel(selectedWithdrawal)}</Text>

                <Text style={styles.modalDetailLabel}>Request Date</Text>
                <Text style={styles.modalDetailValue}>
                  {new Date(selectedWithdrawal.createdOn).toLocaleString()}
                </Text>

                <Text style={styles.modalDetailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedWithdrawal.paymentStatus), alignSelf: 'flex-start' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(selectedWithdrawal.paymentStatus) }]}>
                    {selectedWithdrawal.paymentStatus}
                  </Text>
                </View>

                {selectedWithdrawal.accountHolderName && (
                  <>
                    <Text style={styles.modalDetailLabel}>Account Holder Name</Text>
                    <Text style={styles.modalDetailValue}>{selectedWithdrawal.accountHolderName}</Text>
                  </>
                )}

                {selectedWithdrawal.bankName && (
                  <>
                    <Text style={styles.modalDetailLabel}>Bank Name</Text>
                    <Text style={styles.modalDetailValue}>{selectedWithdrawal.bankName}</Text>
                  </>
                )}

                {selectedWithdrawal.accountNumber && (
                  <>
                    <Text style={styles.modalDetailLabel}>Account Number</Text>
                    <Text style={styles.modalDetailValue}>{selectedWithdrawal.accountNumber}</Text>
                  </>
                )}

                {selectedWithdrawal.ifsc && (
                  <>
                    <Text style={styles.modalDetailLabel}>IFSC Code</Text>
                    <Text style={styles.modalDetailValue}>{selectedWithdrawal.ifsc}</Text>
                  </>
                )}

                {selectedWithdrawal.upiId && (
                  <>
                    <Text style={styles.modalDetailLabel}>UPI ID</Text>
                    <Text style={styles.modalDetailValue}>{selectedWithdrawal.upiId}</Text>
                  </>
                )}

                {selectedWithdrawal.photographerId && (
                  <>
                    <Text style={styles.modalDetailLabel}>Photographer ID</Text>
                    <Text style={styles.modalDetailValue}>{selectedWithdrawal.photographerId}</Text>
                  </>
                )}

                {selectedWithdrawal.guiderId && (
                  <>
                    <Text style={styles.modalDetailLabel}>Guider ID</Text>
                    <Text style={styles.modalDetailValue}>{selectedWithdrawal.guiderId}</Text>
                  </>
                )}
              </View>

              {selectedWithdrawal.paymentStatus === "In Progress" && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.approveButton]}
                    onPress={() => updateStatus(selectedWithdrawal.id, "Success")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonText}>Approve</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.rejectButton]}
                    onPress={() => updateStatus(selectedWithdrawal.id, "Canceled")}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5a73" />
        <Text style={styles.loadingText}>Loading withdrawals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdrawal Requests</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <FlatList
        data={withdrawals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWithdrawalCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2c5a73"]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore && <ActivityIndicator color="#2c5a73" style={{ marginVertical: 20 }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Withdrawal Requests</Text>
            <Text style={styles.emptyText}>All withdrawals will appear here</Text>
          </View>
        }
      />

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", flex: 1, textAlign: "center" },
  listContent: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  typeBadge: { backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { fontSize: 11, color: "#1e293b", fontWeight: "500" },
  date: { fontSize: 11, color: "#94a3b8" },
  amount: { fontSize: 22, fontWeight: "bold", color: "#2c5a73", marginBottom: 8 },
  commissionInfo: { marginBottom: 12 },
  commissionText: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  detailsRow: { marginBottom: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  detailText: { fontSize: 12, color: "#64748b", marginLeft: 6, flex: 1 },
  statusContainer: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#1e293b", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#64748b", textAlign: "center" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, width: "100%", maxWidth: 400, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  modalDetails: { marginBottom: 20 },
  modalDetailLabel: { fontSize: 12, color: "#64748b", marginBottom: 2, marginTop: 12 },
  modalDetailValue: { fontSize: 14, color: "#1e293b", fontWeight: "500" },
  modalActions: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 16 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  approveButton: { backgroundColor: "#10B981" },
  rejectButton: { backgroundColor: "#EF4444" },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});