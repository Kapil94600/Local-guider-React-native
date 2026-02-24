import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function MyBookings({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("all");
    const [userId, setUserId] = useState(null); // You need to get this from AuthContext

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            console.log("📡 Loading bookings with POST...");
            
            // ✅ FIX: Send as URL parameters (not in body)
            // The backend expects @RequestParam, so we need to send as query params
            const params = new URLSearchParams();
            
            // Get user ID from auth context (you need to implement this)
            // For now, let's assume we have it
            const userId = 1; // Replace with actual user ID from AuthContext
            
            if (userId) {
                params.append('userId', userId.toString());
            }
            
            // Add pagination
            params.append('page', '1');
            params.append('perPage', '100');
            
            // Add filter if not "all"
            if (filter !== "all") {
                params.append('status', filter.toUpperCase());
            }
            
            console.log("📤 Sending params:", params.toString());
            
            // Send as form-urlencoded
            const response = await api.post(API.GET_APPOINTMENTS, params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            console.log("✅ Bookings response status:", response.status);
            console.log("✅ Bookings response data:", JSON.stringify(response.data, null, 2));

            // ✅ Handle response based on backend structure
            let bookingsData = [];
            
            if (response.data?.data && Array.isArray(response.data.data)) {
                bookingsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                bookingsData = response.data;
            }

            console.log(`📊 Found ${bookingsData.length} bookings`);
            setBookings(bookingsData);
            
        } catch (error) {
            console.error("❌ Error loading bookings:", error);
            console.error("Error details:", error.response?.data || error.message);
            setBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    // Update filter and reload
    useEffect(() => {
        if (!loading) {
            loadBookings();
        }
    }, [filter]);

    const cancelBooking = (bookingId) => {
        if (!bookingId) {
            Alert.alert("Error", "Invalid booking ID");
            return;
        }

        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log("📡 Cancelling booking ID:", bookingId);
                            
                            const params = new URLSearchParams();
                            params.append('appointmentId', String(bookingId));
                            params.append('status', 'CANCELED');
                            params.append('note', 'Cancelled by user');

                            const response = await api.post(API.RESPOND_APPOINTMENT, params.toString(), {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            });

                            console.log("✅ Cancel response:", response.data);

                            if (response.data?.status === true || response.data?.status === "success") {
                                Alert.alert("Success", "Booking cancelled successfully");
                                loadBookings();
                            } else {
                                Alert.alert("Error", response.data?.message || "Failed to cancel booking");
                            }
                        } catch (error) {
                            console.error("❌ Error cancelling:", error);
                            Alert.alert("Error", "Failed to cancel booking. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    // Safe function to get status
    const getStatus = (item) => {
        if (!item) return "pending";
        const status = item?.appointmentStatus || item?.status || "pending";
        return status ? String(status).toLowerCase() : "pending";
    };

    const getStatusColor = (status) => {
        const s = String(status || "").toLowerCase();
        switch (s) {
            case 'confirmed': return '#10b981';
            case 'pending': return '#f97316';
            case 'completed': return '#3b82f6';
            case 'canceled':
            case 'cancelled': return '#ef4444';
            default: return '#64748b';
        }
    };

    const getStatusBg = (status) => {
        const s = String(status || "").toLowerCase();
        switch (s) {
            case 'confirmed': return '#d1fae5';
            case 'pending': return '#fed7aa';
            case 'completed': return '#dbeafe';
            case 'canceled':
            case 'cancelled': return '#fee2e2';
            default: return '#f1f5f9';
        }
    };

    const getStatusDisplay = (status) => {
        const s = String(status || "").toLowerCase();
        switch (s) {
            case 'confirmed': return 'CONFIRMED';
            case 'pending': return 'PENDING';
            case 'completed': return 'COMPLETED';
            case 'canceled':
            case 'cancelled': return 'CANCELLED';
            default: return (status && String(status).toUpperCase()) || 'PENDING';
        }
    };

    // Filter function
    const getFilteredBookings = () => {
        if (!Array.isArray(bookings)) return [];
        if (filter === "all") return bookings;
        
        return bookings.filter(item => {
            if (!item) return false;
            const status = getStatus(item);
            return status === filter.toLowerCase();
        });
    };

    const filteredBookings = getFilteredBookings();

    const getServiceIcon = (item) => {
        if (!item) return 'calendar';
        if (item.photographerId) return 'camera';
        if (item.guiderId) return 'map';
        return 'calendar';
    };

    const getServiceName = (item) => {
        if (!item) return "Booking";
        return item.serviceName || "Service Booking";
    };

    const getProviderName = (item) => {
        if (!item) return "Service Provider";
        if (item.photographerName) return item.photographerName;
        if (item.guiderName) return item.guiderName;
        return item.customerName || "Service Provider";
    };

    const getAmount = (item) => {
        if (!item) return 0;
        return item.totalPayment || item.totalAmount || item.serviceCost || 0;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return String(dateString);
            return date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch (e) {
            return String(dateString);
        }
    };

    const renderBooking = ({ item }) => {
        if (!item) return null;
        
        const status = getStatus(item);
        const statusColor = getStatusColor(status);
        const statusBg = getStatusBg(status);
        const statusDisplay = getStatusDisplay(status);
        const serviceIcon = getServiceIcon(item);
        const serviceName = getServiceName(item);
        const providerName = getProviderName(item);
        const amount = getAmount(item);

        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                    <View style={[styles.serviceIcon, { backgroundColor: `${statusColor}20` }]}>
                        <Ionicons name={serviceIcon} size={20} color={statusColor} />
                    </View>
                    <View style={styles.bookingTitleContainer}>
                        <Text style={styles.bookingTitle}>{serviceName}</Text>
                        <Text style={styles.bookingProvider}>{providerName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {statusDisplay}
                        </Text>
                    </View>
                </View>

                <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#64748b" />
                        <Text style={styles.detailText}>
                            {formatDate(item.date || item.createdOn)}
                        </Text>
                    </View>
                    {amount > 0 && (
                        <View style={styles.detailRow}>
                            <Ionicons name="cash-outline" size={16} color="#64748b" />
                            <Text style={styles.detailText}>₹{amount.toLocaleString()}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bookingFooter}>
                    <Text style={styles.bookingId}>
                        ID: {item.id || 'N/A'}
                    </Text>
                    
                    {status === 'pending' && (
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => cancelBooking(item.id)}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const FilterButton = ({ title, value }) => (
        <TouchableOpacity
            style={[
                styles.filterBtn,
                filter === value && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(value)}
        >
            <Text style={[
                styles.filterBtnText,
                filter === value && styles.filterBtnTextActive,
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#3c6178', '#3e728f', '#2c454e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <FilterButton title="All" value="all" />
                    <FilterButton title="Pending" value="pending" />
                    <FilterButton title="Confirmed" value="confirmed" />
                    <FilterButton title="Completed" value="completed" />
                    <FilterButton title="Cancelled" value="cancelled" />
                </ScrollView>
            </View>

            {/* Bookings List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#50869a" />
                    <Text style={styles.loadingText}>Loading bookings...</Text>
                </View>
            ) : filteredBookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={60} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No bookings found</Text>
                    <Text style={styles.emptyText}>
                        {filter === "all" 
                            ? "You haven't made any bookings yet"
                            : `No ${filter} bookings found`}
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreBtn}
                        onPress={() => navigation.navigate("ExplorePlaces")}
                    >
                        <Text style={styles.exploreBtnText}>Explore Places</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    renderItem={renderBooking}
                    keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#50869a"]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 50,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    filterContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        marginRight: 8,
    },
    filterBtnActive: {
        backgroundColor: "#50869a",
    },
    filterBtnText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748b",
    },
    filterBtnTextActive: {
        color: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748b",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 24,
    },
    exploreBtn: {
        backgroundColor: "#50869a",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    exploreBtnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    list: {
        padding: 16,
    },
    bookingCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    bookingHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    serviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    bookingTitleContainer: {
        flex: 1,
    },
    bookingTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 2,
    },
    bookingProvider: {
        fontSize: 12,
        color: "#64748b",
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
    },
    bookingDetails: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        gap: 8,
    },
    detailText: {
        fontSize: 13,
        color: "#64748b",
    },
    bookingFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    bookingId: {
        fontSize: 11,
        color: "#94a3b8",
    },
    cancelBtn: {
        backgroundColor: "#fee2e2",
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    cancelBtnText: {
        color: "#ef4444",
        fontSize: 12,
        fontWeight: "500",
    },
});