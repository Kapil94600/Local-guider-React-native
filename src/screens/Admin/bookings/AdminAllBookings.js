// src/screens/Admin/bookings/AdminAllBookings.js
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

export default function AdminAllBookings({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all"); // all, pending, confirmed, cancelled, completed
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [searchQuery, filter, bookings]);

    const fetchBookings = async () => {
        try {
            // Mock data
            const mockBookings = [
                { 
                    id: 1, 
                    user: "John Doe", 
                    service: "Tour Guide", 
                    guide: "Rahul Sharma",
                    date: "2024-02-15", 
                    time: "10:00 AM",
                    duration: "4 hours",
                    amount: 2500,
                    status: "confirmed",
                    paymentStatus: "paid",
                    location: "Taj Mahal, Agra"
                },
                { 
                    id: 2, 
                    user: "Jane Smith", 
                    service: "Photographer", 
                    photographer: "Priya Patel",
                    date: "2024-02-14", 
                    time: "2:00 PM",
                    duration: "3 hours",
                    amount: 3000,
                    status: "pending",
                    paymentStatus: "pending",
                    location: "Gateway of India, Mumbai"
                },
                { 
                    id: 3, 
                    user: "Mike Johnson", 
                    service: "Tour Package", 
                    package: "Golden Triangle",
                    date: "2024-02-20", 
                    time: "9:00 AM",
                    duration: "3 days",
                    amount: 15000,
                    status: "completed",
                    paymentStatus: "paid",
                    location: "Delhi - Agra - Jaipur"
                },
                { 
                    id: 4, 
                    user: "Sarah Williams", 
                    service: "Hotel Booking", 
                    hotel: "Taj Palace",
                    date: "2024-02-12", 
                    time: "3:00 PM",
                    duration: "2 nights",
                    amount: 8000,
                    status: "cancelled",
                    paymentStatus: "refunded",
                    location: "New Delhi"
                },
            ];
            setBookings(mockBookings);
            setFilteredBookings(mockBookings);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            Alert.alert("Error", "Failed to load bookings");
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];
        
        if (filter !== "all") {
            filtered = filtered.filter(booking => booking.status === filter);
        }
        
        if (searchQuery.trim() !== "") {
            filtered = filtered.filter(booking =>
                booking.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        setFilteredBookings(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed": return "#10B981";
            case "pending": return "#F59E0B";
            case "cancelled": return "#EF4444";
            case "completed": return "#3B82F6";
            default: return "#6B7280";
        }
    };

    const getPaymentStatusColor = (status) => {
        return status === "paid" ? "#10B981" : "#EF4444";
    };

    const handleBookingAction = (action, bookingId) => {
        Alert.alert(
            "Confirm Action",
            `Are you sure you want to ${action} this booking?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Confirm", 
                    style: "destructive",
                    onPress: () => executeAction(action, bookingId)
                }
            ]
        );
    };

    const executeAction = (action, bookingId) => {
        Alert.alert("Success", `Booking has been ${action}ed successfully`);
        fetchBookings(); // Refresh list
    };

    const renderBookingItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.bookingCard}
            onPress={() => {
                setSelectedBooking(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.bookingHeader}>
                <View style={styles.serviceIcon}>
                    <Ionicons 
                        name={item.service.includes("Tour") ? "map-outline" : 
                              item.service.includes("Photo") ? "camera-outline" : 
                              item.service.includes("Hotel") ? "business-outline" : "calendar-outline"} 
                        size={24} 
                        color="#42738f" 
                    />
                </View>
                <View style={styles.bookingInfo}>
                    <Text style={styles.bookingTitle}>{item.service}</Text>
                    <Text style={styles.bookingUser}>{item.user}</Text>
                    <View style={styles.bookingMeta}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                            <Text style={styles.statusText}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>
                        <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(item.paymentStatus) }]}>
                            <Text style={styles.paymentText}>
                                {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.bookingAmount}>
                    <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
            </View>
            
            <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{item.time} • {item.duration}</Text>
                </View>
            </View>
            
            <View style={styles.actionButtons}>
                {item.status === "pending" && (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.confirmBtn]}
                            onPress={() => handleBookingAction("confirm", item.id)}
                        >
                            <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
                            <Text style={styles.confirmBtnText}>Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.cancelBtn]}
                            onPress={() => handleBookingAction("cancel", item.id)}
                        >
                            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                            <Text style={styles.cancelBtnText}>Reject</Text>
                        </TouchableOpacity>
                    </>
                )}
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.viewBtn]}
                    onPress={() => navigation.navigate("AdminBookingDetails", { bookingId: item.id })}
                >
                    <Ionicons name="eye-outline" size={16} color="#2563EB" />
                    <Text style={styles.viewBtnText}>View Details</Text>
                </TouchableOpacity>
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
                <Text style={styles.headerTitle}>All Bookings</Text>
                <TouchableOpacity>
                    <Ionicons name="filter-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* SEARCH AND FILTERS */}
            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#94a3b8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search bookings by user, service or location..."
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
                        style={[styles.filterBtn, filter === "pending" && styles.filterBtnActive]}
                        onPress={() => setFilter("pending")}
                    >
                        <Text style={[styles.filterText, filter === "pending" && styles.filterTextActive]}>
                            Pending
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.filterBtn, filter === "confirmed" && styles.filterBtnActive]}
                        onPress={() => setFilter("confirmed")}
                    >
                        <Text style={[styles.filterText, filter === "confirmed" && styles.filterTextActive]}>
                            Confirmed
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
                        style={[styles.filterBtn, filter === "cancelled" && styles.filterBtnActive]}
                        onPress={() => setFilter("cancelled")}
                    >
                        <Text style={[styles.filterText, filter === "cancelled" && styles.filterTextActive]}>
                            Cancelled
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* BOOKINGS LIST */}
            <FlatList
                data={filteredBookings}
                renderItem={renderBookingItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No bookings found</Text>
                        <Text style={styles.emptySubText}>Try changing your search or filter</Text>
                    </View>
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.listHeaderText}>
                            Showing {filteredBookings.length} of {bookings.length} bookings
                        </Text>
                    </View>
                }
            />

            {/* BOOKING DETAILS MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {selectedBooking && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Booking Details</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView style={styles.modalBody}>
                                    <View style={styles.modalService}>
                                        <View style={styles.serviceIconLarge}>
                                            <Ionicons 
                                                name={selectedBooking.service.includes("Tour") ? "map-outline" : 
                                                      selectedBooking.service.includes("Photo") ? "camera-outline" : 
                                                      selectedBooking.service.includes("Hotel") ? "business-outline" : "calendar-outline"} 
                                                size={32} 
                                                color="#42738f" 
                                            />
                                        </View>
                                        <Text style={styles.modalServiceTitle}>{selectedBooking.service}</Text>
                                        <Text style={styles.modalServiceSubtitle}>Booking ID: #{selectedBooking.id}</Text>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Customer Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Customer Name</Text>
                                            <Text style={styles.detailValue}>{selectedBooking.user}</Text>
                                        </View>
                                        
                                        {selectedBooking.guide && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Tour Guide</Text>
                                                <Text style={styles.detailValue}>{selectedBooking.guide}</Text>
                                            </View>
                                        )}
                                        
                                        {selectedBooking.photographer && (
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>Photographer</Text>
                                                <Text style={styles.detailValue}>{selectedBooking.photographer}</Text>
                                            </View>
                                        )}
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Booking Details</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Date & Time</Text>
                                            <Text style={styles.detailValue}>{selectedBooking.date} at {selectedBooking.time}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Duration</Text>
                                            <Text style={styles.detailValue}>{selectedBooking.duration}</Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Location</Text>
                                            <Text style={styles.detailValue}>{selectedBooking.location}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Payment Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Amount</Text>
                                            <Text style={[styles.detailValue, { fontWeight: "700", color: "#42738f" }]}>
                                                ₹{selectedBooking.amount.toLocaleString()}
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Payment Status</Text>
                                            <View style={[styles.badge, { backgroundColor: getPaymentStatusColor(selectedBooking.paymentStatus) }]}>
                                                <Text style={styles.badgeText}>
                                                    {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Booking Status</Text>
                                            <View style={[styles.badge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                                                <Text style={styles.badgeText}>
                                                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                                                </Text>
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
                                            navigation.navigate("AdminBookingDetails", { bookingId: selectedBooking.id });
                                        }}
                                    >
                                        <Text style={styles.primaryBtnText}>Full Details</Text>
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
    bookingCard: {
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
    bookingHeader: {
        flexDirection: "row",
        marginBottom: 12,
    },
    serviceIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    bookingInfo: { flex: 1 },
    bookingTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
    bookingUser: { fontSize: 14, color: "#64748b", marginBottom: 8 },
    bookingMeta: { flexDirection: "row" },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    statusText: { fontSize: 12, fontWeight: "600", color: "#fff" },
    paymentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paymentText: { fontSize: 12, fontWeight: "600", color: "#fff" },
    bookingAmount: { alignItems: "flex-end" },
    amountText: { fontSize: 18, fontWeight: "700", color: "#42738f", marginBottom: 4 },
    dateText: { fontSize: 14, color: "#64748b" },
    bookingDetails: {
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        paddingVertical: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailText: { fontSize: 14, color: "#64748b", marginLeft: 8, flex: 1 },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
        justifyContent: "center",
    },
    confirmBtn: { backgroundColor: "#D1FAE5" },
    confirmBtnText: { color: "#059669", marginLeft: 4, fontWeight: "600" },
    cancelBtn: { backgroundColor: "#FEE2E2" },
    cancelBtnText: { color: "#DC2626", marginLeft: 4, fontWeight: "600" },
    viewBtn: { backgroundColor: "#DBEAFE" },
    viewBtnText: { color: "#2563EB", marginLeft: 4, fontWeight: "600" },
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
    modalService: {
        alignItems: "center",
        marginBottom: 20,
    },
    serviceIconLarge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    modalServiceTitle: { fontSize: 20, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
    modalServiceSubtitle: { fontSize: 14, color: "#64748b" },
    detailSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f8fafc",
    },
    detailLabel: { fontSize: 14, color: "#64748b", flex: 1 },
    detailValue: { fontSize: 14, fontWeight: "600", color: "#1e293b", flex: 2, textAlign: "right" },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
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
    primaryBtn: { backgroundColor: "#42738f" },
    primaryBtnText: { color: "#fff", fontWeight: "600" },
    secondaryBtn: { backgroundColor: "#f1f5f9" },
    secondaryBtnText: { color: "#64748b", fontWeight: "600" },
});