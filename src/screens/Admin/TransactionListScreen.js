import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  FlatList,
  Modal,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";
import Papa from "papaparse";

const { width } = Dimensions.get("window");

export default function TransactionListScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
    calculateStats();
  }, [searchQuery, filter, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Mock data with more realistic values
      const mockTransactions = [
        { 
          id: 1, 
          user: "Rahul Sharma", 
          email: "rahul@example.com",
          amount: 5000, 
          type: "credit", 
          status: "completed", 
          date: "2024-02-10", 
          method: "UPI",
          transactionId: "TXN001",
          time: "10:30 AM"
        },
        { 
          id: 2, 
          user: "Priya Patel", 
          email: "priya@example.com",
          amount: 3000, 
          type: "debit", 
          status: "pending", 
          date: "2024-02-09", 
          method: "Card",
          transactionId: "TXN002",
          time: "02:15 PM"
        },
        { 
          id: 3, 
          user: "Amit Kumar", 
          email: "amit@example.com",
          amount: 7500, 
          type: "credit", 
          status: "completed", 
          date: "2024-02-08", 
          method: "Bank Transfer",
          transactionId: "TXN003",
          time: "11:45 AM"
        },
        { 
          id: 4, 
          user: "Neha Singh", 
          email: "neha@example.com",
          amount: 2000, 
          type: "debit", 
          status: "failed", 
          date: "2024-02-07", 
          method: "UPI",
          transactionId: "TXN004",
          time: "09:20 AM"
        },
        { 
          id: 5, 
          user: "Vikram Mehta", 
          email: "vikram@example.com",
          amount: 10000, 
          type: "credit", 
          status: "completed", 
          date: "2024-02-06", 
          method: "Bank Transfer",
          transactionId: "TXN005",
          time: "04:30 PM"
        },
      ];
      
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Alert.alert("Error", "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats = {
      total: transactions.length,
      completed: transactions.filter(t => t.status === "completed").length,
      pending: transactions.filter(t => t.status === "pending").length,
      failed: transactions.filter(t => t.status === "failed").length,
    };
    setStats(stats);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    if (filter !== "all") {
      filtered = filtered.filter(trans => trans.status === filter);
    }
    
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(trans =>
        trans.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trans.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trans.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trans.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const exportToCSV = () => {
    try {
      const csvData = filteredTransactions.map(trans => ({
        ID: trans.id,
        User: trans.user,
        Email: trans.email,
        Amount: `₹${trans.amount}`,
        Type: trans.type,
        Status: trans.status,
        Date: trans.date,
        Time: trans.time,
        Method: trans.method,
        'Transaction ID': trans.transactionId
      }));

      const csv = Papa.unparse(csvData);
      Alert.alert("Success", "CSV data ready for export");
      console.log(csv);
    } catch (error) {
      Alert.alert("Error", "Failed to export data");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "#10B981";
      case "pending": return "#F59E0B";
      case "failed": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getTypeColor = (type) => {
    return type === "credit" ? "#10B981" : "#EF4444";
  };

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionCard}
      onPress={() => {
        setSelectedTransaction(item);
        setModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.cardGradient}
      >
        <View style={styles.transactionHeader}>
          <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]}>
            <Text style={styles.typeText}>
              {item.type === "credit" ? "↑" : "↓"}
            </Text>
          </View>
          
          <View style={styles.transactionInfo}>
            <Text style={styles.userName}>{item.user}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.transactionMeta}>
              <Text style={styles.transactionId}>{item.transactionId}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.methodText}>{item.method}</Text>
            </View>
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, { color: getTypeColor(item.type) }]}>
              {item.type === "credit" ? "+" : "-"}₹{item.amount.toLocaleString()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.transactionFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
            <Text style={styles.footerText}>{item.date}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />
            <Text style={styles.footerText}>{item.time}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER WITH GRADIENT AND BACK ARROW */}
      <LinearGradient
        colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Transaction History</Text>
          
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={exportToCSV}
          >
            <Ionicons name="download-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* STATS CARDS */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
        >
          {renderStatCard("Total", stats.total, "swap-horizontal", "#fff")}
          {renderStatCard("Completed", stats.completed, "checkmark-circle", "#10B981")}
          {renderStatCard("Pending", stats.pending, "time", "#F59E0B")}
          {renderStatCard("Failed", stats.failed, "close-circle", "#EF4444")}
        </ScrollView>
      </LinearGradient>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        {/* SEARCH AND FILTERS */}
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email or ID..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {["all", "completed", "pending", "failed"].map((filterType) => (
              <TouchableOpacity 
                key={filterType}
                style={[
                  styles.filterBtn, 
                  filter === filterType && styles.filterBtnActive
                ]}
                onPress={() => setFilter(filterType)}
              >
                <Text style={[
                  styles.filterText, 
                  filter === filterType && styles.filterTextActive
                ]}>
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* TRANSACTION LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={['#1e3c4f', '#2c5a73']}
              style={styles.loadingCircle}
            >
              <Ionicons name="repeat-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id.toString()}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#2c5a73']}
                tintColor="#2c5a73"
              />
            }
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={['#1e3c4f', '#2c5a73']}
                  style={styles.emptyIcon}
                >
                  <Ionicons name="receipt-outline" size={40} color="#fff" />
                </LinearGradient>
                <Text style={styles.emptyText}>No transactions found</Text>
                <Text style={styles.emptySubText}>Try changing your search or filter</Text>
              </View>
            }
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  Showing <Text style={styles.highlightText}>{filteredTransactions.length}</Text> of {transactions.length} transactions
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* TRANSACTION DETAILS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTransaction && (
              <>
                <LinearGradient
                  colors={['#1e3c4f', '#2c5a73']}
                  style={styles.modalHeader}
                >
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalTransactionId}>
                    <Text style={styles.modalIdLabel}>Transaction ID</Text>
                    <Text style={styles.modalIdValue}>{selectedTransaction.transactionId}</Text>
                  </View>

                  <View style={styles.modalUserInfo}>
                    <View style={styles.modalUserAvatar}>
                      <Text style={styles.modalUserInitial}>
                        {selectedTransaction.user.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.modalUserDetails}>
                      <Text style={styles.modalUserName}>{selectedTransaction.user}</Text>
                      <Text style={styles.modalUserEmail}>{selectedTransaction.email}</Text>
                    </View>
                  </View>

                  <View style={styles.modalAmountCard}>
                    <Text style={styles.modalAmountLabel}>Amount</Text>
                    <Text style={[
                      styles.modalAmountValue, 
                      { color: getTypeColor(selectedTransaction.type) }
                    ]}>
                      {selectedTransaction.type === "credit" ? "+" : "-"}₹{selectedTransaction.amount.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.modalDetailsGrid}>
                    <View style={styles.modalDetailItem}>
                      <Ionicons name="swap-horizontal" size={20} color="#2c5a73" />
                      <Text style={styles.modalDetailLabel}>Type</Text>
                      <View style={[styles.modalDetailBadge, { backgroundColor: getTypeColor(selectedTransaction.type) }]}>
                        <Text style={styles.modalDetailBadgeText}>
                          {selectedTransaction.type}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#2c5a73" />
                      <Text style={styles.modalDetailLabel}>Status</Text>
                      <View style={[styles.modalDetailBadge, { backgroundColor: getStatusColor(selectedTransaction.status) }]}>
                        <Text style={styles.modalDetailBadgeText}>
                          {selectedTransaction.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalDetailItem}>
                      <Ionicons name="card" size={20} color="#2c5a73" />
                      <Text style={styles.modalDetailLabel}>Method</Text>
                      <Text style={styles.modalDetailValue}>{selectedTransaction.method}</Text>
                    </View>

                    <View style={styles.modalDetailItem}>
                      <Ionicons name="calendar" size={20} color="#2c5a73" />
                      <Text style={styles.modalDetailLabel}>Date</Text>
                      <Text style={styles.modalDetailValue}>{selectedTransaction.date}</Text>
                    </View>

                    <View style={styles.modalDetailItem}>
                      <Ionicons name="time" size={20} color="#2c5a73" />
                      <Text style={styles.modalDetailLabel}>Time</Text>
                      <Text style={styles.modalDetailValue}>{selectedTransaction.time}</Text>
                    </View>
                  </View>
                </ScrollView>
              </>
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
    backgroundColor: "#f8fafc" 
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#1e3c4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#fff",
    letterSpacing: 0.5,
  },
  statsScroll: {
    paddingLeft: 16,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    borderLeftWidth: 3,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  toolbar: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 8, 
    fontSize: 15, 
    color: "#1e293b",
    paddingVertical: 8,
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterBtnActive: { 
    backgroundColor: "#2c5a73",
    borderColor: "#2c5a73",
  },
  filterText: { 
    fontSize: 13, 
    color: "#64748b", 
    fontWeight: "500" 
  },
  filterTextActive: { 
    color: "#fff" 
  },
  listContainer: { 
    padding: 16,
    paddingTop: 8,
  },
  listHeader: { 
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listHeaderText: { 
    fontSize: 13, 
    color: "#64748b",
  },
  highlightText: {
    color: "#2c5a73",
    fontWeight: "600",
  },
  transactionCard: {
    borderRadius: 16,
    marginBottom: 12,
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
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeText: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#fff" 
  },
  transactionInfo: { 
    flex: 1 
  },
  userName: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#1e293b", 
    marginBottom: 4 
  },
  userEmail: { 
    fontSize: 13, 
    color: "#64748b", 
    marginBottom: 4 
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionId: { 
    fontSize: 12, 
    color: "#94a3b8",
    fontWeight: "500",
  },
  dot: {
    color: "#94a3b8",
    marginHorizontal: 4,
  },
  methodText: { 
    fontSize: 12, 
    color: "#94a3b8",
  },
  amountContainer: { 
    alignItems: "flex-end" 
  },
  amount: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 6 
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: "600", 
    color: "#fff" 
  },
  transactionFooter: {
    flexDirection: "row",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#2c5a73", 
    marginTop: 12 
  },
  emptySubText: { 
    fontSize: 14, 
    color: "#94a3b8", 
    marginTop: 4 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(30, 60, 79, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#1e3c4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#fff",
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { 
    padding: 20 
  },
  modalTransactionId: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalIdLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  modalIdValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    letterSpacing: 1,
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2c5a73",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalUserInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  modalUserDetails: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  modalUserEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  modalAmountCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  modalAmountLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  modalAmountValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  modalDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  modalDetailItem: {
    width: "50%",
    padding: 6,
    marginBottom: 12,
  },
  modalDetailLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  modalDetailBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  modalDetailBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});