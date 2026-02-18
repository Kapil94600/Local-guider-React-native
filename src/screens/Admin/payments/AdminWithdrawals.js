// src/screens/Admin/payments/AdminWithdrawals.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Modal,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // ✅ CORRECT IMPORT

export default function AdminWithdrawals({ navigation }) {
    const [withdrawals, setWithdrawals] = useState([]);
    const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("all"); // all, pending, approved, rejected, completed
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    useEffect(() => {
        filterWithdrawals();
    }, [filter, withdrawals]);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            // Mock data
            const mockWithdrawals = [
                { 
                    id: 1, 
                    withdrawalId: "WD001", 
                    user: "Rahul Sharma", 
                    userType: "Tour Guide",
                    email: "rahul@example.com",
                    amount: 15000, 
                    requestedDate: "2024-02-10", 
                    method: "Bank Transfer",
                    accountNumber: "XXXXXX1234",
                    ifscCode: "HDFC0001234",
                    status: "pending", 
                    totalEarnings: 45000,
                    pendingBalance: 15000,
                    notes: "First withdrawal request"
                },
                { 
                    id: 2, 
                    withdrawalId: "WD002", 
                    user: "Priya Patel", 
                    userType: "Photographer",
                    email: "priya@example.com",
                    amount: 12000, 
                    requestedDate: "2024-02-09", 
                    method: "UPI",
                    upiId: "priyapatel@upi",
                    status: "approved", 
                    totalEarnings: 35000,
                    pendingBalance: 0,
                    notes: "Monthly earnings withdrawal"
                },
                { 
                    id: 3, 
                    withdrawalId: "WD003", 
                    user: "Amit Kumar", 
                    userType: "Tour Guide",
                    email: "amit@example.com",
                    amount: 9500, 
                    requestedDate: "2024-02-08", 
                    method: "Bank Transfer",
                    accountNumber: "XXXXXX5678",
                    ifscCode: "ICIC0005678",
                    status: "rejected", 
                    totalEarnings: 28000,
                    pendingBalance: 9500,
                    notes: "Bank details incorrect"
                },
                { 
                    id: 4, 
                    withdrawalId: "WD004", 
                    user: "Sneha Singh", 
                    userType: "Photographer",
                    email: "sneha@example.com",
                    amount: 8000, 
                    requestedDate: "2024-02-07", 
                    method: "UPI",
                    upiId: "snehasingh@okhdfc",
                    status: "completed", 
                    totalEarnings: 22000,
                    pendingBalance: 0,
                    notes: "Withdrawal processed successfully"
                },
                { 
                    id: 5, 
                    withdrawalId: "WD005", 
                    user: "Rajesh Verma", 
                    userType: "Tour Guide",
                    email: "rajesh@example.com",
                    amount: 7500, 
                    requestedDate: "2024-02-06", 
                    method: "Bank Transfer",
                    accountNumber: "XXXXXX9012",
                    ifscCode: "SBIN0009012",
                    status: "pending", 
                    totalEarnings: 20000,
                    pendingBalance: 7500,
                    notes: "Emergency withdrawal"
                },
            ];
            
            setWithdrawals(mockWithdrawals);
            setFilteredWithdrawals(mockWithdrawals);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            Alert.alert("Error", "Failed to load withdrawal requests");
        } finally {
            setLoading(false);
        }
    };

    const filterWithdrawals = () => {
        let filtered = [...withdrawals];
        
        if (filter !== "all") {
            filtered = filtered.filter(withdrawal => withdrawal.status === filter);
        }
        
        setFilteredWithdrawals(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWithdrawals();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "#F59E0B";
            case "approved": return "#10B981";
            case "rejected": return "#EF4444";
            case "completed": return "#3B82F6";
            default: return "#6B7280";
        }
    };

    const handleWithdrawalAction = (action, withdrawalId) => {
        const actionText = action === "approve" ? "approve" : "reject";
        
        Alert.alert(
            `Confirm ${action === "approve" ? "Approval" : "Rejection"}`,
            `Are you sure you want to ${actionText} this withdrawal request?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: action === "approve" ? "Approve" : "Reject", 
                    style: action === "approve" ? "default" : "destructive",
                    onPress: () => {
                        // Update status
                        setWithdrawals(prev => prev.map(withdrawal => 
                            withdrawal.id === withdrawalId ? { 
                                ...withdrawal, 
                                status: action === "approve" ? "approved" : "rejected",
                                pendingBalance: action === "approve" ? 0 : withdrawal.pendingBalance
                            } : withdrawal
                        ));
                        Alert.alert("Success", `Withdrawal request ${actionText}d`);
                    }
                }
            ]
        );
    };

    const handleProcessPayment = (withdrawalId) => {
        Alert.alert(
            "Process Payment",
            "Initiate payment transfer to service provider?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Process", 
                    style: "default",
                    onPress: () => {
                        // Update status to completed
                        setWithdrawals(prev => prev.map(withdrawal => 
                            withdrawal.id === withdrawalId ? { 
                                ...withdrawal, 
                                status: "completed"
                            } : withdrawal
                        ));
                        Alert.alert("Success", "Payment processed successfully");
                    }
                }
            ]
        );
    };

    const renderWithdrawalItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.withdrawalCard}
            onPress={() => {
                setSelectedWithdrawal(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.withdrawalHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.withdrawalInfo}>
                    <Text style={styles.withdrawalId}>{item.withdrawalId}</Text>
                    <Text style={styles.userName}>{item.user}</Text>
                    <Text style={styles.userType}>{item.userType}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.withdrawalDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>Requested: {item.requestedDate}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="wallet-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>Method: {item.method}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={14} color="#64748b" />
                    <Text style={styles.detailText}>Total Earnings: ₹{item.totalEarnings.toLocaleString()}</Text>
                </View>
            </View>
            
            {item.status === "pending" && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleWithdrawalAction("reject", item.id)}
                    >
                        <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleWithdrawalAction("approve", item.id)}
                    >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                        <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {item.status === "approved" && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.processBtn]}
                        onPress={() => handleProcessPayment(item.id)}
                    >
                        <Ionicons name="cash-outline" size={16} color="#fff" />
                        <Text style={styles.processBtnText}>Process Payment</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const getStats = () => {
        const total = withdrawals.length;
        const pending = withdrawals.filter(w => w.status === "pending").length;
        const approved = withdrawals.filter(w => w.status === "approved").length;
        const rejected = withdrawals.filter(w => w.status === "rejected").length;
        const completed = withdrawals.filter(w => w.status === "completed").length;
        const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        const pendingAmount = withdrawals.filter(w => w.status === "pending").reduce((sum, w) => sum + w.amount, 0);
        
        return { total, pending, approved, rejected, completed, totalAmount, pendingAmount };
    };

    const stats = getStats();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading withdrawal requests...</Text>
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
                <Text style={styles.headerTitle}>Withdrawal Requests</Text>
                <TouchableOpacity>
                    <Ionicons name="filter-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* QUICK STATS */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Total Requests</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: "#F59E0B" }]}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>₹{stats.pendingAmount.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Pending Amount</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: "#10B981" }]}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
            </View>

            {/* FILTERS */}
            <View style={styles.filterContainer}>
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
                        style={[styles.filterBtn, filter === "pending" && styles.filterBtnActive]}
                        onPress={() => setFilter("pending")}
                    >
                        <Text style={[styles.filterText, filter === "pending" && styles.filterTextActive]}>
                            Pending ({stats.pending})
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.filterBtn, filter === "approved" && styles.filterBtnActive]}
                        onPress={() => setFilter("approved")}
                    >
                        <Text style={[styles.filterText, filter === "approved" && styles.filterTextActive]}>
                            Approved ({stats.approved})
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.filterBtn, filter === "completed" && styles.filterBtnActive]}
                        onPress={() => setFilter("completed")}
                    >
                        <Text style={[styles.filterText, filter === "completed" && styles.filterTextActive]}>
                            Completed ({stats.completed})
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.filterBtn, filter === "rejected" && styles.filterBtnActive]}
                        onPress={() => setFilter("rejected")}
                    >
                        <Text style={[styles.filterText, filter === "rejected" && styles.filterTextActive]}>
                            Rejected ({stats.rejected})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* WITHDRAWALS LIST */}
            <FlatList
                data={filteredWithdrawals}
                renderItem={renderWithdrawalItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-circle-outline" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No withdrawal requests found</Text>
                        <Text style={styles.emptySubText}>All withdrawals are processed</Text>
                    </View>
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.listHeaderText}>
                            Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawal requests
                        </Text>
                    </View>
                }
            />

            {/* WITHDRAWAL DETAILS MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {selectedWithdrawal && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Withdrawal Details</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView style={styles.modalBody}>
                                    <View style={styles.modalWithdrawalHeader}>
                                        <View style={[styles.modalStatusIndicator, { backgroundColor: getStatusColor(selectedWithdrawal.status) }]} />
                                        <View style={styles.modalWithdrawalInfo}>
                                            <Text style={styles.modalWithdrawalId}>{selectedWithdrawal.withdrawalId}</Text>
                                            <Text style={styles.modalUserName}>{selectedWithdrawal.user}</Text>
                                            <Text style={styles.modalAmount}>₹{selectedWithdrawal.amount.toLocaleString()}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Withdrawal Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Status</Text>
                                            <View style={[styles.badge, { backgroundColor: getStatusColor(selectedWithdrawal.status) }]}>
                                                <Text style={styles.badgeText}>
                                                    {selectedWithdrawal.status.charAt(0).toUpperCase() + selectedWithdrawal.status.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Requested Date</Text>
                                            <Text style={styles.detailValue}>{selectedWithdrawal.requestedDate}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Withdrawal Method</Text>
                                            <Text style={styles.detailValue}>{selectedWithdrawal.method}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>User Type</Text>
                                            <Text style={styles.detailValue}>{selectedWithdrawal.userType}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Payment Details</Text>
                                        {selectedWithdrawal.method === "Bank Transfer" ? (
                                            <>
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>Account Number</Text>
                                                    <Text style={styles.detailValue}>{selectedWithdrawal.accountNumber}</Text>
                                                </View>
                                                
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>IFSC Code</Text>
                                                    <Text style={styles.detailValue}>{selectedWithdrawal.ifscCode}</Text>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>UPI ID</Text>
                                                <Text style={styles.detailValue}>{selectedWithdrawal.upiId}</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Earnings Summary</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Total Earnings</Text>
                                            <Text style={[styles.detailValue, { color: "#10B981", fontWeight: "700" }]}>
                                                ₹{selectedWithdrawal.totalEarnings.toLocaleString()}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Withdrawal Amount</Text>
                                            <Text style={[styles.detailValue, { color: "#3B82F6", fontWeight: "700" }]}>
                                                ₹{selectedWithdrawal.amount.toLocaleString()}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Pending Balance</Text>
                                            <Text style={[styles.detailValue, { color: selectedWithdrawal.pendingBalance > 0 ? "#F59E0B" : "#10B981", fontWeight: "700" }]}>
                                                ₹{selectedWithdrawal.pendingBalance.toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>User Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Name</Text>
                                            <Text style={styles.detailValue}>{selectedWithdrawal.user}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Email</Text>
                                            <Text style={styles.detailValue}>{selectedWithdrawal.email}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Admin Notes</Text>
                                            <Text style={styles.detailValue}>{selectedWithdrawal.notes}</Text>
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
                                    
                                    {selectedWithdrawal.status === "pending" && (
                                        <>
                                            <TouchableOpacity 
                                                style={[styles.modalBtn, styles.rejectModalBtn]}
                                                onPress={() => {
                                                    handleWithdrawalAction("reject", selectedWithdrawal.id);
                                                    setModalVisible(false);
                                                }}
                                            >
                                                <Text style={styles.rejectModalBtnText}>Reject</Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                style={[styles.modalBtn, styles.approveModalBtn]}
                                                onPress={() => {
                                                    handleWithdrawalAction("approve", selectedWithdrawal.id);
                                                    setModalVisible(false);
                                                }}
                                            >
                                                <Text style={styles.approveModalBtnText}>Approve</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    
                                    {selectedWithdrawal.status === "approved" && (
                                        <TouchableOpacity 
                                            style={[styles.modalBtn, styles.processModalBtn]}
                                            onPress={() => {
                                                handleProcessPayment(selectedWithdrawal.id);
                                                setModalVisible(false);
                                            }}
                                        >
                                            <Text style={styles.processModalBtnText}>Process Payment</Text>
                                        </TouchableOpacity>
                                    )}
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
        backgroundColor: "#3B82F6",
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
    filterContainer: {
        padding: 16,
        backgroundColor: "#fff",
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
        backgroundColor: "#3B82F6" 
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
    withdrawalCard: {
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
    withdrawalHeader: {
        flexDirection: "row",
        marginBottom: 12,
    },
    statusIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    withdrawalInfo: { 
        flex: 1 
    },
    withdrawalId: { 
        fontSize: 14, 
        fontWeight: "600", 
        color: "#1e293b", 
        marginBottom: 2 
    },
    userName: { 
        fontSize: 16, 
        fontWeight: "700", 
        color: "#1e293b", 
        marginBottom: 4 
    },
    userType: { 
        fontSize: 12, 
        color: "#64748b" 
    },
    amountContainer: { 
        alignItems: "flex-end" 
    },
    amountText: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#1e293b", 
        marginBottom: 6 
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    statusText: { 
        fontSize: 11, 
        fontWeight: "600", 
        color: "#fff" 
    },
    withdrawalDetails: {
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailText: { 
        fontSize: 13, 
        color: "#64748b", 
        marginLeft: 6 
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
    },
    rejectBtn: { 
        backgroundColor: "#FEE2E2" 
    },
    rejectBtnText: { 
        color: "#DC2626", 
        fontWeight: "600", 
        marginLeft: 6 
    },
    approveBtn: { 
        backgroundColor: "#D1FAE5" 
    },
    approveBtnText: { 
        color: "#059669", 
        fontWeight: "600", 
        marginLeft: 6 
    },
    processBtn: {
        backgroundColor: "#3B82F6",
    },
    processBtnText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 6,
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
    modalWithdrawalHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    modalStatusIndicator: {
        width: 6,
        height: 50,
        borderRadius: 3,
        marginRight: 16,
    },
    modalWithdrawalInfo: {
        flex: 1,
    },
    modalWithdrawalId: { 
        fontSize: 16, 
        fontWeight: "600", 
        color: "#64748b", 
        marginBottom: 4 
    },
    modalUserName: { 
        fontSize: 20, 
        fontWeight: "700", 
        color: "#1e293b", 
        marginBottom: 4 
    },
    modalAmount: { 
        fontSize: 24, 
        fontWeight: "700", 
        color: "#3B82F6" 
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
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginHorizontal: 4,
    },
    secondaryBtn: { 
        backgroundColor: "#f1f5f9", 
        flex: 1 
    },
    secondaryBtnText: { 
        color: "#64748b", 
        fontWeight: "600" 
    },
    rejectModalBtn: {
        backgroundColor: "#FEE2E2",
        flex: 1,
    },
    rejectModalBtnText: {
        color: "#DC2626",
        fontWeight: "600",
    },
    approveModalBtn: {
        backgroundColor: "#D1FAE5",
        flex: 1,
    },
    approveModalBtnText: {
        color: "#059669",
        fontWeight: "600",
    },
    processModalBtn: {
        backgroundColor: "#3B82F6",
        flex: 2,
    },
    processModalBtnText: {
        color: "#fff",
        fontWeight: "600",
    },
});