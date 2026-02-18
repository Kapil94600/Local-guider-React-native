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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function TransactionHistory({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all"); // all, credit, debit

  const loadTransactions = async () => {
    try {
      console.log("📡 Loading transactions...");
      const response = await api.post(API.GET_TRANSACTION, {
        admin: false, // User ki apni transactions
      });
      
      const responseData = response.data || {};
      const transactionsData = responseData.data || [];
      
      console.log("✅ Transactions loaded:", transactionsData.length);
      
      // Sort by date (newest first)
      const sortedTransactions = transactionsData.sort((a, b) => 
        new Date(b.createdOn || b.createdAt) - new Date(a.createdOn || a.createdAt)
      );
      
      setTransactions(sortedTransactions);
    } catch (error) {
      console.error("❌ Error loading transactions:", error);
      Alert.alert("Error", "Failed to load transactions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const getTransactionType = (transaction) => {
    // Determine if it's credit or debit based on amount sign or type field
    if (transaction.type === 'credit' || transaction.type === 'CREDIT') return 'credit';
    if (transaction.type === 'debit' || transaction.type === 'DEBIT') return 'debit';
    
    // Fallback: check amount sign
    if (transaction.amount > 0) return 'credit';
    return 'debit';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return `₹${Math.abs(amount).toLocaleString()}`;
  };

  const openTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const filteredTransactions = typeFilter === "all" 
    ? transactions 
    : transactions.filter(t => getTransactionType(t) === typeFilter);

  const renderTransactionItem = ({ item }) => {
    const type = getTransactionType(item);
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => openTransactionDetails(item)}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.typeIcon, { 
            backgroundColor: type === 'credit' ? '#D1FAE5' : '#FEE2E2' 
          }]}>
            <Ionicons 
              name={type === 'credit' ? 'arrow-down' : 'arrow-up'} 
              size={20} 
              color={type === 'credit' ? '#10B981' : '#EF4444'} 
            />
          </View>
        </View>

        <View style={styles.cardMiddle}>
          <Text style={styles.transactionTitle} numberOfLines={1}>
            {item.description || item.purpose || "Transaction"}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.createdOn || item.createdAt)}
          </Text>
          {item.transactionId && (
            <Text style={styles.transactionId} numberOfLines={1}>
              ID: {item.transactionId}
            </Text>
          )}
        </View>

        <View style={styles.cardRight}>
          <Text style={[
            styles.transactionAmount,
            { color: type === 'credit' ? '#10B981' : '#EF4444' }
          ]}>
            {type === 'credit' ? '+' : '-'} {formatAmount(item.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status || "COMPLETED"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        typeFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setTypeFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        typeFilter === value && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterButton title="All" value="all" />
        <FilterButton title="Credits" value="credit" />
        <FilterButton title="Debits" value="debit" />
      </View>

      {/* Balance Summary */}
      <View style={styles.balanceSummary}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Total Credits</Text>
          <Text style={[styles.balanceValue, styles.creditText]}>
            ₹{transactions
              .filter(t => getTransactionType(t) === 'credit' && t.amount > 0)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0)
              .toLocaleString()
            }
          </Text>
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Total Debits</Text>
          <Text style={[styles.balanceValue, styles.debitText]}>
            ₹{transactions
              .filter(t => getTransactionType(t) === 'debit' && t.amount > 0)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0)
              .toLocaleString()
            }
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#42738fe3" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            {typeFilter === "all" 
              ? "You haven't made any transactions yet" 
              : `No ${typeFilter} transactions found`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransactionItem}
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

      {/* Transaction Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Transaction ID</Text>
                  <Text style={styles.modalValue}>
                    {selectedTransaction.transactionId || selectedTransaction.id}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Type</Text>
                  <View style={styles.modalTypeContainer}>
                    <View style={[styles.modalTypeIcon, { 
                      backgroundColor: getTransactionType(selectedTransaction) === 'credit' 
                        ? '#D1FAE5' : '#FEE2E2' 
                    }]}>
                      <Ionicons 
                        name={getTransactionType(selectedTransaction) === 'credit' 
                          ? 'arrow-down' : 'arrow-up'} 
                        size={20} 
                        color={getTransactionType(selectedTransaction) === 'credit' 
                          ? '#10B981' : '#EF4444'} 
                      />
                    </View>
                    <Text style={styles.modalTypeText}>
                      {getTransactionType(selectedTransaction) === 'credit' ? 'Credit' : 'Debit'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Amount</Text>
                  <Text style={[
                    styles.modalAmount,
                    { color: getTransactionType(selectedTransaction) === 'credit' 
                      ? '#10B981' : '#EF4444' 
                    }
                  ]}>
                    {getTransactionType(selectedTransaction) === 'credit' ? '+' : '-'} 
                    {formatAmount(selectedTransaction.amount)}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={[styles.modalStatusBadge, { 
                    backgroundColor: `${getStatusColor(selectedTransaction.status)}20` 
                  }]}>
                    <Text style={[styles.modalStatusText, { 
                      color: getStatusColor(selectedTransaction.status) 
                    }]}>
                      {selectedTransaction.status || "COMPLETED"}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Date & Time</Text>
                  <Text style={styles.modalValue}>
                    {formatDate(selectedTransaction.createdOn || selectedTransaction.createdAt)}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Description</Text>
                  <Text style={styles.modalValue}>
                    {selectedTransaction.description || 
                     selectedTransaction.purpose || 
                     selectedTransaction.remarks || 
                     "No description"}
                  </Text>
                </View>

                {selectedTransaction.paymentMethod && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Payment Method</Text>
                    <Text style={styles.modalValue}>
                      {selectedTransaction.paymentMethod}
                    </Text>
                  </View>
                )}

                {selectedTransaction.balanceAfter && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Balance After</Text>
                    <Text style={styles.modalValue}>
                      ₹{selectedTransaction.balanceAfter.toLocaleString()}
                    </Text>
                  </View>
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
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
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
  balanceSummary: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  creditText: {
    color: "#10B981",
  },
  debitText: {
    color: "#EF4444",
  },
  balanceDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
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
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardLeft: {
    marginRight: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardMiddle: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  transactionId: {
    fontSize: 10,
    color: "#999",
  },
  cardRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
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
  modalTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTypeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  modalTypeText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  modalAmount: {
    fontSize: 24,
    fontWeight: "bold",
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
});