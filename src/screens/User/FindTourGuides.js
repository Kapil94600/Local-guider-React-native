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
const CARD_WIDTH = (width - 48) / 2;
const BASE_URL = "https://localguider.sinfode.com";

export default function FindTourGuides({ navigation }) {
    const [guides, setGuides] = useState([]);
    const [filteredGuides, setFilteredGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("all");
    const [viewMode, setViewMode] = useState("grid"); // grid or list

    const languages = [
        { id: "all", label: "All", icon: "globe" },
        { id: "hindi", label: "Hindi", icon: "language" },
        { id: "english", label: "English", icon: "language" },
        { id: "french", label: "French", icon: "language" },
        { id: "spanish", label: "Spanish", icon: "language" },
        { id: "german", label: "German", icon: "language" },
    ];

    useEffect(() => {
        loadGuides();
    }, []);

    const loadGuides = async () => {
        try {
            setLoading(true);
            const response = await api.post("/guider/get_all", {
                admin: false,
                status: "approved"
            });
            
            const guidesData = response.data?.data || [];
            
            // Enhanced data for demo
            const enhancedGuides = guidesData.map(guide => ({
                ...guide,
                rating: (Math.random() * 2 + 3).toFixed(1),
                reviews: Math.floor(Math.random() * 200) + 20,
                languages: ["Hindi", "English", "French"].slice(0, Math.floor(Math.random() * 3) + 1),
                price: Math.floor(Math.random() * 1500) + 500,
                experience: Math.floor(Math.random() * 10) + 2,
                avatar: guide.photograph || `https://ui-avatars.com/api/?name=${guide.name || guide.firmName}&background=2a9d8f&color=fff&size=200`,
                available: Math.random() > 0.3,
            }));
            
            setGuides(enhancedGuides);
            setFilteredGuides(enhancedGuides);
        } catch (error) {
            console.error("Error loading guides:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        filterGuides();
    }, [searchQuery, selectedLanguage, guides]);

    const filterGuides = () => {
        let filtered = [...guides];

        if (searchQuery.trim()) {
            filtered = filtered.filter(guide =>
                guide.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                guide.firmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                guide.city?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedLanguage !== "all") {
            filtered = filtered.filter(guide =>
                guide.languages?.some(lang => lang.toLowerCase() === selectedLanguage)
            );
        }

        setFilteredGuides(filtered);
    };

    const renderLanguageChip = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.languageChip,
                selectedLanguage === item.id && styles.languageChipActive,
            ]}
            onPress={() => setSelectedLanguage(item.id)}
        >
            <Ionicons
                name={item.icon}
                size={16}
                color={selectedLanguage === item.id ? "#fff" : "#64748b"}
            />
            <Text
                style={[
                    styles.languageChipText,
                    selectedLanguage === item.id && styles.languageChipTextActive,
                ]}
            >
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    const renderGuideCard = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.guideCard,
                viewMode === "list" && styles.guideCardList,
            ]}
            onPress={() => navigation.navigate("GuideProfile", { guideId: item.id })}
        >
            <Image source={{ uri: item.avatar }} style={styles.guideAvatar} />
            
            {/* Availability Badge */}
            <View style={[styles.availabilityBadge, item.available ? styles.available : styles.unavailable]}>
                <Text style={styles.availabilityText}>
                    {item.available ? "Available" : "Busy"}
                </Text>
            </View>

            <View style={styles.guideInfo}>
                <Text style={styles.guideName}>{item.firmName || item.name || "Tour Guide"}</Text>
                
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    <Text style={styles.reviewCount}>({item.reviews} reviews)</Text>
                </View>

                <View style={styles.languagesContainer}>
                    {item.languages?.map((lang, index) => (
                        <View key={index} style={styles.languageTag}>
                            <Text style={styles.languageTagText}>{lang}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.guideFooter}>
                    <View style={styles.experienceContainer}>
                        <Ionicons name="briefcase-outline" size={14} color="#64748b" />
                        <Text style={styles.experienceText}>{item.experience} years</Text>
                    </View>
                    
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>₹{item.price}</Text>
                        <Text style={styles.priceUnit}>/day</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Find Tour Guides</Text>
                <TouchableOpacity 
                    style={styles.viewToggle}
                    onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                >
                    <Ionicons 
                        name={viewMode === "grid" ? "list" : "grid"} 
                        size={22} 
                        color="#fff" 
                    />
                </TouchableOpacity>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search guides by name or location..."
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

            {/* Languages Filter */}
            <View style={styles.languagesContainer}>
                <FlatList
                    data={languages}
                    renderItem={renderLanguageChip}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.languagesList}
                />
            </View>

            {/* Results Stats */}
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    {filteredGuides.length} guides available
                </Text>
            </View>

            {/* Guides Grid/List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2a9d8f" />
                    <Text style={styles.loadingText}>Finding best guides for you...</Text>
                </View>
            ) : filteredGuides.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={60} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No guides found</Text>
                    <Text style={styles.emptyText}>Try adjusting your filters</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredGuides}
                    renderItem={renderGuideCard}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    numColumns={viewMode === "grid" ? 2 : 1}
                    key={viewMode}
                    contentContainerStyle={styles.guidesList}
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
    viewToggle: {
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
    languagesContainer: {
        marginBottom: 12,
    },
    languagesList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    languageChip: {
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
    languageChipActive: {
        backgroundColor: "#2a9d8f",
        borderColor: "#2a9d8f",
    },
    languageChipText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#64748b",
    },
    languageChipTextActive: {
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
    guidesList: {
        padding: 16,
        paddingTop: 0,
    },
    guideCard: {
        width: CARD_WIDTH,
        backgroundColor: "#fff",
        borderRadius: 16,
        marginHorizontal: 4,
        marginBottom: 16,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    guideCardList: {
        width: "100%",
        flexDirection: "row",
        marginHorizontal: 0,
    },
    guideAvatar: {
        width: "100%",
        height: 150,
        resizeMode: "cover",
    },
    guideCardList: {
        flexDirection: "row",
        width: "100%",
        marginHorizontal: 0,
    },
    guideCardList: {
        flexDirection: "row",
        width: "100%",
        marginHorizontal: 0,
    },
    guideCardList: {
        flexDirection: "row",
        width: "100%",
        marginHorizontal: 0,
    },
    guideAvatar: {
        width: "100%",
        height: 150,
    },
    availabilityBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
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
        fontSize: 10,
        fontWeight: "600",
    },
    guideInfo: {
        padding: 12,
    },
    guideName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1e293b",
    },
    reviewCount: {
        fontSize: 11,
        color: "#64748b",
    },
    languagesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 8,
    },
    languageTag: {
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    languageTagText: {
        fontSize: 10,
        color: "#64748b",
    },
    guideFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    experienceContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    experienceText: {
        fontSize: 11,
        color: "#64748b",
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 2,
    },
    priceLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2a9d8f",
    },
    priceUnit: {
        fontSize: 10,
        color: "#64748b",
    },
    bookButton: {
        backgroundColor: "#2a9d8f",
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    bookButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
});