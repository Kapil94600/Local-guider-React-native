// src/screens/Admin/payments/AdminTransactions.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    FlatList,
    RefreshControl,
    Modal,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminTransactions({ navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all"); // all, success, pending, failed
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
            // Mock data
            const mockTransactions = [
                { 
                    id: 1, 
                    transactionId: "TXN001", 
                    user: "John Doe", 
                    email: "john@example.com",
                    type: "credit", 
                    amount: 5000, 
                    status: "success", 
                    date: "2024-02-10 14:30:00", 
                    method: "UPI",
                    description: "Wallet recharge",
                    userType: "Tourist"
                },
                { 
                    id: 2, 
                    transactionId: "TXN002", 
                    user: "Jane Smith", 
                    email: "jane@example.com",
                    type: "debit", 
                    amount: 3000, 
                    status: "success", 
                    date: "2024-02-09 11:20:00", 
                    method: "Credit Card",
                    description: "Tour booking payment",
                    userType: "Tourist"
                },
                { 
                    id: 3, 
                    transactionId: "TXN003", 
                    user: "Rahul Sharma", 
                    email: "rahul@example.com",
                    type: "credit", 
                    amount: 7500, 
                    status: "pending", 
                    date: "2024-02-08 09:15:00", 
                    method: "Bank Transfer",
                    description: "Guide earnings",
                    userType: "Tour Guide"
                },
                { 
                    id: 4, 
                    transactionId: "TXN004", 
                    user: "Priya Patel", 
                    email: "priya@example.com",
                    type: "debit", 
                    amount: 2000, 
                    status: "failed", 
                    date: "2024-02-07 16:45:00", 
                    method: "UPI",
                    description: "Photography booking",
                    userType: "Photographer"
                },
                { 
                    id: 5, 
                    transactionId: "TXN005", 
                    user: "Mike Johnson", 
                    email: "mike@example.com",
                    type: "credit", 
                    amount: 10000, 
                    status: "success", 
                    date: "2024-02-06 13:10:00", 
                    method: "Wallet",
                    description: "Package booking",
                    userType: "Tourist"
                },
                { 
                    id: 6, 
                    transactionId: "TXN006", 
                    user: "Sarah Williams", 
                    email: "sarah@example.com",
                    type: "debit", 
                    amount: 4500, 
                    status: "success", 
                    date: "2024-02-05 10:30:00", 
                    method: "Debit Card",
                    description: "Hotel booking",
                    userType: "Tourist"
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
                trans.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                trans.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setFilteredTransactions(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTransactions();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "success": return "#10B981";
            case "pending": return "#F59E0B";
            case "failed": return "#EF4444";
            default: return "#6B7280";
        }
    };

    const getTypeColor = (type) => {
        return type === "credit" ? "#10B981" : "#EF4444";
    };

    const getMethodIcon = (method) => {
        switch(method.toLowerCase()) {
            case "upi": return "phone-portrait-outline";
            case "credit card": return "card-outline";
            case "debit card": return "card-outline";
            case "bank transfer": return "business-outline";
            case "wallet": return "wallet-outline";
            default: return "cash-outline";
        }
    };

    const getTotalStats = () => {
        const total = transactions.length;
        const success = transactions.filter(t => t.status === "success").length;
        const pending = transactions.filter(t => t.status === "pending").length;
        const failed = transactions.filter(t => t.status === "failed").length;
        const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        return { total, success, pending, failed, totalAmount };
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
                    <Ionicons 
                        name={item.type === "credit" ? "arrow-down-circle" : "arrow-up-circle"} 
                        size={24} 
                        color="#fff" 
                    />
                </View>
                <View style={styles.transactionInfo}>
                    <Text style={styles.userName}>{item.user}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <View style={styles.transactionMeta}>
                        <Text style={styles.transactionId}>{item.transactionId}</Text>
                        <View style={[styles.userTypeBadge, { 
                            backgroundColor: item.userType === "Tour Guide" ? "#3B82F6" : 
                                           item.userType === "Photographer" ? "#8B5CF6" : "#10B981" 
                        }]}>
                            <Text style={styles.userTypeText}>{item.userType}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color: getTypeColor(item.type) }]}>
                        {item.type === "credit" ? "+" : "-"}₹{item.amount.toLocaleString()}
                    </Text>
                    <View style={styles.statusMethod}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                            <Text style={styles.statusText}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>
                        <View style={styles.methodTag}>
                            <Ionicons name={getMethodIcon(item.method)} size={14} color="#64748b" />
                            <Text style={styles.methodText}>{item.method}</Text>
                        </View>
                    </View>
                </View>
            </View>
            
            <View style={styles.transactionFooter}>
                <Text style={styles.descriptionText}>{item.description}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
            </View>
        </TouchableOpacity>
    );

    const stats = getTotalStats();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading transactions...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu-outline" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transactions</Text>
                <TouchableOpacity onPress={() => Alert.alert("Export", "Export feature coming soon")}>
                    <Ionicons name="download-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* QUICK STATS */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>₹{stats.totalAmount.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total Amount</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total Txns</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: "#10B981" }]}>{stats.success}</Text>
                    <Text style={styles.statLabel}>Successful</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: "#F59E0B" }]}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
            </View>

            {/* SEARCH AND FILTERS */}
            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search transactions..."
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
                            All ({stats.total})
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.filterBtn, filter === "success" && styles.filterBtnActive]}
                        onPress={() => setFilter("success")}
                    >
                        <Text style={[styles.filterText, filter === "success" && styles.filterTextActive]}>
                            Success ({stats.success})
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.filterBtn, filter === "pending" && styles.filterBtnActive]}
                        onPress={() => setFilter("pending")}
                    >
                        <Text style={[styles.filterText, filter === "pending" && styles.filterTextActive]}>
                            Pending ({stats.pending})
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.filterBtn, filter === "failed" && styles.filterBtnActive]}
                        onPress={() => setFilter("failed")}
                    >
                        <Text style={[styles.filterText, filter === "failed" && styles.filterTextActive]}>
                            Failed ({stats.failed})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* TRANSACTIONS LIST */}
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
                                    <View style={styles.modalTransaction}>
                                        <View style={[styles.modalTypeIndicator, { backgroundColor: getTypeColor(selectedTransaction.type) }]}>
                                            <Ionicons 
                                                name={selectedTransaction.type === "credit" ? "arrow-down-circle" : "arrow-up-circle"} 
                                                size={32} 
                                                color="#fff" 
                                            />
                                        </View>
                                        <Text style={styles.modalAmount}>
                                            {selectedTransaction.type === "credit" ? "+" : "-"}₹{selectedTransaction.amount.toLocaleString()}
                                        </Text>
                                        <Text style={styles.modalDescription}>{selectedTransaction.description}</Text>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Transaction Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Transaction ID</Text>
                                            <Text style={styles.detailValue}>{selectedTransaction.transactionId}</Text>
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
                                            <Text style={styles.detailLabel}>Type</Text>
                                            <View style={[styles.badge, { backgroundColor: getTypeColor(selectedTransaction.type) }]}>
                                                <Text style={styles.badgeText}>
                                                    {selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Payment Method</Text>
                                            <View style={styles.methodDetail}>
                                                <Ionicons name={getMethodIcon(selectedTransaction.method)} size={18} color="#64748b" />
                                                <Text style={styles.detailValue}>{selectedTransaction.method}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Date & Time</Text>
                                            <Text style={styles.detailValue}>{selectedTransaction.date}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>User Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>User Name</Text>
                                            <Text style={styles.detailValue}>{selectedTransaction.user}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Email</Text>
                                            <Text style={styles.detailValue}>{selectedTransaction.email}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>User Type</Text>
                                            <View style={[styles.badge, { 
                                                backgroundColor: selectedTransaction.userType === "Tour Guide" ? "#3B82F6" : 
                                                               selectedTransaction.userType === "Photographer" ? "#8B5CF6" : "#10B981" 
                                            }]}>
                                                <Text style={styles.badgeText}>{selectedTransaction.userType}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </ScrollView>
                                
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity 
                                        style={[styles.modalBtn, styles.secondaryBtn]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.secondaryBtnText}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.modalBtn, styles.primaryBtn]}
                                        onPress={() => {
                                            setModalVisible(false);
                                            Alert.alert("Receipt", "Receipt sent to user email");
                                        }}
                                    >
                                        <Text style={styles.primaryBtnText}>Send Receipt</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#42738f",
        paddingTop: 40,
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#fff" 
    },
    statsContainer: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#fff",
    },
    statCard: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 12,
    },
    statValue: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#1e293b",
        marginBottom: 4,
    },
    statLabel: { 
        fontSize: 12, 
        color: "#64748b" 
    },
    toolbar: { 
        padding: 16, 
        backgroundColor: "#fff" 
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    searchInput: { 
        flex: 1, 
        marginLeft: 8, 
        fontSize: 16, 
        color: "#1e293b" 
    },
    filterScroll: { 
        flexDirection: "row" 
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        marginRight: 8,
    },
    filterBtnActive: { 
        backgroundColor: "#42738f" 
    },
    filterText: { 
        fontSize: 14, 
        color: "#64748b", 
        fontWeight: "500" 
    },
    filterTextActive: { 
        color: "#fff" 
    },
    listContainer: { 
        padding: 16 
    },
    listHeader: { 
        marginBottom: 12 
    },
    listHeaderText: { 
        fontSize: 14, 
        color: "#64748b" 
    },
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
        marginBottom: 12,
    },
    typeIndicator: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    transactionInfo: { 
        flex: 1 
    },
    userName: { 
        fontSize: 16, 
        fontWeight: "600", 
        color: "#1e293b", 
        marginBottom: 2 
    },
    userEmail: { 
        fontSize: 14, 
        color: "#64748b", 
        marginBottom: 6 
    },
    transactionMeta: {
        flexDirection: "row",
        alignItems: "center",
    },
    transactionId: { 
        fontSize: 12, 
        color: "#94a3b8", 
        marginRight: 8 
    },
    userTypeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    userTypeText: { 
        fontSize: 10, 
        fontWeight: "600", 
        color: "#fff" 
    },
    amountContainer: { 
        alignItems: "flex-end" 
    },
    amount: { 
        fontSize: 18, 
        fontWeight: "700", 
        marginBottom: 6 
    },
    statusMethod: {
        alignItems: "flex-end",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginBottom: 4,
    },
    statusText: { 
        fontSize: 11, 
        fontWeight: "600", 
        color: "#fff" 
    },
    methodTag: {
        flexDirection: "row",
        alignItems: "center",
    },
    methodText: { 
        fontSize: 12, 
        color: "#64748b", 
        marginLeft: 4 
    },
    transactionFooter: {
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 12,
    },
    descriptionText: { 
        fontSize: 14, 
        color: "#475569", 
        marginBottom: 4 
    },
    dateText: { 
        fontSize: 12, 
        color: "#94a3b8" 
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: { 
        fontSize: 18, 
        fontWeight: "600", 
        color: "#64748b", 
        marginTop: 12 
    },
    emptySubText: { 
        fontSize: 14, 
        color: "#94a3b8", 
        marginTop: 4 
    },
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
    modalTitle: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#1e293b" 
    },
    modalBody: { 
        padding: 20 
    },
    modalTransaction: {
        alignItems: "center",
        marginBottom: 24,
    },
    modalTypeIndicator: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    modalAmount: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 8,
    },
    modalDescription: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
    },
    detailSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f8fafc",
    },
    detailLabel: { 
        fontSize: 14, 
        color: "#64748b", 
        flex: 1 
    },
    detailValue: { 
        fontSize: 14, 
        fontWeight: "600", 
        color: "#1e293b", 
        flex: 2, 
        textAlign: "right" 
    },
    methodDetail: {
        flexDirection: "row",
        alignItems: "center",
        flex: 2,
        justifyContent: "flex-end",
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    badgeText: { 
        fontSize: 12, 
        fontWeight: "600", 
        color: "#fff" 
    },
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
    primaryBtn: { 
        backgroundColor: "#42738f" 
    },
    primaryBtnText: { 
        color: "#fff", 
        fontWeight: "600" 
    },
    secondaryBtn: { 
        backgroundColor: "#f1f5f9" 
    },
    secondaryBtnText: { 
        color: "#64748b", 
        fontWeight: "600" 
    },
});