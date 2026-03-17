import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    RefreshControl,
    Modal,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
    StatusBar,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

// Get image URL from filename
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/^\/+/, '');
    return `${BASE_URL}/api/image/download/${cleanPath}`;
};

// Image Component for Places
const PlaceImage = ({ imagePath, style }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!imagePath) {
            setError(true);
            return;
        }
        setImageUrl(getImageUrl(imagePath));
    }, [imagePath]);

    if (error || !imageUrl) {
        return (
            <View style={[style, styles.avatarPlaceholder]}>
                <Ionicons name="image-outline" size={30} color="#2c5a73" />
            </View>
        );
    }

    return (
        <Image
            source={{ uri: imageUrl }}
            style={style}
            onError={() => setError(true)}
            resizeMode="cover"
        />
    );
};

export default function PlaceList({ navigation }) {
    const { user: currentUser } = useContext(AuthContext);
    const [places, setPlaces] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Fetch places from API
    const fetchPlaces = async () => {
        try {
            setLoading(true);
            const response = await api.post(API.GET_PLACES, {
                page: 1,
                perPage: 100,
            });

            const responseData = response.data || {};
            const placesData = responseData.data || [];
            setPlaces(placesData);
        } catch (error) {
            console.error("❌ Error fetching places:", error.response?.data || error.message);
            Alert.alert("Error", "Failed to load places. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPlaces();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPlaces();
    };

    // Filter places (only by search, no top filter)
    const getFilteredPlaces = () => {
        let filtered = places;

        if (searchQuery) {
            filtered = filtered.filter(place =>
                place.placeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.state?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const showPlaceDetails = (place) => {
        setSelectedPlace(place);
        setDetailsModalVisible(true);
    };

    // Delete place (admin function)
    const deletePlace = async (placeId, placeName) => {
        Alert.alert(
            "Delete Place",
            `Are you sure you want to delete "${placeName}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            const response = await api.post(API.DELETE_PLACE, { placeId });
                            if (response.data?.status) {
                                Alert.alert("Success", "Place deleted successfully!");
                                setDetailsModalVisible(false);
                                await fetchPlaces();
                            } else {
                                Alert.alert("Error", response.data?.message || "Failed to delete place");
                            }
                        } catch (error) {
                            Alert.alert("Error", error.response?.data?.message || "Failed to delete place");
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    // ✅ Download places as Excel file
    const downloadPlaces = async () => {
        try {
            setDownloading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'No authentication token');
                return;
            }

            const url = `${BASE_URL}/api/download/places`;
            const fileUri = FileSystem.documentDirectory + 'places.xlsx';

            const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (downloadRes.status !== 200) {
                throw new Error('Download failed');
            }

            Alert.alert('Success', `File saved to:\n${fileUri}`);
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download places list');
        } finally {
            setDownloading(false);
        }
    };

    const renderPlaceItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => showPlaceDetails(item)}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#ffffff', '#f8fafc']}
                    style={styles.cardGradient}
                >
                    <View style={styles.cardHeader}>
                        <PlaceImage
                            imagePath={item.featuredImage}
                            style={styles.avatar}
                        />

                        <View style={styles.placeInfo}>
                            <Text style={styles.placeName} numberOfLines={1}>
                                {item.placeName || "Unnamed Place"}
                            </Text>
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={12} color="#64748b" />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {item.city}, {item.state}
                                </Text>
                            </View>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={12} color="#FFD700" />
                                <Text style={styles.ratingText}>
                                    {item.rating > 0 ? item.rating.toFixed(1) : "New"}
                                </Text>
                                <Ionicons name="eye-outline" size={12} color="#64748b" style={{ marginLeft: 8 }} />
                                <Text style={styles.viewText}>{item.views || 0} views</Text>
                            </View>
                        </View>

                        {item.topPlace && (
                            <View style={styles.topBadge}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={styles.topText}>Top</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.footerLeft}>
                            <Text style={styles.idText}>ID: {item.id}</Text>
                        </View>
                        <View style={styles.dateContainer}>
                            <Ionicons name="calendar-outline" size={12} color="#64748b" />
                            <Text style={styles.dateText}>
                                {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : "N/A"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => showPlaceDetails(item)}
                        >
                            <Ionicons name="eye" size={18} color="#2c5a73" />
                            <Text style={styles.actionText}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => deletePlace(item.id, item.placeName)}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const filteredPlaces = getFilteredPlaces();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#2c5a73" barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient
                colors={['#2c5a73', '#1e3c4f']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.greeting}>Explore Places</Text>
                        <Text style={styles.subtitle}>Tourist Destinations</Text>
                    </View>

                    <View style={styles.headerRight}>
                        {/* Add Place Button */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => navigation.navigate("AddPlaceScreen")}
                        >
                            <Ionicons name="add" size={22} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={downloadPlaces}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="download-outline" size={22} color="#fff" />
                            )}
                        </TouchableOpacity>

                        <View style={styles.countContainer}>
                            <Text style={styles.countNumber}>{filteredPlaces.length}</Text>
                            <Text style={styles.countLabel}>Places</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search places by name, city or state..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>

            {/* PLACES LIST */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c5a73" />
                    <Text style={styles.loadingText}>Loading places...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredPlaces}
                    renderItem={renderPlaceItem}
                    keyExtractor={item => item.id?.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#2c5a73"]}
                            tintColor="#2c5a73"
                        />
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="map-outline" size={80} color="#2c5a73" />
                            <Text style={styles.emptyTitle}>No places found</Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery ? "Try a different search" : "Add places to get started"}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* PLACE DETAILS MODAL (unchanged) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsModalVisible}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Place Details</Text>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {selectedPlace && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalProfileSection}>
                                    <View style={styles.modalAvatarContainer}>
                                        <PlaceImage
                                            imagePath={selectedPlace.featuredImage}
                                            style={styles.modalAvatar}
                                        />
                                    </View>
                                    <Text style={styles.modalPlaceName}>{selectedPlace.placeName}</Text>

                                    <View style={styles.modalPlaceMeta}>
                                        {selectedPlace.topPlace && (
                                            <View style={[styles.modalBadge, { backgroundColor: "#F59E0B" }]}>
                                                <Ionicons name="star" size={14} color="#fff" />
                                                <Text style={styles.modalBadgeText}>Top Place</Text>
                                            </View>
                                        )}
                                        <View style={[styles.modalBadge, { backgroundColor: "#2c5a73" }]}>
                                            <Ionicons name="star" size={14} color="#FFD700" />
                                            <Text style={styles.modalBadgeText}>
                                                {selectedPlace.rating > 0 ? selectedPlace.rating.toFixed(1) : "New"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Location</Text>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="location-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>City:</Text>
                                        <Text style={styles.modalInfoValue}>{selectedPlace.city || "N/A"}</Text>
                                    </View>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="map-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>State:</Text>
                                        <Text style={styles.modalInfoValue}>{selectedPlace.state || "N/A"}</Text>
                                    </View>
                                    {selectedPlace.fullAddress && (
                                        <View style={styles.modalInfoRow}>
                                            <Ionicons name="home-outline" size={18} color="#2c5a73" />
                                            <Text style={styles.modalInfoLabel}>Address:</Text>
                                            <Text style={styles.modalInfoValue}>{selectedPlace.fullAddress}</Text>
                                        </View>
                                    )}
                                </View>

                                {selectedPlace.description && (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Description</Text>
                                        <Text style={styles.modalDescription}>{selectedPlace.description}</Text>
                                    </View>
                                )}

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Stats</Text>
                                    <View style={styles.modalStatsRow}>
                                        <View style={styles.modalStatItem}>
                                            <Ionicons name="eye-outline" size={20} color="#2c5a73" />
                                            <Text style={styles.modalStatValue}>{selectedPlace.views || 0}</Text>
                                            <Text style={styles.modalStatLabel}>Views</Text>
                                        </View>
                                        <View style={styles.modalStatDivider} />
                                        <View style={styles.modalStatItem}>
                                            <Ionicons name="people-outline" size={20} color="#2c5a73" />
                                            <Text style={styles.modalStatValue}>{selectedPlace.guiders || 0}</Text>
                                            <Text style={styles.modalStatLabel}>Guides</Text>
                                        </View>
                                        <View style={styles.modalStatDivider} />
                                        <View style={styles.modalStatItem}>
                                            <Ionicons name="camera-outline" size={20} color="#2c5a73" />
                                            <Text style={styles.modalStatValue}>{selectedPlace.photographers || 0}</Text>
                                            <Text style={styles.modalStatLabel}>Photogs</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.modalActionButton, styles.deleteModalButton]}
                                        onPress={() => deletePlace(selectedPlace.id, selectedPlace.placeName)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="trash-outline" size={18} color="#fff" />
                                                <Text style={styles.modalActionText}>Delete</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ... keep all existing styles from the previous version
    // (We'll reuse the same styles, no changes needed)
    container: { flex: 1, backgroundColor: "#f5f7fa" },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5, shadowColor: '#2c5a73', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, marginTop: -35 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
    menuButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerCenter: { alignItems: "center" },
    greeting: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 2 },
    subtitle: { fontSize: 12, color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    downloadButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    countContainer: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: 'center', minWidth: 60 },
    countNumber: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    countLabel: { fontSize: 10, color: '#fff', opacity: 0.8 },
    searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", elevation: 2 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#1e293b", padding: 0 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 12, fontSize: 16, color: "#2c5a73" },
    listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    card: { borderRadius: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
    cardGradient: { padding: 16 },
    cardHeader: { flexDirection: "row", marginBottom: 12 },
    avatar: { width: 60, height: 60, borderRadius: 12, marginRight: 12, backgroundColor: '#f0f7ff', overflow: 'hidden' },
    avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f7ff' },
    placeInfo: { flex: 1 },
    placeName: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 4 },
    locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 4 },
    locationText: { fontSize: 12, color: "#64748b", flex: 1 },
    ratingRow: { flexDirection: "row", alignItems: "center" },
    ratingText: { fontSize: 12, color: "#F59E0B", fontWeight: "600", marginLeft: 2, marginRight: 4 },
    viewText: { fontSize: 12, color: "#64748b", marginLeft: 2 },
    topBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4, alignSelf: 'flex-start' },
    topText: { fontSize: 10, fontWeight: '600', color: '#F59E0B' },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12, marginBottom: 12 },
    footerLeft: { flexDirection: "row", alignItems: "center" },
    idText: { fontSize: 11, color: "#64748b" },
    dateContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
    dateText: { fontSize: 11, color: "#64748b" },
    quickActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, flexWrap: 'wrap' },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
    actionText: { fontSize: 11, color: '#2c5a73', fontWeight: '500' },
    deleteButton: { backgroundColor: '#fee2e2' },
    deleteText: { color: '#EF4444' },
    emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
    emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#2c5a73", marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: "#64748b", textAlign: "center" },
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
    modalContent: { backgroundColor: "#fff", borderRadius: 24, width: "100%", maxWidth: 500, maxHeight: "90%", padding: 20, elevation: 5 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
    modalProfileSection: { alignItems: "center", marginBottom: 24 },
    modalAvatarContainer: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#f0f7ff', marginBottom: 12, overflow: 'hidden', borderWidth: 3, borderColor: '#2c5a73' },
    modalAvatar: { width: '100%', height: '100%' },
    modalPlaceName: { fontSize: 22, fontWeight: "bold", color: "#1e293b", marginBottom: 8, textAlign: 'center' },
    modalPlaceMeta: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    modalBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    modalBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    modalSection: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    modalSectionTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 12 },
    modalInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    modalInfoLabel: { fontSize: 14, color: "#64748b", marginLeft: 8, marginRight: 4, width: 70 },
    modalInfoValue: { flex: 1, fontSize: 14, color: "#1e293b", fontWeight: "500" },
    modalDescription: { fontSize: 14, color: "#475569", lineHeight: 20 },
    modalStatsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    modalStatItem: { alignItems: 'center' },
    modalStatValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 4 },
    modalStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
    modalStatDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
    modalActions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10, marginBottom: 20 },
    modalActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
    deleteModalButton: { backgroundColor: '#DC2626' },
    modalActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});