import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    FlatList,
    RefreshControl,
    Modal,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function UserListScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);

    // Fetch users from API
    const fetchUsers = async () => {
        try {
            console.log("📡 Fetching users...");
            
            // Using GET_USER_LIST API
            const response = await api.post(API.GET_USER_LIST, {
                page: 1,
                perPage: 50, // Increase per page limit
                search: searchQuery, // Add search if needed
            });
            
            const responseData = response.data || {};
            console.log("👥 Users Full Response:", JSON.stringify(responseData, null, 2));
            
            // Extract users array from response.data
            const usersData = responseData.data || [];
            console.log("👥 Users Array:", usersData.length);
            
            // Format users data
            const formattedUsers = usersData.map(user => ({
                id: user._id || user.id,
                name: user.fullname || user.username || "Unknown User",
                email: user.email || "No email",
                phone: user.phone || "No phone",
                role: getUserRole(user),
                status: user.isActive ? "active" : "inactive",
                createdAt: user.createdAt || new Date().toISOString(),
                profilePicture: user.profilePicture,
                isAdmin: user.isAdmin || false,
                isVerified: user.isVerified || false,
            }));
            
            setUsers(formattedUsers);
            setTotalUsers(formattedUsers.length);
            setLoading(false);
            
        } catch (error) {
            console.error("❌ Error fetching users:", error.response?.data || error.message);
            Alert.alert(
                "Error",
                "Failed to load users. Please try again.",
                [{ text: "OK" }]
            );
            setLoading(false);
        }
    };

    // Determine user role
    const getUserRole = (user) => {
        if (user.isAdmin) return "Admin";
        if (user.isPhotographer) return "Photographer";
        if (user.isGuider) return "Tour Guide";
        return "Tourist";
    };

    useEffect(() => {
        fetchUsers();
    }, [searchQuery]); // Re-fetch when search changes

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    };

    // Delete user function
