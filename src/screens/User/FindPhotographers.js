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
    ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const BASE_URL = "https://localguider.sinfode.com";

export default function FindPhotographers({ navigation }) {
    const [photographers, setPhotographers] = useState([]);
    const [filteredPhotographers, setFilteredPhotographers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("all");
    const [selectedPrice, setSelectedPrice] = useState("all");

    const specialties = [
        { id: "all", label: "All", icon: "camera" },
        { id: "wedding", label: "Wedding", icon: "heart" },
        { id: "portrait", label: "Portrait", icon: "person" },
        { id: "landscape", label: "Landscape", icon: "mountain" },
        { id: "wildlife", label: "Wildlife", icon: "paw" },
        { id: "street", label: "Street", icon: "business" },
    ];

    const priceRanges = [
        { id: "all", label: "Any Price" },
        { id: "budget", label: "Budget (< ₹2000)" },
        { id: "standard", label: "Standard (₹2000-5000)" },
        { id: "premium", label: "Premium (₹5000+)" },
    ];

    useEffect(() => {
        loadPhotographers();
    }, []);

    const loadPhotographers = async () => {
        try {
            setLoading(true);
            const response = await api.post("/photographers/get_all", {
                admin: false,
                status: "approved"
            });
            
            const photographersData = response.data?.data || [];
            
            // Enhanced data for demo
            const enhancedPhotographers = photographersData.map(photographer => ({
                ...photographer,
                rating: (Math.random() * 2 + 3).toFixed(1),
                reviews: Math.floor(Math.random() * 300) + 30,
                specialties: ["wedding", "portrait", "landscape"].slice(0, Math.floor(Math.random() * 3) + 1),
                priceRange: ["budget", "standard", "premium"][Math.floor(Math.random() * 3)],
                price: Math.floor(Math.random() * 5000) + 1000,
                experience: Math.floor(Math.random() * 15) + 1,
                portfolio: Array(3).fill().map(() => `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000)}?w=400`),
                avatar: photographer.photograph || `https://ui-avatars.com/api/?name=${photographer.name || photographer.firmName}&background=e76f51&color=fff&size=200`,
                available: Math.random() > 0.2,
            }));
            
            setPhotographers(enhancedPhotographers);
            setFilteredPhotographers(enhancedPhotographers);
        } catch (error) {
            console.error("Error loading photographers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        filterPhotographers();
    }, [searchQuery, selectedSpecialty, selectedPrice, photographers]);

    const filterPhotographers = () => {
        let filtered = [...photographers];

        if (searchQuery.trim()) {
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.firmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.city?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedSpecialty !== "all") {
            filtered = filtered.filter(p =>
                p.specialties?.includes(selectedSpecialty)
            );
        }

        if (selectedPrice !== "all") {
            filtered = filtered.filter(p => p.priceRange === selectedPrice);
        }

        setFilteredPhotographers(filtered);
    };

    const renderSpecialtyChip = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.specialtyChip,
                selectedSpecialty === item.id && styles.specialtyChipActive,
            ]}
            onPress={() => setSelectedSpecialty(item.id)}
        >
            <Ionicons
                name={item.icon}
                size={16}
                color={selectedSpecialty === item.id ? "#fff" : "#64748b"}
            />
            <Text
                style={[
                    styles.specialtyChipText,
                    selectedSpecialty === item.id && styles.specialtyChipTextActive,
                ]}
            >
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    const renderPriceFilter = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.priceChip,
                selectedPrice === item.id && styles.priceChipActive,
            ]}
            onPress={() => setSelectedPrice(item.id)}
        >
            <Text
                style={[
                    styles.priceChipText,
                    selectedPrice === item.id && styles.priceChipTextActive,
                ]}
            >
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    const renderPhotographerCard = ({ item }) => (
        <TouchableOpacity
            style={styles.photographerCard}
            onPress={() => navigation.navigate("PhotographerProfile", { photographerId: item.id })}
        >
            {/* Cover Image with Avatar Overlay */}
            <View style={styles.coverContainer}>
                <Image 
                    source={{ uri: item.portfolio?.[0] || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400" }} 
                    style={styles.coverImage}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.coverGradient}
                />
                
                {/* Avatar */}
                <Image source={{ uri: item.avatar }} style={styles.photographerAvatar} />
                
                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    <Text style={styles.reviewsText}>({item.reviews})</Text>
                </View>

                {/* Availability Badge */}
                <View style={[styles.availabilityBadge, item.available ? styles.available : styles.unavailable]}>
                    <Text style={styles.availabilityText}>
                        {item.available ? "Available Now" : "Booked"}
                    </Text>
                </View>
            </View>

            <View style={styles.photographerInfo}>
                <Text style={styles.photographerName}>{item.firmName || item.name || "Photographer"}</Text>
                
                {/* Specialties */}
                <View style={styles.specialtiesContainer}>
                    {item.specialties?.map((spec, index) => {
                        const specialty = specialties.find(s => s.id === spec);
                        return (
                            <View key={index} style={styles.specialtyTag}>
                                <Ionicons name={specialty?.icon || "camera"} size={12} color="#2a9d8f" />
                                <Text style={styles.specialtyTagText}>{specialty?.label || spec}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="briefcase-outline" size={14} color="#64748b" />
                        <Text style={styles.statText}>{item.experience} years</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="images-outline" size={14} color="#64748b" />
                        <Text style={styles.statText}>{item.portfolio?.length || 0}+ shoots</Text>
                    </View>
                </View>

                {/* Price and Book Button */}
                <View style={styles.footer}>
                    <View style={styles.priceInfo}>
                        <Text style={styles.priceLabel}>Starting from</Text>
                        <Text style={styles.priceValue}>₹{item.price}</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.bookButton}>
                        <Text style={styles.bookButtonText}>View Portfolio</Text>
                    </TouchableOpacity>
                </View>

                {/* Portfolio Preview */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioPreview}>
                    {item.portfolio?.map((photo, index) => (
                        <Image key={index} source={{ uri: photo }} style={styles.previewImage} />
                    ))}
                </ScrollView>
            </View>
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
                <Text style={styles.headerTitle}>Find Photographers</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="options-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search photographers..."
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

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <Text style={styles.filterLabel}>Specialty:</Text>
                <FlatList
                    data={specialties}
                    renderItem={renderSpecialtyChip}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersList}
                />

                <Text style={[styles.filterLabel, { marginTop: 12 }]}>Budget:</Text>
                <FlatList
                    data={priceRanges}
                    renderItem={renderPriceFilter}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersList}
                />
            </View>

            {/* Results Count */}
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    {filteredPhotographers.length} photographers found
                </Text>
            </View>

            {/* Photographers List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2a9d8f" />
                    <Text style={styles.loadingText}>Finding talented photographers...</Text>
                </View>
            ) : filteredPhotographers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="camera-outline" size={60} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No photographers found</Text>
                    <Text style={styles.emptyText}>Try adjusting your filters</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredPhotographers}
                    renderItem={renderPhotographerCard}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.photographersList}
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
    filterButton: {
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
    filtersContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 8,
    },
    filtersList: {
        gap: 8,
    },
    specialtyChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: 6,
        marginRight: 8,
    },
    specialtyChipActive: {
        backgroundColor: "#2a9d8f",
        borderColor: "#2a9d8f",
    },
    specialtyChipText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748b",
    },
    specialtyChipTextActive: {
        color: "#fff",
    },
    priceChip: {
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginRight: 8,
    },
    priceChipActive: {
        backgroundColor: "#2a9d8f",
        borderColor: "#2a9d8f",
    },
    priceChipText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748b",
    },
    priceChipTextActive: {
        color: "#fff",
    },
    statsContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    statsText: {
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
    photographersList: {
        padding: 16,
        paddingTop: 0,
    },
    photographerCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        marginBottom: 20,
        overflow: "hidden",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    coverContainer: {
        height: 150,
        position: "relative",
    },
    coverImage: {
        width: "100%",
        height: "100%",
    },
    coverGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    photographerAvatar: {
        position: "absolute",
        bottom: -30,
        left: 20,
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: "#fff",
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
    availabilityBadge: {
        position: "absolute",
        top: 16,
        right: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    available: {
        backgroundColor: "#10B981",
    },
    unavailable: {
        backgroundColor: "#EF4444",
    },
    availabilityText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
    },
    photographerInfo: {
        padding: 20,
        paddingTop: 40,
    },
    photographerName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 8,
    },
    specialtiesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    specialtyTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff1ee",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    specialtyTagText: {
        fontSize: 11,
        color: "#2a9d8f",
        fontWeight: "500",
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: "#64748b",
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: "#e2e8f0",
        marginHorizontal: 12,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    priceInfo: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },
    priceLabel: {
        fontSize: 12,
        color: "#64748b",
    },
    priceValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2a9d8f",
    },
    bookButton: {
        backgroundColor: "#2a9d8f",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bookButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
    portfolioPreview: {
        marginTop: 8,
    },
    previewImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 8,
    },
});