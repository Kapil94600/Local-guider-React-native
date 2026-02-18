// src/screens/Admin/bookings/AdminBookingDetails.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminBookingDetails({ route, navigation }) {
    const { bookingId } = route.params || {};
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookingDetails();
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            // Mock data
            const mockBooking = {
                id: bookingId || 1,
                user: "John Doe",
                email: "john@example.com",
                phone: "+91 9876543210",
                service: "Tour Guide Service",
                guide: "Rahul Sharma",
                guidePhone: "+91 9876543211",
                date: "2024-02-15",
                time: "10:00 AM",
                duration: "4 hours",
                amount: 2500,
                status: "confirmed",
                paymentStatus: "paid",
                paymentMethod: "UPI",
                transactionId: "TXN123456",
                location: "Taj Mahal, Agra, Uttar Pradesh",
                meetingPoint: "Main Entrance Gate",
                specialRequirements: "Need English speaking guide",
                createdAt: "2024-02-10 14:30:00",
                notes: "Customer requested early check-in",
            };
            
            setBooking(mockBooking);
        } catch (error) {
            console.error("Error fetching booking details:", error);
            Alert.alert("Error", "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action) => {
        Alert.alert(
            "Confirm Action",
            `Are you sure you want to ${action} this booking?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Confirm", 
                    style: "destructive",
                    onPress: () => {
                        Alert.alert("Success", `Booking has been ${action}ed`);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading booking details...</Text>
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
                <Text style={styles.headerTitle}>Booking Details</Text>
                <TouchableOpacity>
                    <Ionicons name="print-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* BOOKING HEADER */}
                <View style={styles.bookingHeader}>
                    <View style={styles.serviceIcon}>
                        <Ionicons name="calendar-outline" size={32} color="#42738f" />
                    </View>
                    <View style={styles.bookingTitleContainer}>
                        <Text style={styles.serviceName}>{booking.service}</Text>
                        <Text style={styles.bookingId}>Booking ID: #{booking.id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: booking.status === "confirmed" ? "#10B981" : "#F59E0B" }]}>
                        <Text style={styles.statusText}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* CUSTOMER INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="person-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Customer Name</Text>
                            <Text style={styles.infoValue}>{booking.user}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="mail-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{booking.email}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="call-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{booking.phone}</Text>
                        </View>
                    </View>
                </View>

                {/* BOOKING DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="calendar-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Date & Time</Text>
                            <Text style={styles.infoValue}>{booking.date} at {booking.time}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="time-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Duration</Text>
                            <Text style={styles.infoValue}>{booking.duration}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="location-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Location</Text>
                            <Text style={styles.infoValue}>{booking.location}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="pin-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Meeting Point</Text>
                            <Text style={styles.infoValue}>{booking.meetingPoint}</Text>
                        </View>
                    </View>
                </View>

                {/* GUIDE/PHOTOGRAPHER INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Service Provider</Text>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="person-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Guide Name</Text>
                            <Text style={styles.infoValue}>{booking.guide}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="call-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Guide Phone</Text>
                            <Text style={styles.infoValue}>{booking.guidePhone}</Text>
                        </View>
                    </View>
                </View>

                {/* PAYMENT INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Information</Text>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="cash-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Amount</Text>
                            <Text style={[styles.infoValue, { color: "#42738f", fontWeight: "700" }]}>
                                ₹{booking.amount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="card-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Payment Status</Text>
                            <View style={[styles.smallBadge, { 
                                backgroundColor: booking.paymentStatus === "paid" ? "#10B981" : "#EF4444" 
                            }]}>
                                <Text style={styles.smallBadgeText}>
                                    {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="wallet-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Payment Method</Text>
                            <Text style={styles.infoValue}>{booking.paymentMethod}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="receipt-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Transaction ID</Text>
                            <Text style={styles.infoValue}>{booking.transactionId}</Text>
                        </View>
                    </View>
                </View>

                {/* ADDITIONAL INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Additional Information</Text>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="document-text-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Special Requirements</Text>
                            <Text style={styles.infoValue}>{booking.specialRequirements}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Notes</Text>
                            <Text style={styles.infoValue}>{booking.notes}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="time-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Created At</Text>
                            <Text style={styles.infoValue}>{booking.createdAt}</Text>
                        </View>
                    </View>
                </View>

                {/* ACTION BUTTONS */}
                <View style={styles.actionSection}>
                    {booking.status === "pending" && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.confirmBtn]}
                                onPress={() => handleAction("confirm")}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.cancelBtn]}
                                onPress={() => handleAction("cancel")}
                            >
                                <Ionicons name="close-circle" size={20} color="#fff" />
                                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.editBtn]}
                            onPress={() => navigation.navigate("AdminEditBooking", { bookingId: booking.id })}
                        >
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.editBtnText}>Edit Booking</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.contactBtn]}
                            onPress={() => Alert.alert("Contact", `Call ${booking.phone}`)}
                        >
                            <Ionicons name="call-outline" size={20} color="#fff" />
                            <Text style={styles.contactBtnText}>Contact Customer</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* BOTTOM SPACER */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
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
        backgroundColor: "#42738f",
        paddingTop: 40,
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#fff" 
    },
    bookingHeader: {
        backgroundColor: "#fff",
        margin: 20,
        padding: 20,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    serviceIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    bookingTitleContainer: {
        flex: 1,
    },
    serviceName: { 
        fontSize: 18, 
        fontWeight: "700", 
        color: "#1e293b",
        marginBottom: 4,
    },
    bookingId: { 
        fontSize: 14, 
        color: "#64748b" 
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: { 
        fontSize: 14, 
        fontWeight: "600", 
        color: "#fff" 
    },
    section: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f8fafc",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
    },
    smallBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    smallBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
    },
    actionSection: {
        marginHorizontal: 20,
        marginBottom: 30,
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        marginHorizontal: 6,
    },
    confirmBtn: {
        backgroundColor: "#10B981",
    },
    confirmBtnText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 8,
    },
    cancelBtn: {
        backgroundColor: "#EF4444",
    },
    cancelBtnText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 8,
    },
    editBtn: {
        backgroundColor: "#3B82F6",
    },
    editBtnText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 8,
    },
    contactBtn: {
        backgroundColor: "#8B5CF6",
    },
    contactBtnText: {
        color: "#fff",
        fontWeight: "600",
        marginLeft: 8,
    },
    bottomSpacer: {
        height: 20,
    },
});