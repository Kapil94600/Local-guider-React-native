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

// 🔥 Get image URL from filename
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/^\/+/, '');
    return `${BASE_URL}/api/image/download/${cleanPath}`;
};

// Time-based greeting
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
};

export default function UserListScreen({ navigation }) {
    const { user: currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState("all");
    const [downloading, setDownloading] = useState(false);

    // Edit form states
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [editAddress, setEditAddress] = useState("");
    const [editGender, setEditGender] = useState("");
    const [editDob, setEditDob] = useState("");
    const [editStatus, setEditStatus] = useState("active");

    const greeting = getGreeting();

    // Fetch users from API
    const fetchUsers = async () => {
        try {
            console.log("📡 Fetching users...");

            const response = await api.post(API.GET_USER_LIST, {
                page: 1,
                perPage: 100,
            });

            const responseData = response.data || {};
            console.log("👥 Users Full Response:", JSON.stringify(responseData, null, 2));

            const usersData = responseData.data || [];
            console.log("👥 Users Array:", usersData.length);

            // Format users data - EXCLUDE ADMINS
            const formattedUsers = usersData
                .filter(user => !user.admin)
                .filter(user => user.admin !== true)
                .map(user => ({
                    id: user.id || user._id,
                    name: user.name || "Unknown User",
                    username: user.username || "",
                    email: user.email || "No email",
                    phone: user.phone || "No phone",
                    countryCode: user.countryCode || "+91",
                    address: user.address || "",
                    gender: user.gender || "",
                    dob: user.dob || "",
                    role: getUserRole(user),
                    status: user.isActive ? "active" : "inactive",
                    createdAt: user.createdOn || user.createdAt || new Date().toISOString(),
                    profilePicture: user.profilePicture,
                    isAdmin: user.admin || false,
                    isPhotographer: user.photographer || false,
                    isGuider: user.guider || false,
                    isVerified: user.isVerified || false,
                    balance: user.balance || 0,
                    latitude: user.latitude || 0,
                    longitude: user.longitude || 0,
                    lastUpdate: user.lastUpdate || "",
                }));

            setUsers(formattedUsers);

        } catch (error) {
            console.error("❌ Error fetching users:", error.response?.data || error.message);
            Alert.alert(
                "Error",
                "Failed to load users. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Determine user role
    const getUserRole = (user) => {
        if (user.photographer) return "Photographer";
        if (user.guider) return "Tour Guide";
        return "Tourist";
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
    };

    // Filter users
    const getFilteredUsers = () => {
        let filtered = users;

        if (searchQuery) {
            filtered = filtered.filter(user =>
                user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.phone?.includes(searchQuery) ||
                user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.username?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        switch (filter) {
            case "active":
                filtered = filtered.filter(user => user.status === "active");
                break;
            case "inactive":
                filtered = filtered.filter(user => user.status === "inactive");
                break;
            case "photographer":
                filtered = filtered.filter(user => user.isPhotographer);
                break;
            case "guider":
                filtered = filtered.filter(user => user.isGuider);
                break;
            case "tourist":
                filtered = filtered.filter(user => !user.isPhotographer && !user.isGuider);
                break;
            default:
                break;
        }

        return filtered;
    };

    const showUserDetails = (user) => {
        setSelectedUser(user);
        setDetailsModalVisible(true);
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setEditName(user.name || "");
        setEditEmail(user.email || "");
        setEditPhone(user.phone || "");
        setEditUsername(user.username || "");
        setEditAddress(user.address || "");
        setEditGender(user.gender || "");
        setEditDob(user.dob || "");
        setEditStatus(user.status || "active");
        setEditModalVisible(true);
    };

    // Update user
    const updateUser = async () => {
        if (!editName.trim()) {
            Alert.alert("Error", "Name is required");
            return;
        }

        try {
            setActionLoading(true);

            const params = new URLSearchParams();
            params.append("userId", selectedUser.id.toString());
            if (editName) params.append("name", editName);
            if (editEmail) params.append("email", editEmail);
            if (editPhone) params.append("phone", editPhone);
            if (editUsername) params.append("username", editUsername);
            if (editAddress) params.append("address", editAddress);
            if (editGender) params.append("gender", editGender);
            if (editDob) params.append("dob", editDob);
            params.append("isActive", editStatus === "active" ? "true" : "false");

            const response = await api.post(API.UPDATE_PROFILE, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data?.status) {
                Alert.alert("Success", "User updated successfully!");
                setEditModalVisible(false);
                await fetchUsers();
            } else {
                Alert.alert("Error", response.data?.message || "Failed to update user");
            }
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Failed to update user");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete user
    const deleteUser = async (userId, userName) => {
        Alert.alert(
            "Delete User",
            `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setActionLoading(true);

                            const params = new URLSearchParams();
                            params.append("userId", userId.toString());

                            const response = await api.post(API.DELETE_USER, params.toString(), {
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            });

                            if (response.data?.status) {
                                Alert.alert("Success", "User deleted successfully!");
                                setDetailsModalVisible(false);
                                await fetchUsers();
                            } else {
                                Alert.alert("Error", response.data?.message || "Failed to delete user");
                            }
                        } catch (error) {
                            Alert.alert("Error", error.response?.data?.message || "Failed to delete user");
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    // Update user status
    const updateUserStatus = async (userId, currentStatus, userName) => {
        Alert.alert(
            `${currentStatus ? "Deactivate" : "Activate"} User`,
            `Are you sure you want to ${currentStatus ? "deactivate" : "activate"} "${userName}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: currentStatus ? "Deactivate" : "Activate",
                    onPress: async () => {
                        try {
                            setActionLoading(true);

                            const params = new URLSearchParams();
                            params.append("userId", userId.toString());
                            params.append("isActive", (!currentStatus).toString());

                            const response = await api.post(API.UPDATE_PROFILE, params.toString(), {
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            });

                            if (response.data?.status) {
                                Alert.alert(
                                    "Success",
                                    `User ${!currentStatus ? "activated" : "deactivated"} successfully!`
                                );
                                setDetailsModalVisible(false);
                                await fetchUsers();
                            } else {
                                Alert.alert("Error", response.data?.message || "Failed to update status");
                            }
                        } catch (error) {
                            Alert.alert("Error", error.response?.data?.message || "Failed to update user status");
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    // ✅ UPDATED: Download users as Excel file (without sharing)
    const downloadUsers = async () => {
        try {
            setDownloading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'No authentication token');
                return;
            }

            const url = `${BASE_URL}/api/download/users`;
            const fileUri = FileSystem.documentDirectory + 'users.xlsx';

            const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (downloadRes.status !== 200) {
                throw new Error('Download failed');
            }

            // Only show success message with file path
            Alert.alert('Success', `File saved to:\n${fileUri}`);
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download users list');
        } finally {
            setDownloading(false);
        }
    };

    const getAvatarColor = (name) => {
        const colors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
        if (!name) return colors[0];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const getRoleColor = (role) => {
        switch (role) {
            case "Photographer": return "#F59E0B";
            case "Tour Guide": return "#10B981";
            default: return "#3B82F6";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch (e) {
            return "Invalid Date";
        }
    };

    const renderFilterButton = (filterType, label, icon) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filterType)}
        >
            <Ionicons
                name={icon}
                size={16}
                color={filter === filterType ? "#2c5a73" : "#fff"}
            />
            <Text style={[
                styles.filterButtonText,
                filter === filterType && styles.filterButtonTextActive
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderUserItem = ({ item }) => {
        const avatarColor = getAvatarColor(item.name);
        const imageUrl = item.profilePicture ? getImageUrl(item.profilePicture) : null;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => showUserDetails(item)}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#ffffff', '#f8fafc']}
                    style={styles.cardGradient}
                >
                    <View style={styles.cardHeader}>
                        {/* Profile Picture or Avatar */}
                        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                            {imageUrl ? (
                                <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.avatarImage}
                                    onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                                />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {item.name?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            )}
                        </View>

                        <View style={styles.userInfo}>
                            <Text style={styles.userName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={styles.userEmail} numberOfLines={1}>
                                {item.email}
                            </Text>
                            <View style={styles.userMetaRow}>
                                <Ionicons name="call-outline" size={12} color="#64748b" />
                                <Text style={styles.userPhone} numberOfLines={1}>
                                    {item.countryCode} {item.phone}
                                </Text>
                            </View>
                        </View>

                        <View style={[
                            styles.statusDot,
                            { backgroundColor: item.status === "active" ? "#10B981" : "#EF4444" }
                        ]} />
                    </View>

                    {/* User Stats & Role */}
                    <View style={styles.cardFooter}>
                        <View style={styles.statItem}>
                            <Ionicons name="wallet-outline" size={14} color="#2c5a73" />
                            <Text style={styles.statValue}>₹{item.balance?.toLocaleString() || 0}</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                            <Ionicons name="calendar-outline" size={14} color="#2c5a73" />
                            <Text style={styles.statValue}>
                                {formatDate(item.createdAt)}
                            </Text>
                        </View>

                        <View style={[styles.roleBadge, {
                            backgroundColor: getRoleColor(item.role) + '20'
                        }]}>
                            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                                {item.role}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const filteredUsers = getFilteredUsers();

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
                        <Text style={styles.greeting}>{greeting}, Admin</Text>
                        <Text style={styles.subtitle}>User Management</Text>
                    </View>

                    {/* Download Button */}
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.downloadButton}
                            onPress={downloadUsers}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="download-outline" size={22} color="#fff" />
                            )}
                        </TouchableOpacity>

                        <View style={styles.userCountContainer}>
                            <Text style={styles.userCountNumber}>{filteredUsers.length}</Text>
                            <Text style={styles.userCountLabel}>Users</Text>
                        </View>
                    </View>
                </View>

                {/* Filter Buttons */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                >
                    <View style={styles.filterContainer}>
                        {renderFilterButton("all", "All", "people")}
                        {renderFilterButton("active", "Active", "checkmark-circle")}
                        {renderFilterButton("inactive", "Inactive", "close-circle")}
                        {renderFilterButton("photographer", "Photo", "camera")}
                        {renderFilterButton("guider", "Guide", "map")}
                        {renderFilterButton("tourist", "Tourist", "person")}
                    </View>
                </ScrollView>
            </LinearGradient>

            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users by name, email or phone..."
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

            {/* USER LIST */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2c5a73" />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUserItem}
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
                            <Ionicons name="people-outline" size={80} color="#2c5a73" />
                            <Text style={styles.emptyTitle}>No users found</Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery ? "Try a different search" : "No users registered yet"}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* USER DETAILS MODAL */}
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
                            <Text style={styles.modalTitle}>User Details</Text>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {selectedUser && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Profile Section */}
                                <View style={styles.modalProfileSection}>
                                    <View style={[styles.modalAvatar, {
                                        backgroundColor: getAvatarColor(selectedUser.name)
                                    }]}>
                                        {selectedUser.profilePicture ? (
                                            <Image
                                                source={{ uri: getImageUrl(selectedUser.profilePicture) }}
                                                style={styles.modalAvatarImage}
                                            />
                                        ) : (
                                            <Text style={styles.modalAvatarText}>
                                                {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                                            </Text>
                                        )}
                                    </View>

                                    <Text style={styles.modalUserName}>{selectedUser.name}</Text>

                                    <View style={styles.modalUserMeta}>
                                        <View style={[styles.roleBadge, {
                                            backgroundColor: getRoleColor(selectedUser.role) + '20',
                                            paddingHorizontal: 12,
                                            paddingVertical: 4,
                                        }]}>
                                            <Text style={[styles.roleText, { color: getRoleColor(selectedUser.role) }]}>
                                                {selectedUser.role}
                                            </Text>
                                        </View>

                                        <View style={[styles.statusBadge, {
                                            backgroundColor: selectedUser.status === "active" ? "#10B981" : "#EF4444"
                                        }]}>
                                            <Ionicons
                                                name={selectedUser.status === "active" ? "checkmark-circle" : "close-circle"}
                                                size={14}
                                                color="#fff"
                                            />
                                            <Text style={styles.statusText}>
                                                {selectedUser.status?.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Personal Information */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Personal Information</Text>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="person-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>Username:</Text>
                                        <Text style={styles.modalInfoValue}>{selectedUser.username || "N/A"}</Text>
                                    </View>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="mail-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>Email:</Text>
                                        <Text style={styles.modalInfoValue}>{selectedUser.email}</Text>
                                    </View>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="call-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>Phone:</Text>
                                        <Text style={styles.modalInfoValue}>{selectedUser.countryCode} {selectedUser.phone}</Text>
                                    </View>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="location-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>Address:</Text>
                                        <Text style={styles.modalInfoValue}>{selectedUser.address || "N/A"}</Text>
                                    </View>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="male-female-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>Gender:</Text>
                                        <Text style={styles.modalInfoValue}>{selectedUser.gender || "N/A"}</Text>
                                    </View>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="calendar-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>DOB:</Text>
                                        <Text style={styles.modalInfoValue}>{selectedUser.dob || "N/A"}</Text>
                                    </View>
                                </View>

                                {/* Account Information */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Account Information</Text>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="wallet-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>Balance:</Text>
                                        <Text style={[styles.modalInfoValue, { color: "#10B981", fontWeight: "bold" }]}>
                                            ₹{selectedUser.balance?.toLocaleString() || 0}
                                        </Text>
                                    </View>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="time-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>Member Since:</Text>
                                        <Text style={styles.modalInfoValue}>{formatDate(selectedUser.createdAt)}</Text>
                                    </View>

                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="refresh-outline" size={18} color="#2c5a73" />
                                        <Text style={styles.modalInfoLabel}>Last Update:</Text>
                                        <Text style={styles.modalInfoValue}>{formatDate(selectedUser.lastUpdate)}</Text>
                                    </View>
                                </View>

                                {/* Roles */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Roles & Permissions</Text>

                                    <View style={styles.roleChips}>
                                        {selectedUser.isPhotographer && (
                                            <View style={[styles.roleChip, { backgroundColor: "#F59E0B20" }]}>
                                                <Ionicons name="camera" size={14} color="#F59E0B" />
                                                <Text style={[styles.roleChipText, { color: "#F59E0B" }]}>Photographer</Text>
                                            </View>
                                        )}

                                        {selectedUser.isGuider && (
                                            <View style={[styles.roleChip, { backgroundColor: "#10B98120" }]}>
                                                <Ionicons name="map" size={14} color="#10B981" />
                                                <Text style={[styles.roleChipText, { color: "#10B981" }]}>Tour Guide</Text>
                                            </View>
                                        )}

                                        {!selectedUser.isPhotographer && !selectedUser.isGuider && (
                                            <View style={[styles.roleChip, { backgroundColor: "#3B82F620" }]}>
                                                <Ionicons name="person" size={14} color="#3B82F6" />
                                                <Text style={[styles.roleChipText, { color: "#3B82F6" }]}>Tourist</Text>
                                            </View>
                                        )}

                                        {selectedUser.isVerified && (
                                            <View style={[styles.roleChip, { backgroundColor: "#8B5CF620" }]}>
                                                <Ionicons name="checkmark-circle" size={14} color="#8B5CF6" />
                                                <Text style={[styles.roleChipText, { color: "#8B5CF6" }]}>Verified</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.editButton]}
                                        onPress={() => {
                                            setDetailsModalVisible(false);
                                            openEditModal(selectedUser);
                                        }}
                                    >
                                        <Ionicons name="create-outline" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Edit</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton,
                                            selectedUser.status === "active" ? styles.deactivateButton : styles.activateButton
                                        ]}
                                        onPress={() => updateUserStatus(
                                            selectedUser.id,
                                            selectedUser.status === "active",
                                            selectedUser.name
                                        )}
                                    >
                                        <Ionicons
                                            name={selectedUser.status === "active" ? "pause-circle" : "play-circle"}
                                            size={18}
                                            color="#fff"
                                        />
                                        <Text style={styles.actionButtonText}>
                                            {selectedUser.status === "active" ? "Deactivate" : "Activate"}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => deleteUser(selectedUser.id, selectedUser.name)}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#fff" />
                                        <Text style={styles.actionButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* EDIT USER MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit User</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.editForm}>
                                <Text style={styles.inputLabel}>Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Enter name"
                                    placeholderTextColor="#94a3b8"
                                />

                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editEmail}
                                    onChangeText={setEditEmail}
                                    placeholder="Enter email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#94a3b8"
                                />

                                <Text style={styles.inputLabel}>Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    placeholder="Enter phone"
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#94a3b8"
                                />

                                <Text style={styles.inputLabel}>Username</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editUsername}
                                    onChangeText={setEditUsername}
                                    placeholder="Enter username"
                                    autoCapitalize="none"
                                    placeholderTextColor="#94a3b8"
                                />

                                <Text style={styles.inputLabel}>Address</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editAddress}
                                    onChangeText={setEditAddress}
                                    placeholder="Enter address"
                                    multiline
                                    numberOfLines={2}
                                    placeholderTextColor="#94a3b8"
                                />

                                <Text style={styles.inputLabel}>Gender</Text>
                                <View style={styles.genderContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.genderOption,
                                            editGender === "male" && styles.genderOptionSelected,
                                        ]}
                                        onPress={() => setEditGender("male")}
                                    >
                                        <Text style={[
                                            styles.genderText,
                                            editGender === "male" && styles.genderTextSelected,
                                        ]}>Male</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.genderOption,
                                            editGender === "female" && styles.genderOptionSelected,
                                        ]}
                                        onPress={() => setEditGender("female")}
                                    >
                                        <Text style={[
                                            styles.genderText,
                                            editGender === "female" && styles.genderTextSelected,
                                        ]}>Female</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.genderOption,
                                            editGender === "other" && styles.genderOptionSelected,
                                        ]}
                                        onPress={() => setEditGender("other")}
                                    >
                                        <Text style={[
                                            styles.genderText,
                                            editGender === "other" && styles.genderTextSelected,
                                        ]}>Other</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>Date of Birth</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editDob}
                                    onChangeText={setEditDob}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#94a3b8"
                                />

                                <Text style={styles.inputLabel}>Status</Text>
                                <View style={styles.statusContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            editStatus === "active" && styles.statusOptionActive,
                                        ]}
                                        onPress={() => setEditStatus("active")}
                                    >
                                        <Text style={[
                                            styles.statusText,
                                            editStatus === "active" && styles.statusTextActive,
                                        ]}>Active</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.statusOption,
                                            editStatus === "inactive" && styles.statusOptionInactive,
                                        ]}
                                        onPress={() => setEditStatus("inactive")}
                                    >
                                        <Text style={[
                                            styles.statusText,
                                            editStatus === "inactive" && styles.statusTextInactive,
                                        ]}>Inactive</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={[styles.editButton, styles.cancelEditButton]}
                                    onPress={() => setEditModalVisible(false)}
                                >
                                    <Text style={styles.cancelEditText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.editButton, styles.saveEditButton]}
                                    onPress={updateUser}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.saveEditText}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: '#2c5a73',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        marginTop: -35
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        alignItems: "center",
    },
    greeting: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.9)",
        fontWeight: "500",
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    downloadButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userCountContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        minWidth: 60,
    },
    userCountNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    userCountLabel: {
        fontSize: 10,
        color: '#fff',
        opacity: 0.8,
    },
    filterScroll: {
        marginTop: 5,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    filterButtonActive: {
        backgroundColor: '#fff',
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    filterButtonTextActive: {
        color: '#2c5a73',
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#1e293b",
        padding: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#2c5a73",
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        borderRadius: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    cardGradient: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        overflow: "hidden",
        elevation: 2,
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#fff",
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 4,
    },
    userMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    userPhone: {
        fontSize: 12,
        color: "#64748b",
        marginLeft: 2,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 8,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        paddingTop: 12,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statValue: {
        fontSize: 12,
        color: "#2c5a73",
        fontWeight: "600",
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: "#e2e8f0",
        marginHorizontal: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 4,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2c5a73",
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 24,
        width: "100%",
        maxWidth: 500,
        maxHeight: "90%",
        padding: 20,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
    },
    modalProfileSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    modalAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        overflow: "hidden",
        elevation: 4,
    },
    modalAvatarImage: {
        width: "100%",
        height: "100%",
    },
    modalAvatarText: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#fff",
    },
    modalUserName: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 8,
    },
    modalUserMeta: {
        flexDirection: "row",
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    modalSection: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 12,
    },
    modalInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    modalInfoLabel: {
        fontSize: 14,
        color: "#64748b",
        marginLeft: 8,
        marginRight: 4,
        width: 90,
    },
    modalInfoValue: {
        flex: 1,
        fontSize: 14,
        color: "#1e293b",
        fontWeight: "500",
    },
    roleChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    roleChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    roleChipText: {
        fontSize: 12,
        fontWeight: "600",
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    editButton: {
        backgroundColor: "#3B82F6",
    },
    activateButton: {
        backgroundColor: "#10B981",
    },
    deactivateButton: {
        backgroundColor: "#EF4444",
    },
    deleteButton: {
        backgroundColor: "#DC2626",
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
    },
    editForm: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: "#1e293b",
        backgroundColor: "#f8fafc",
    },
    textArea: {
        height: 80,
        textAlignVertical: "top",
    },
    genderContainer: {
        flexDirection: "row",
        gap: 12,
    },
    genderOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
    },
    genderOptionSelected: {
        backgroundColor: "#2c5a73",
        borderColor: "#2c5a73",
    },
    genderText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    genderTextSelected: {
        color: "#fff",
    },
    statusContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    statusOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        backgroundColor: "#f8fafc",
    },
    statusOptionActive: {
        backgroundColor: "#10B981",
        borderColor: "#10B981",
    },
    statusOptionInactive: {
        backgroundColor: "#EF4444",
        borderColor: "#EF4444",
    },
    statusText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    statusTextActive: {
        color: "#fff",
    },
    statusTextInactive: {
        color: "#fff",
    },
    editActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 10,
    },
    editButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelEditButton: {
        backgroundColor: "#f1f5f9",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    saveEditButton: {
        backgroundColor: "#2c5a73",
    },
    cancelEditText: {
        color: "#64748b",
        fontSize: 15,
        fontWeight: "600",
    },
    saveEditText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
});