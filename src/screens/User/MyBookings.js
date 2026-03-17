import React, { useState, useContext, useEffect } from "react";
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
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function MyBookings({ navigation }) {
    const { user } = useContext(AuthContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (user?.id) {
            loadBookings();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadBookings = async () => {
        if (!user?.id) return;

        try {
            console.log(`📡 Loading all bookings for user ID: ${user.id}`);

            const params = new URLSearchParams();
            params.append('userId', user.id.toString());
            params.append('page', '1');
            params.append('perPage', '100');
            // No status parameter – get all

            const response = await api.post(API.GET_APPOINTMENTS, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data?.status && Array.isArray(response.data.data)) {
                setBookings(response.data.data);
            } else if (Array.isArray(response.data)) {
                setBookings(response.data);
            } else {
                setBookings([]);
            }
        } catch (error) {
            console.error("❌ Error loading bookings:", error);
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

    const cancelBooking = (bookingId) => {
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
                            const params = new URLSearchParams();
                            params.append('appointmentId', String(bookingId));
                            params.append('status', 'CANCELED');
                            params.append('note', 'Cancelled by user');

                            const response = await api.post(API.RESPOND_APPOINTMENT, params.toString(), {
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            });

                            // Accept both true and "success" as success indicators
                            if (response.data?.status === true || response.data?.status === "success") {
                                Alert.alert("Success", "Booking cancelled successfully");
                                loadBookings();
                            } else {
                                Alert.alert("Error", response.data?.message || "Failed to cancel booking");
                            }
                        } catch (error) {
                            console.error("❌ Error cancelling:", error);
                            Alert.alert("Error", error.response?.data?.message || "Failed to cancel booking");
                        }
                    },
                },
            ]
        );
    };

    // Map backend status to frontend display
    const getDisplayStatus = (backendStatus) => {
        const s = String(backendStatus || '').toLowerCase();
        if (s === 'requested') return 'pending';
        if (s === 'accepted') return 'confirmed';
        if (s === 'completed') return 'completed';
        if (s === 'canceled' || s === 'cancelled') return 'cancelled';
        if (s === 'rejected') return 'rejected';
        return 'pending';
    };

    const getStatusColor = (displayStatus) => {
        switch (displayStatus) {
            case 'confirmed': return '#10b981';
            case 'pending': return '#f97316';
            case 'completed': return '#3b82f6';
            case 'cancelled':
            case 'rejected': return '#ef4444';
            default: return '#64748b';
        }
    };

    const getStatusBg = (displayStatus) => {
        switch (displayStatus) {
            case 'confirmed': return '#d1fae5';
            case 'pending': return '#fed7aa';
            case 'completed': return '#dbeafe';
            case 'cancelled':
            case 'rejected': return '#fee2e2';
            default: return '#f1f5f9';
        }
    };

    const getServiceIcon = (item) => {
        if (item.photographerId) return 'camera';
        if (item.guiderId) return 'map';
        return 'calendar';
    };

    const getProviderName = (item) => {
        if (item.guiderName) return item.guiderName;
        if (item.photographerName) return item.photographerName;
        return item.guiderId ? "Tour Guide" : (item.photographerId ? "Photographer" : "Service Provider");
    };

    const getAmount = (item) => item.totalPayment || item.totalAmount || item.serviceCost || 0;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateString;
        }
    };

    // Filter bookings based on selected filter
    const filteredBookings = bookings.filter(item => {
        if (filter === 'all') return true;
        const displayStatus = getDisplayStatus(item.appointmentStatus || item.status);
        return displayStatus === filter;
    });

    const renderBooking = ({ item }) => {
        const backendStatus = item.appointmentStatus || item.status || 'REQUESTED';
        const displayStatus = getDisplayStatus(backendStatus);
        const statusColor = getStatusColor(displayStatus);
        const statusBg = getStatusBg(displayStatus);

        return (
            <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                    <View style={[styles.serviceIcon, { backgroundColor: `${statusColor}20` }]}>
                        <Ionicons name={getServiceIcon(item)} size={20} color={statusColor} />
                    </View>
                    <View style={styles.bookingTitleContainer}>
                        <Text style={styles.bookingTitle}>{item.serviceName || "Service Booking"}</Text>
                        <Text style={styles.bookingProvider}>{getProviderName(item)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{displayStatus.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.bookingDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#64748b" />
                        <Text style={styles.detailText}>{formatDate(item.date || item.createdOn)}</Text>
                    </View>
                    {getAmount(item) > 0 && (
                        <View style={styles.detailRow}>
                            <Ionicons name="cash-outline" size={16} color="#64748b" />
                            <Text style={styles.detailText}>₹{getAmount(item).toLocaleString()}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bookingFooter}>
                    <Text style={styles.bookingId}>ID: {item.id || 'N/A'}</Text>
                    <View style={styles.actionButtons}>
                        {displayStatus === 'pending' && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelBooking(item.id)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        {displayStatus === 'completed' && (
                            <TouchableOpacity
                                style={styles.reviewBtn}
                                onPress={() => navigation.navigate('ReviewScreen', {
                                    appointmentId: item.id,
                                    providerId: item.photographerId || item.guiderId,
                                    providerType: item.photographerId ? 'photographer' : 'guider',
                                    providerName: getProviderName(item),
                                    serviceName: item.serviceName || 'Service',
                                })}
                            >
                                <Text style={styles.reviewBtnText}>Write Review</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const FilterButton = ({ title, value }) => (
        <TouchableOpacity
            style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
            onPress={() => setFilter(value)}
        >
            <Text style={[styles.filterBtnText, filter === value && styles.filterBtnTextActive]}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#3c6178', '#3e728f', '#2c454e']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <FilterButton title="All" value="all" />
                    <FilterButton title="Pending" value="pending" />
                    <FilterButton title="Confirmed" value="confirmed" />
                    <FilterButton title="Completed" value="completed" />
                    <FilterButton title="Cancelled" value="cancelled" />
                </ScrollView>
            </View>

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
                        {filter === "all" ? "You haven't made any bookings yet" : `No ${filter} bookings found`}
                    </Text>
                    <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate("ExplorePlaces")}>
                        <Text style={styles.exploreBtnText}>Explore Places</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    renderItem={renderBooking}
                    keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#50869a"]} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
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
    filterBtnActive: { backgroundColor: "#50869a" },
    filterBtnText: { fontSize: 13, fontWeight: "500", color: "#64748b" },
    filterBtnTextActive: { color: "#fff" },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 12, fontSize: 14, color: "#64748b" },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: "#1e293b", marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 },
    exploreBtn: { backgroundColor: "#50869a", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
    exploreBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
    list: { padding: 16 },
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
    bookingHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    serviceIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
    bookingTitleContainer: { flex: 1 },
    bookingTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
    bookingProvider: { fontSize: 12, color: "#64748b" },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: "600" },
    bookingDetails: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
    detailText: { fontSize: 13, color: "#64748b" },
    bookingFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    bookingId: { fontSize: 11, color: "#94a3b8" },
    actionButtons: { flexDirection: "row", gap: 8 },
    cancelBtn: { backgroundColor: "#fee2e2", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
    cancelBtnText: { color: "#ef4444", fontSize: 12, fontWeight: "500" },
    reviewBtn: { backgroundColor: "#50869a", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
    reviewBtnText: { color: "#fff", fontSize: 12, fontWeight: "500" },
});