const deleteUser = async (userId) => {
  Alert.alert(
    "Delete User",
    "Are you sure you want to delete this user? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setActionLoading(true);

            // Correct API call with form-urlencoded body
            const response = await api.post(
              "https://localguider.sinfode.com/api/user/delete",
              new URLSearchParams({ userId }).toString(),
              {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              }
            );

            console.log("🗑️ Delete Response:", response.data);
            Alert.alert("Success", "User deleted successfully!");

            // Refresh users list
            await fetchUsers();
          } catch (error) {
            console.error("❌ Error deleting user:", error);
            Alert.alert("Error", "Failed to delete user. Please try again.", [
              { text: "OK" },
            ]);
          } finally {
            setActionLoading(false);
            setModalVisible(false);
          }
        },
      },
    ]
  );
};

    // Update user status (activate/deactivate)
    const updateUserStatus = async (userId, currentStatus) => {
        try {
            setActionLoading(true);
            
            // Using UPDATE_PROFILE API to update status
            const newStatus = !currentStatus;
            const response = await api.put(`${API.UPDATE_PROFILE}/${userId}`, {
                isActive: newStatus,
            });
            
            console.log("🔄 Update Status Response:", response.data);
            
            Alert.alert(
                "Success",
                `User ${newStatus ? "activated" : "deactivated"} successfully!`
            );
            
            // Update local state
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId 
                        ? { ...user, status: newStatus ? "active" : "inactive" }
                        : user
                )
            );
            
        } catch (error) {
            console.error("❌ Error updating user status:", error);
            Alert.alert(
                "Error",
                "Failed to update user status. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setActionLoading(false);
            setModalVisible(false);
        }
    };

    // Add balance to user (Admin feature)
    const addBalanceToUser = async (userId) => {
        Alert.prompt(
            "Add Balance",
            "Enter amount to add to user's wallet:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Add",
                    onPress: async (amount) => {
                        if (!amount || isNaN(amount) || Number(amount) <= 0) {
                            Alert.alert("Error", "Please enter a valid amount");
                            return;
                        }
                        
                        try {
                            setActionLoading(true);
                            
                            // Using ADD_BALANCE API
                            const response = await api.post(API.ADD_BALANCE, {
                                userId: userId,
                                amount: Number(amount),
                            });
                            
                            console.log("💰 Add Balance Response:", response.data);
                            
                            Alert.alert(
                                "Success",
                                `₹${amount} added to user's wallet successfully!`
                            );
                            
                        } catch (error) {
                            console.error("❌ Error adding balance:", error);
                            Alert.alert(
                                "Error",
                                "Failed to add balance. Please try again.",
                                [{ text: "OK" }]
                            );
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ],
            'plain-text',
            '',
            'numeric'
        );
    };

    // User action menu
    const showActionMenu = (user) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

    const renderUserItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.userCard}
            onPress={() => navigation.navigate("AdminUserDetails", { 
                userId: item.id,
                userData: item 
            })}
            onLongPress={() => showActionMenu(item)}
        >
            <View style={styles.userHeader}>
                {/* Profile Picture or Avatar */}
                <View style={[
                    styles.avatar,
                    { backgroundColor: getAvatarColor(item.role) }
                ]}>
                    {item.profilePicture ? (
                        <Ionicons name="person" size={24} color="#fff" />
                    ) : (
                        <Text style={styles.avatarText}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
                
                <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.isAdmin && (
                            <View style={styles.adminBadge}>
                                <Text style={styles.adminBadgeText}>ADMIN</Text>
                            </View>
                        )}
                    </View>
                    
                    <Text style={styles.userEmail} numberOfLines={1}>
                        {item.email}
                    </Text>
                    
                    <Text style={styles.userPhone} numberOfLines={1}>
                        📱 {item.phone}
                    </Text>
                    
                    <View style={styles.userMeta}>
                        <View style={[styles.badge, { 
                            backgroundColor: item.status === "active" ? "#10B981" : "#EF4444" 
                        }]}>
                            <Text style={styles.badgeText}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>
                        
                        <View style={[styles.badge, { 
                            backgroundColor: getRoleColor(item.role) 
                        }]}>
                            <Text style={styles.badgeText}>{item.role}</Text>
                        </View>
                        
                        {item.isVerified && (
                            <View style={[styles.badge, { backgroundColor: "#3B82F6" }]}>
                                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                                <Text style={[styles.badgeText, { marginLeft: 4 }]}>
                                    Verified
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                
                {/* Action Button */}
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => showActionMenu(item)}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>
            
            {/* User Stats */}
            <View style={styles.userStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Member Since</Text>
                    <Text style={styles.statValue}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
                {/* You can add more stats like bookings, reviews, etc. */}
            </View>
        </TouchableOpacity>
    );

    const getAvatarColor = (role) => {
        switch(role) {
            case "Admin": return "#8B5CF6";
            case "Photographer": return "#F59E0B";
            case "Tour Guide": return "#10B981";
            default: return "#3B82F6";
        }
    };

    const getRoleColor = (role) => {
        switch(role) {
            case "Admin": return "#8B5CF6";
            case "Photographer": return "#F59E0B";
            case "Tour Guide": return "#10B981";
            default: return "#3B82F6";
        }
    };

    // Filter users based on search
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu-outline" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Management</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => navigation.navigate("AdminAddUser")}
                    >
                        <Ionicons name="person-add-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={onRefresh}
                        disabled={refreshing}
                    >
                        {refreshing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="refresh-outline" size={22} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* STATS BAR */}
            <View style={styles.statsBar}>
                <View style={styles.statItemContainer}>
                    <Text style={styles.statNumber}>{totalUsers}</Text>
                    <Text style={styles.statText}>Total Users</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItemContainer}>
                    <Text style={styles.statNumber}>
                        {users.filter(u => u.status === "active").length}
                    </Text>
                    <Text style={styles.statText}>Active</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItemContainer}>
                    <Text style={styles.statNumber}>
                        {users.filter(u => u.role === "Admin").length}
                    </Text>
                    <Text style={styles.statText}>Admins</Text>
                </View>
            </View>

            {/* SEARCH BAR */}
            <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={20} color="#94a3b8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users by name, email, phone or role..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
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
                    <ActivityIndicator size="large" color="#42738f" />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
                            <Text style={styles.emptyTitle}>No users found</Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery ? "Try a different search" : "No users registered yet"}
                            </Text>
                        </View>
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderText}>
                                Showing {filteredUsers.length} of {totalUsers} users
                            </Text>
                        </View>
                    }
                />
            )}

            {/* ACTION MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>User Actions</Text>
                            <TouchableOpacity 
                                onPress={() => setModalVisible(false)}
                                disabled={actionLoading}
                            >
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        {selectedUser && (
                            <View style={styles.modalUserInfo}>
                                <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                                <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                                <View style={styles.modalUserMeta}>
                                    <View style={[styles.badge, { 
                                        backgroundColor: selectedUser.status === "active" ? "#10B981" : "#EF4444" 
                                    }]}>
                                        <Text style={styles.badgeText}>{selectedUser.status}</Text>
                                    </View>
                                    <View style={[styles.badge, { 
                                        backgroundColor: getRoleColor(selectedUser.role) 
                                    }]}>
                                        <Text style={styles.badgeText}>{selectedUser.role}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        
                        <View style={styles.modalActions}>
                            {actionLoading ? (
                                <ActivityIndicator size="large" color="#42738f" />
                            ) : (
                                <>
                                    {/* View Details */}
                                    <TouchableOpacity 
                                        style={[styles.modalButton, styles.viewButton]}
                                        onPress={() => {
                                            setModalVisible(false);
                                            navigation.navigate("AdminUserDetails", { 
                                                userId: selectedUser?.id,
                                                userData: selectedUser 
                                            });
                                        }}
                                    >
                                        <Ionicons name="eye-outline" size={20} color="#3B82F6" />
                                        <Text style={[styles.modalButtonText, styles.viewButtonText]}>
                                            View Details
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    {/* Activate/Deactivate */}
                                    <TouchableOpacity 
                                        style={[styles.modalButton, 
                                            selectedUser?.status === "active" 
                                                ? styles.deactivateButton 
                                                : styles.activateButton
                                        ]}
                                        onPress={() => updateUserStatus(
                                            selectedUser?.id, 
                                            selectedUser?.status === "active"
                                        )}
                                    >
                                        <Ionicons 
                                            name={selectedUser?.status === "active" ? "pause-circle" : "play-circle"} 
                                            size={20} 
                                            color="#fff" 
                                        />
                                        <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                                            {selectedUser?.status === "active" ? "Deactivate" : "Activate"}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    {/* Add Balance */}
                                    <TouchableOpacity 
                                        style={[styles.modalButton, styles.balanceButton]}
                                        onPress={() => {
                                            setModalVisible(false);
                                            addBalanceToUser(selectedUser?.id);
                                        }}
                                    >
                                        <Ionicons name="wallet-outline" size={20} color="#F59E0B" />
                                        <Text style={[styles.modalButtonText, styles.balanceButtonText]}>
                                            Add Balance
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    {/* Edit User */}
                                    <TouchableOpacity 
                                        style={[styles.modalButton, styles.editButton]}
                                        onPress={() => {
                                            setModalVisible(false);
                                            navigation.navigate("AdminEditUser", { 
                                                userId: selectedUser?.id,
                                                userData: selectedUser 
                                            });
                                        }}
                                    >
                                        <Ionicons name="create-outline" size={20} color="#10B981" />
                                        <Text style={[styles.modalButtonText, styles.editButtonText]}>
                                            Edit User
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    {/* Delete User */}
                                    <TouchableOpacity 
                                        style={[styles.modalButton, styles.deleteButton]}
                                        onPress={() => deleteUser(selectedUser?.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        <Text style={[styles.modalButtonText, styles.deleteButtonText]}>
                                            Delete User
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    {/* Cancel */}
                                    <TouchableOpacity 
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: "#42738f",
        paddingTop: 40,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    headerButton: {
        padding: 4,
    },
    statsBar: {
        flexDirection: "row",
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        paddingVertical: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statItemContainer: {
        flex: 1,
        alignItems: "center",
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 4,
    },
    statText: {
        fontSize: 12,
        color: "#64748b",
        fontWeight: "500",
    },
    statDivider: {
        width: 1,
        height: "80%",
        backgroundColor: "#e2e8f0",
        alignSelf: "center",
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    searchInput: { 
        flex: 1, 
        marginLeft: 8, 
        marginRight: 8,
        fontSize: 16, 
        color: "#1e293b",
        padding: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: "#666",
    },
    listContainer: { 
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    listHeader: { 
        marginVertical: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    listHeaderText: { 
        fontSize: 14, 
        color: "#64748b",
        fontWeight: "500",
    },
    userCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    userHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: { 
        fontSize: 20, 
        fontWeight: "bold", 
        color: "#fff" 
    },
    userInfo: {
        flex: 1,
    },
    userNameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    userName: { 
        fontSize: 16, 
        fontWeight: "600", 
        color: "#1e293b",
        marginRight: 8,
        flexShrink: 1,
    },
    adminBadge: {
        backgroundColor: "#8B5CF6",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    adminBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#fff",
    },
    userEmail: { 
        fontSize: 14, 
        color: "#64748b", 
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 13,
        color: "#64748b",
        marginBottom: 8,
    },
    userMeta: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: { 
        fontSize: 11, 
        fontWeight: "600", 
        color: "#fff" 
    },
    actionButton: {
        padding: 4,
        marginLeft: 8,
    },
    userStats: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 12,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        color: "#94a3b8",
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontWeight: "500",
        color: "#475569",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: { 
        fontSize: 18, 
        fontWeight: "600", 
        color: "#64748b", 
        marginTop: 12,
        marginBottom: 4,
    },
    emptySubtitle: { 
        fontSize: 14, 
        color: "#94a3b8", 
        textAlign: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 30,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
    },
    modalUserInfo: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    modalUserName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 4,
    },
    modalUserEmail: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 12,
    },
    modalUserMeta: {
        flexDirection: "row",
        gap: 8,
    },
    modalActions: {
        paddingHorizontal: 20,
    },
    modalButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    viewButton: {
        backgroundColor: "#EFF6FF",
        borderColor: "#3B82F6",
    },
    viewButtonText: {
        color: "#3B82F6",
        marginLeft: 8,
        fontWeight: "600",
    },
    activateButton: {
        backgroundColor: "#10B981",
        borderColor: "#10B981",
    },
    deactivateButton: {
        backgroundColor: "#EF4444",
        borderColor: "#EF4444",
    },
    balanceButton: {
        backgroundColor: "#FEF3C7",
        borderColor: "#F59E0B",
    },
    balanceButtonText: {
        color: "#F59E0B",
        marginLeft: 8,
        fontWeight: "600",
    },
    editButton: {
        backgroundColor: "#D1FAE5",
        borderColor: "#10B981",
    },
    editButtonText: {
        color: "#10B981",
        marginLeft: 8,
        fontWeight: "600",
    },
    deleteButton: {
        backgroundColor: "#FEE2E2",
        borderColor: "#EF4444",
    },
    deleteButtonText: {
        color: "#EF4444",
        marginLeft: 8,
        fontWeight: "600",
    },
    cancelButton: {
        backgroundColor: "#F1F5F9",
        borderColor: "#CBD5E1",
        marginTop: 10,
    },
    cancelButtonText: {
        color: "#64748b",
        fontWeight: "600",
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: "500",
    },
});