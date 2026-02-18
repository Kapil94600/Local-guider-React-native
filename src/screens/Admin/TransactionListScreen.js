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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/apiClient"; // ✅ CORRECT PATH
import Papa from "papaparse";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function TransactionListScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchQuery, filter, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Uncomment when API is ready
      // const response = await api.get("/admin/transactions");
      // setTransactions(response.data);
      
      // Mock data for now
      const mockTransactions = [
        { 
          id: 1, 
          user: "John Doe", 
          email: "john@example.com",
          amount: 5000, 
          type: "credit", 
          status: "completed", 
          date: "2024-02-10", 
          method: "UPI",
          transactionId: "TXN001"
        },
        { 
          id: 2, 
          user: "Jane Smith", 
          email: "jane@example.com",
          amount: 3000, 
          type: "debit", 
          status: "pending", 
          date: "2024-02-09", 
          method: "Card",
          transactionId: "TXN002"
        },
        { 
          id: 3, 
          user: "Mike Johnson", 
          email: "mike@example.com",
          amount: 7500, 
          type: "credit", 
          status: "completed", 
          date: "2024-02-08", 
          method: "Bank Transfer",
          transactionId: "TXN003"
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
        Amount: trans.amount,
        Type: trans.type,
        Status: trans.status,
        Date: trans.date,
        Method: trans.method,
        'Transaction ID': trans.transactionId
      }));

      const csv = Papa.unparse(csvData);
      Alert.alert("Success", "CSV data ready for export");
      console.log(csv); // You can save this to a file
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
    >
      <View style={styles.transactionHeader}>
        <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.typeText}>
            {item.type === "credit" ? "+" : "-"}
          </Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.userName}>{item.user}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.transactionId}>ID: {item.transactionId}</Text>
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
        <Text style={styles.methodText}>{item.method}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity onPress={exportToCSV}>
          <Ionicons name="download-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* SEARCH AND FILTERS */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity 
            style={[styles.filterBtn, filter === "all" && styles.filterBtnActive]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterBtn, filter === "completed" && styles.filterBtnActive]}
            onPress={() => setFilter("completed")}
          >
            <Text style={[styles.filterText, filter === "completed" && styles.filterTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterBtn, filter === "pending" && styles.filterBtnActive]}
            onPress={() => setFilter("pending")}
          >
            <Text style={[styles.filterText, filter === "pending" && styles.filterTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterBtn, filter === "failed" && styles.filterBtnActive]}
            onPress={() => setFilter("failed")}
          >
            <Text style={[styles.filterText, filter === "failed" && styles.filterTextActive]}>
              Failed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* TRANSACTION LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubText}>Try changing your search or filter</Text>
            </View>
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </Text>
            </View>
          }
        />
      )}

      {/* TRANSACTION DETAILS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedTransaction && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.transactionId}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.user}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.email}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={[styles.detailValue, { 
                      color: getTypeColor(selectedTransaction.type),
                      fontWeight: "700" 
                    }]}>
                      {selectedTransaction.type === "credit" ? "+" : "-"}₹{selectedTransaction.amount.toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <View style={[styles.badge, { backgroundColor: getTypeColor(selectedTransaction.type) }]}>
                      <Text style={styles.badgeText}>
                        {selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(selectedTransaction.status) }]}>
                      <Text style={styles.badgeText}>
                        {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.method}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.date}</Text>
                  </View>
                </ScrollView>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.secondaryBtn]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.secondaryBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles remain the same as previous code...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#42738f",
    paddingTop: 40,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  toolbar: { padding: 16, backgroundColor: "#fff" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#1e293b" },
  filterScroll: { flexDirection: "row" },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: "#42738f" },
  filterText: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  listContainer: { padding: 16 },
  listHeader: { marginBottom: 12 },
  listHeaderText: { fontSize: 14, color: "#64748b" },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  typeText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  transactionInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
  userEmail: { fontSize: 14, color: "#64748b", marginBottom: 2 },
  transactionId: { fontSize: 12, color: "#94a3b8" },
  amountContainer: { alignItems: "flex-end" },
  amount: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  transactionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  methodText: { fontSize: 14, color: "#64748b" },
  dateText: { fontSize: 14, color: "#64748b" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#64748b", marginTop: 12 },
  emptySubText: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  modalContainer: {
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
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  modalBody: { padding: 20 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailLabel: { fontSize: 14, color: "#64748b", flex: 1 },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#1e293b", flex: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  secondaryBtn: { backgroundColor: "#f1f5f9" },
  secondaryBtnText: { color: "#64748b", fontWeight: "600" },
});