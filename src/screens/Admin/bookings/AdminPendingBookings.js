// src/screens/Admin/bookings/AdminPendingBookings.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminPendingBookings({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingBookings();
    }, []);

    const fetchPendingBookings = async () => {
        try {
            setLoading(true);
            // Mock data for pending bookings
            const mockPendingBookings = [
                { 
                    id: 1, 
                    user: "John Doe", 
                    email: "john@example.com",
                    phone: "+91 9876543210",
                    service: "Tour Guide - Taj Mahal",
                    guide: "Rahul Sharma",
                    date: "2024-02-15", 
                    time: "10:00 AM",
                    duration: "4 hours",
                    amount: 2500,
                    location: "Taj Mahal, Agra",
                    requestedAt: "2024-02-10 14:30:00",
                    notes: "Need English speaking guide",
                    paymentMethod: "UPI"
                },
                { 
                    id: 2, 
                    user: "Jane Smith", 
                    email: "jane@example.com",
                    phone: "+91 9876543211",
                    service: "Photographer - Mumbai Tour",
                    photographer: "Priya Patel",
                    date: "2024-02-14", 
                    time: "2:00 PM",
                    duration: "3 hours",
                    amount: 3000,
                    location: "Gateway of India, Mumbai",
                    requestedAt: "2024-02-09 11:20:00",
                    notes: "Prefer female photographer",
                    paymentMethod: "Card"
                },
                { 
                    id: 3, 
                    user: "Mike Johnson", 
                    email: "mike@example.com",
                    phone: "+91 9876543212",
                    service: "Hotel Booking - Delhi",
                    hotel: "Taj Palace",
                    date: "2024-02-12", 
                    time: "3:00 PM",
                    duration: "2 nights",
                    amount: 8000,
                    location: "New Delhi",
                    requestedAt: "2024-02-08 09:15:00",
                    notes: "Early check-in requested",
                    paymentMethod: "Bank Transfer"
                },
                { 
                    id: 4, 
                    user: "Sarah Williams", 
                    email: "sarah@example.com",
                    phone: "+91 9876543213",
                    service: "Golden Triangle Tour",
                    package: "3 Days Delhi-Agra-Jaipur",
                    date: "2024-02-20", 
                    time: "9:00 AM",
                    duration: "3 days",
                    amount: 15000,
                    location: "Delhi - Agra - Jaipur",
                    requestedAt: "2024-02-07 16:45:00",
                    notes: "Vegetarian meals required",
                    paymentMethod: "UPI"
                },
            ];
            
            setBookings(mockPendingBookings);
        } catch (error) {
            console.error("Error fetching pending bookings:", error);
            Alert.alert("Error", "Failed to load pending bookings");
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPendingBookings();
        setRefreshing(false);
    };

    const handleApprove = (bookingId) => {
        Alert.alert(
            "Approve Booking",
            "Are you sure you want to approve this booking?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Approve", 
                    style: "default",
                    onPress: () => {
                        // Remove from pending list
                        setBookings(prev => prev.filter(booking => booking.id !== bookingId));
                        Alert.alert("Success", "Booking approved successfully");
                    }
                }
            ]
        );
    };

    const handleReject = (bookingId) => {
        Alert.alert(
            "Reject Booking",
            "Are you sure you want to reject this booking?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Reject", 
                    style: "destructive",
                    onPress: () => {
                        // Remove from pending list
                        setBookings(prev => prev.filter(booking => booking.id !== bookingId));
                        Alert.alert("Success", "Booking rejected");
                    }
                }
            ]
        );
    };

    const renderBookingItem = ({ item }) => (
        <View style={styles.bookingCard}>
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
                    <Text style={styles.bookingDate}>{item.date} • {item.time}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
                </View>
            </View>
            
            <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{item.phone}</Text>
                </View>
                {item.notes && (
                    <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text style={styles.detailText} numberOfLines={2}>{item.notes}</Text>
                    </View>
                )}
            </View>
            
            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item.id)}
                >
                    <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(item.id)}
                >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.viewBtn]}
                    onPress={() => navigation.navigate("AdminBookingDetails", { bookingId: item.id })}
                >
                    <Ionicons name="eye-outline" size={18} color="#2563EB" />
                    <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.requestedTime}>
                <Ionicons name="time-outline" size={14} color="#94a3b8" />
                <Text style={styles.requestedText}>Requested: {item.requestedAt}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading pending bookings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Pending Bookings</Text>
                    <Text style={styles.headerSubtitle}>{bookings.length} bookings awaiting approval</Text>
                </View>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* PENDING BOOKINGS LIST */}
            {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={80} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No Pending Bookings</Text>
                    <Text style={styles.emptyText}>All bookings have been processed</Text>
                    <TouchableOpacity 
                        style={styles.checkBookingsBtn}
                        onPress={() => navigation.navigate("AdminAllBookings")}
                    >
                        <Text style={styles.checkBookingsText}>Check All Bookings</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderBookingItem}
                    keyExtractor={item => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* BULK ACTIONS */}
            {bookings.length > 0 && (
                <View style={styles.bulkActions}>
                    <TouchableOpacity 
                        style={[styles.bulkBtn, styles.bulkRejectBtn]}
                        onPress={() => Alert.alert("Bulk Reject", "Feature coming soon")}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                        <Text style={styles.bulkRejectText}>Reject All</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.bulkBtn, styles.bulkApproveBtn]}
                        onPress={() => Alert.alert("Bulk Approve", "Feature coming soon")}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.bulkApproveText}>Approve All</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#f8fafc" 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#F59E0B",
        paddingTop: 40,
    },
    headerTitleContainer: {
        alignItems: "center",
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#fff" 
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#FEF3C7",
        marginTop: 2,
    },
    listContainer: { 
        padding: 20 
    },
    bookingCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: "#F59E0B",
    },
    bookingHeader: {
        flexDirection: "row",
        marginBottom: 12,
    },
    serviceIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#FEF3C7",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    bookingInfo: { 
        flex: 1 
    },
    bookingTitle: { 
        fontSize: 16, 
        fontWeight: "700", 
        color: "#1e293b", 
        marginBottom: 2 
    },
    bookingUser: { 
        fontSize: 14, 
        color: "#64748b", 
        marginBottom: 4 
    },
    bookingDate: { 
        fontSize: 13, 
        color: "#94a3b8" 
    },
    amountContainer: { 
        alignItems: "flex-end" 
    },
    amountText: { 
        fontSize: 20, 
        fontWeight: "700", 
        color: "#1e293b" 
    },
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
    detailText: { 
        fontSize: 14, 
        color: "#64748b", 
        marginLeft: 8, 
        flex: 1 
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
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
    viewBtn: { 
        backgroundColor: "#DBEAFE" 
    },
    viewBtnText: { 
        color: "#2563EB", 
        fontWeight: "600", 
        marginLeft: 6 
    },
    requestedTime: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },
    requestedText: { 
        fontSize: 12, 
        color: "#94a3b8", 
        marginLeft: 4 
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1e293b",
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 24,
    },
    checkBookingsBtn: {
        backgroundColor: "#42738f",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    checkBookingsText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    bulkActions: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    bulkBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    bulkRejectBtn: {
        backgroundColor: "#FEE2E2",
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    bulkRejectText: {
        color: "#DC2626",
        fontWeight: "600",
        marginLeft: 8,
        fontSize: 16,
    },
    bulkApproveBtn: {
        backgroundColor: "#10B981",
    },
    bulkApproveText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 8,
        fontSize: 16,
    },
});