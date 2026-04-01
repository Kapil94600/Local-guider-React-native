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
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform
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

    // Review Modal States
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.id) loadBookings();
    }, [user]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('userId', user.id.toString());
            
            const response = await api.post(API.GET_APPOINTMENTS, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data?.status && Array.isArray(response.data.data)) {
                setBookings(response.data.data);
            }
        } catch (error) {
            console.error("❌ Fetch Error:", error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    // --- FINAL REVIEW SUBMISSION (Matches Kotlin @RequestParam) ---
    const submitReview = async () => {
        if (rating === 0) {
            Alert.alert("Required", "Please select a star rating.");
            return;
        }

        setSubmitting(true);
        try {
            const params = new URLSearchParams();
            // These keys match your Kotlin @RequestParam names exactly
            params.append('rating', rating.toString()); 
            params.append('message', comment || "");
            params.append('userId', user.id.toString());

            // Logic to send the correct ID based on the booking type
            if (selectedBooking.photographerId) {
                params.append('photographerId', selectedBooking.photographerId.toString());
            } else if (selectedBooking.guiderId) {
                params.append('guiderId', selectedBooking.guiderId.toString());
            } else if (selectedBooking.placeId) {
                params.append('placeId', selectedBooking.placeId.toString());
            }

            console.log("📤 Submitting Review to /review/add:", params.toString());

            const response = await api.post('/review/add', params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data?.status) {
                Alert.alert("Success", "Review added successfully!");
                setShowReviewModal(false);
                setRating(0);
                setComment("");
                loadBookings(); // Refresh list
            } else {
                Alert.alert("Error", response.data?.message || "Rating is required.");
            }
        } catch (error) {
            console.error("❌ API Error:", error.response?.data || error.message);
            Alert.alert("Error", "Server error. Check console logs.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = () => (
        <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity key={num} onPress={() => setRating(num)}>
                    <Ionicons 
                        name={rating >= num ? "star" : "star-outline"} 
                        size={35} 
                        color={rating >= num ? "#f59e0b" : "#cbd5e1"} 
                    />
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderBooking = ({ item }) => {
        const status = (item.appointmentStatus || item.status || 'pending').toLowerCase();
        const isCompleted = status === 'completed' || status === 'approved';
        
        return (
            <View style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.titleGroup}>
                        <Ionicons name={item.photographerId ? "camera" : "map"} size={18} color="#50869a" />
                        <Text style={styles.firmName} numberOfLines={1}>{item.firmName || "Service"}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#dcfce7' : '#fee2e2' }]}>
                        <Text style={[styles.statusText, { color: isCompleted ? '#166534' : '#991b1b' }]}>
                            {status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                
                <Text style={styles.dateText}>📅 {new Date(item.createdOn).toLocaleDateString()}</Text>

                <View style={styles.footer}>
                    <Text style={styles.idText}>Booking ID: {item.id}</Text>
                    {status === 'completed' && (
                        <TouchableOpacity 
                            style={styles.reviewBtn} 
                            onPress={() => {
                                setSelectedBooking(item);
                                setShowReviewModal(true);
                            }}
                        >
                            <Text style={styles.reviewBtnText}>Rate Service</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#3c6178', '#2c454e']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <View style={{ width: 24 }} /> 
            </LinearGradient>

            <FlatList
                data={bookings}
                renderItem={renderBooking}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadBookings} />}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No bookings found.</Text>
                    </View>
                }
            />

            {/* REVIEW MODAL */}
            <Modal visible={showReviewModal} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>How was your experience?</Text>
                        <Text style={styles.modalSubtitle}>{selectedBooking?.firmName}</Text>
                        
                        {renderStars()}

                        <TextInput
                            style={styles.input}
                            placeholder="Write your feedback (optional)..."
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowReviewModal(false); setRating(0); }}>
                                <Text style={styles.cancelText}>Later</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={submitReview} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Review</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 20 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    bookingCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    firmName: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '800' },
    dateText: { color: '#64748b', fontSize: 13, marginBottom: 15 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    idText: { fontSize: 11, color: '#94a3b8' },
    reviewBtn: { backgroundColor: '#50869a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
    reviewBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
    modalContent: { backgroundColor: '#fff', borderRadius: 25, padding: 25, alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    modalSubtitle: { color: '#64748b', marginVertical: 8 },
    starRow: { flexDirection: 'row', gap: 12, marginVertical: 20 },
    input: { width: '100%', height: 100, backgroundColor: '#f8fafc', borderRadius: 15, padding: 15, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
    modalButtons: { flexDirection: 'row', gap: 15, width: '100%' },
    cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12 },
    submitBtn: { flex: 2, backgroundColor: '#50869a', padding: 15, alignItems: 'center', borderRadius: 12 },
    submitText: { color: '#fff', fontWeight: 'bold' },
    cancelText: { color: '#94a3b8', fontWeight: '600' },
    emptyBox: { marginTop: 100, alignItems: 'center' },
    emptyText: { color: '#94a3b8' }
});