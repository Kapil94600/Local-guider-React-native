import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Dimensions,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const BASE_URL = "https://localguider.sinfode.com";

export default function ExplorePlaces({ navigation }) {
    const [places, setPlaces] = useState([]);
    const [filteredPlaces, setFilteredPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [refreshing, setRefreshing] = useState(false);

    const categories = [
        { id: "all", label: "All", icon: "apps" },
        { id: "historical", label: "Historical", icon: "business" },
        { id: "religious", label: "Religious", icon: "church" },
        { id: "nature", label: "Nature", icon: "leaf" },
        { id: "adventure", label: "Adventure", icon: "bicycle" },
        { id: "beach", label: "Beach", icon: "umbrella" },
        { id: "hillstation", label: "Hill Station", icon: "mountain" },
    ];

    useEffect(() => {
        loadPlaces();
    }, []);

    const loadPlaces = async () => {
        try {
            setLoading(true);
            const response = await api.post("/places/get", {
                page: 1,
                perPage: 50,
            });
            
            const placesData = response.data?.data || [];
            
            // Add random ratings and categories for demo
            const enhancedPlaces = placesData.map(place => ({
                ...place,
                rating: (Math.random() * 2 + 3).toFixed(1),
                reviews: Math.floor(Math.random() * 500) + 50,
                category: categories[Math.floor(Math.random() * (categories.length - 1)) + 1].id,
                image: place.thumbnail || "https://images.unsplash.com/photo-1548013146-72479768bada?w=500",
                price: Math.floor(Math.random() * 2000) + 500,
            }));
            
            setPlaces(enhancedPlaces);
            setFilteredPlaces(enhancedPlaces);
        } catch (error) {
            console.error("Error loading places:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadPlaces();
    };

    useEffect(() => {
        filterPlaces();
    }, [searchQuery, selectedCategory, places]);

    const filterPlaces = () => {
        let filtered = [...places];

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(place =>
                place.placeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter(place => place.category === selectedCategory);
        }

        setFilteredPlaces(filtered);
    };

    const renderCategoryChip = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
        >
            <Ionicons
                name={item.icon}
                size={18}
                color={selectedCategory === item.id ? "#fff" : "#64748b"}
            />
            <Text
                style={[
                    styles.categoryChipText,
                    selectedCategory === item.id && styles.categoryChipTextActive,
                ]}
            >
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    const renderPlaceCard = ({ item }) => (
        <TouchableOpacity
            style={styles.placeCard}
            onPress={() => navigation.navigate("PlaceDetails", { placeId: item.id })}
        >
            <Image source={{ uri: item.image }} style={styles.placeImage} />
            
            {/* Favorite Button */}
            <TouchableOpacity style={styles.favoriteBtn}>
                <Ionicons name="heart-outline" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
                <Text style={styles.reviewsText}>({item.reviews})</Text>
            </View>

            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.placeGradient}
            >
                <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{item.placeName}</Text>
                    
                    <View style={styles.placeLocation}>
                        <Ionicons name="location" size={14} color="#fff" />
                        <Text style={styles.locationText}>{item.city || "Unknown"}</Text>
                    </View>

                    <View style={styles.placeFooter}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Starting from</Text>
                            <Text style={styles.priceValue}>₹{item.price}</Text>
                        </View>
                        
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>
                                {categories.find(c => c.id === item.category)?.label || "Place"}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#1a2f3a', '#264653', '#2a9d8f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Explore Places</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search places, cities..."
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

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <FlatList
                    data={categories}
                    renderItem={renderCategoryChip}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                />
            </View>

            {/* Results Count */}
            <View style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                    {filteredPlaces.length} places found
                </Text>
            </View>

            {/* Places List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2a9d8f" />
                    <Text style={styles.loadingText}>Discovering amazing places...</Text>
                </View>
            ) : filteredPlaces.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="map-outline" size={60} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No places found</Text>
                    <Text style={styles.emptyText}>
                        Try adjusting your search or filters
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredPlaces}
                    renderItem={renderPlaceCard}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.placesList}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
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
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: "#1e293b",
    },
    categoriesContainer: {
        marginBottom: 12,
    },
    categoriesList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: 6,
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: "#2a9d8f",
        borderColor: "#2a9d8f",
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748b",
    },
    categoryChipTextActive: {
        color: "#fff",
    },
    resultsContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    resultsText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
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
    },
    placesList: {
        padding: 16,
        paddingTop: 0,
    },
    placeCard: {
        width: CARD_WIDTH,
        height: 280,
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    placeImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    favoriteBtn: {
        position: "absolute",
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    ratingBadge: {
        position: "absolute",
        top: 16,
        left: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
        zIndex: 10,
    },
    ratingText: {
        color: "#FFD700",
        fontSize: 13,
        fontWeight: "600",
    },
    reviewsText: {
        color: "#fff",
        fontSize: 11,
        opacity: 0.8,
    },
    placeGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 140,
        justifyContent: "flex-end",
        padding: 16,
    },
    placeInfo: {
        gap: 6,
    },
    placeName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    placeLocation: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    locationText: {
        fontSize: 13,
        color: "#fff",
        opacity: 0.9,
    },
    placeFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },
    priceLabel: {
        fontSize: 11,
        color: "#fff",
        opacity: 0.7,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFD700",
    },
    categoryTag: {
        backgroundColor: "rgba(42,157,143,0.9)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryTagText: {
        fontSize: 11,
        color: "#fff",
        fontWeight: "600",
    },
});