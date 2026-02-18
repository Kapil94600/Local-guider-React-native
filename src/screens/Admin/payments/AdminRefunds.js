// src/screens/Admin/payments/AdminRefunds.js
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
import { Ionicons } from "@expo/vector-icons";

export default function AdminRefunds({ navigation }) {
    const [refunds, setRefunds] = useState([]);
    const [filteredRefunds, setFilteredRefunds] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("all"); // all, pending, approved, rejected, completed
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRefunds();
    }, []);

    useEffect(() => {
        filterRefunds();
    }, [filter, refunds]);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            // Mock data
            const mockRefunds = [
                { 
                    id: 1, 
                    refundId: "REF001", 
                    user: "John Doe", 
                    email: "john@example.com",
                    bookingId: "BK001", 
                    amount: 2500, 
                    reason: "Booking cancelled by customer",
                    status: "pending", 
                    requestedDate: "2024-02-10", 
                    bookingDate: "2024-02-15",
                    bookingType: "Tour Guide",
                    paymentMethod: "UPI",
                    notes: "Customer requested full refund"
                },
                { 
                    id: 2, 
                    refundId: "REF002", 
                    user: "Jane Smith", 
                    email: "jane@example.com",
                    bookingId: "BK002", 
                    amount: 3000, 
                    reason: "Service not provided as described",
                    status: "approved", 
                    requestedDate: "2024-02-09", 
                    bookingDate: "2024-02-14",
                    bookingType: "Photographer",
                    paymentMethod: "Credit Card",
                    notes: "Photographer didn't show up"
                },
                { 
                    id: 3, 
                    refundId: "REF003", 
                    user: "Mike Johnson", 
                    email: "mike@example.com",
                    bookingId: "BK003", 
                    amount: 15000, 
                    reason: "Tour package cancelled due to weather",
                    status: "rejected", 
                    requestedDate: "2024-02-08", 
                    bookingDate: "2024-02-20",
                    bookingType: "Tour Package",
                    paymentMethod: "Bank Transfer",
                    notes: "Weather conditions, policy applies"
                },
                { 
                    id: 4, 
                    refundId: "REF004", 
                    user: "Sarah Williams", 
                    email: "sarah@example.com",
                    bookingId: "BK004", 
                    amount: 8000, 
                    reason: "Hotel booking double charged",
                    status: "completed", 
                    requestedDate: "2024-02-07", 
                    bookingDate: "2024-02-12",
                    bookingType: "Hotel Booking",
                    paymentMethod: "Wallet",
                    notes: "Refund processed successfully"
                },
                { 
                    id: 5, 
                    refundId: "REF005", 
                    user: "Robert Brown", 
                    email: "robert@example.com",
                    bookingId: "BK005", 
                    amount: 1200, 
                    reason: "Changed travel plans",
                    status: "pending", 
                    requestedDate: "2024-02-06", 
                    bookingDate: "2024-02-18",
                    bookingType: "Transport",
                    paymentMethod: "Debit Card",
                    notes: "Customer needs to cancel"
                },
            ];
            
            setRefunds(mockRefunds);
            setFilteredRefunds(mockRefunds);
        } catch (error) {
            console.error("Error fetching refunds:", error);
            Alert.alert("Error", "Failed to load refund requests");
        } finally {
            setLoading(false);
        }
    };

    const filterRefunds = () => {
        let filtered = [...refunds];
        
        if (filter !== "all") {
            filtered = filtered.filter(refund => refund.status === filter);
        }
        
        setFilteredRefunds(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRefunds();
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

    const handleRefundAction = (action, refundId) => {
        const actionText = action === "approve" ? "approve" : "reject";
        
        Alert.alert(
            `Confirm ${action === "approve" ? "Approval" : "Rejection"}`,
            `Are you sure you want to ${actionText} this refund request?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: action === "approve" ? "Approve" : "Reject", 
                    style: action === "approve" ? "default" : "destructive",
                    onPress: () => {
                        // Update status
                        setRefunds(prev => prev.map(refund => 
                            refund.id === refundId ? { ...refund, status: action === "approve" ? "approved" : "rejected" } : refund
                        ));
                        Alert.alert("Success", `Refund request ${actionText}d`);
                    }
                }
            ]
        );
    };

    const renderRefundItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.refundCard}
            onPress={() => {
                setSelectedRefund(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.refundHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.refundInfo}>
                    <Text style={styles.refundId}>{item.refundId}</Text>
                    <Text style={styles.userName}>{item.user}</Text>
                    <Text style={styles.bookingType}>{item.bookingType}</Text>
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
            
            <View style={styles.refundDetails}>
                <Text style={styles.reasonText} numberOfLines={2}>
                    <Text style={styles.detailLabel}>Reason: </Text>
                    {item.reason}
                </Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailText}>Requested: {item.requestedDate}</Text>
                    <Text style={styles.detailText}>Booking: {item.bookingDate}</Text>
                </View>
            </View>
            
            {item.status === "pending" && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleRefundAction("reject", item.id)}
                    >
                        <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleRefundAction("approve", item.id)}
                    >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                        <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    const getStats = () => {
        const total = refunds.length;
        const pending = refunds.filter(r => r.status === "pending").length;
        const approved = refunds.filter(r => r.status === "approved").length;
        const rejected = refunds.filter(r => r.status === "rejected").length;
        const completed = refunds.filter(r => r.status === "completed").length;
        const totalAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
        const pendingAmount = refunds.filter(r => r.status === "pending").reduce((sum, r) => sum + r.amount, 0);
        
        return { total, pending, approved, rejected, completed, totalAmount, pendingAmount };
    };

    const stats = getStats();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading refund requests...</Text>
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
                <Text style={styles.headerTitle}>Refund Requests</Text>
                <TouchableOpacity>
                    <Ionicons name="stats-chart-outline" size={24} color="#fff" />
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
                    <Text style={[styles.statValue, { color: "#10B981" }]}>{stats.approved}</Text>
                    <Text style={styles.statLabel}>Approved</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>₹{stats.pendingAmount.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Pending Amount</Text>
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
                        style={[styles.filterBtn, filter === "rejected" && styles.filterBtnActive]}
                        onPress={() => setFilter("rejected")}
                    >
                        <Text style={[styles.filterText, filter === "rejected" && styles.filterTextActive]}>
                            Rejected ({stats.rejected})
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
                </ScrollView>
            </View>

            {/* REFUNDS LIST */}
            <FlatList
                data={filteredRefunds}
                renderItem={renderRefundItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-circle-outline" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No refund requests found</Text>
                        <Text style={styles.emptySubText}>All refunds are processed</Text>
                    </View>
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.listHeaderText}>
                            Showing {filteredRefunds.length} of {refunds.length} refund requests
                        </Text>
                    </View>
                }
            />

            {/* REFUND DETAILS MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {selectedRefund && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Refund Details</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView style={styles.modalBody}>
                                    <View style={styles.modalRefundHeader}>
                                        <View style={[styles.modalStatusIndicator, { backgroundColor: getStatusColor(selectedRefund.status) }]} />
                                        <View style={styles.modalRefundInfo}>
                                            <Text style={styles.modalRefundId}>{selectedRefund.refundId}</Text>
                                            <Text style={styles.modalUserName}>{selectedRefund.user}</Text>
                                            <Text style={styles.modalAmount}>₹{selectedRefund.amount.toLocaleString()}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Refund Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Status</Text>
                                            <View style={[styles.badge, { backgroundColor: getStatusColor(selectedRefund.status) }]}>
                                                <Text style={styles.badgeText}>
                                                    {selectedRefund.status.charAt(0).toUpperCase() + selectedRefund.status.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Booking ID</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.bookingId}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Booking Type</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.bookingType}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Booking Date</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.bookingDate}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Requested Date</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.requestedDate}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Customer Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Customer Name</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.user}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Email</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.email}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Payment Method</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.paymentMethod}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Refund Details</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Refund Reason</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.reason}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Admin Notes</Text>
                                            <Text style={styles.detailValue}>{selectedRefund.notes}</Text>
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
                                    
                                    {selectedRefund.status === "pending" && (
                                        <>
                                            <TouchableOpacity 
                                                style={[styles.modalBtn, styles.rejectModalBtn]}
                                                onPress={() => {
                                                    handleRefundAction("reject", selectedRefund.id);
                                                    setModalVisible(false);
                                                }}
                                            >
                                                <Text style={styles.rejectModalBtnText}>Reject</Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                style={[styles.modalBtn, styles.approveModalBtn]}
                                                onPress={() => {
                                                    handleRefundAction("approve", selectedRefund.id);
                                                    setModalVisible(false);
                                                }}
                                            >
                                                <Text style={styles.approveModalBtnText}>Approve</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    
                                    {selectedRefund.status === "approved" && (
                                        <TouchableOpacity 
                                            style={[styles.modalBtn, styles.processBtn]}
                                            onPress={() => Alert.alert("Process", "Initiate refund payment")}
                                        >
                                            <Text style={styles.processBtnText}>Process Payment</Text>
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
    refundCard: {
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
    refundHeader: {
        flexDirection: "row",
        marginBottom: 12,
    },
    statusIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    refundInfo: { 
        flex: 1 
    },
    refundId: { 
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
    bookingType: { 
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
    refundDetails: {
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 12,
        marginBottom: 12,
    },
    reasonText: {
        fontSize: 14,
        color: "#475569",
        marginBottom: 8,
    },
    detailLabel: {
        fontWeight: "600",
        color: "#1e293b",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailText: { 
        fontSize: 12, 
        color: "#94a3b8" 
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
    modalRefundHeader: {
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
    modalRefundInfo: {
        flex: 1,
    },
    modalRefundId: { 
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
        color: "#42738f" 
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
    processBtn: {
        backgroundColor: "#3B82F6",
        flex: 2,
    },
    processBtnText: {
        color: "#fff",
        fontWeight: "600",
    },
});