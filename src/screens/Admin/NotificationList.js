import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api"; // ✅ Fixed: Go up one more level to reach services folder
import { API } from "../../api/api"; // ✅ Fixed: Import endpoints from the same file

// Time formatter function
const getTimeAgo = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  } catch {
    return "recently";
  }
};

// Recipient types
const RECIPIENT_TYPES = [
  { 
    label: "All Users", 
    value: "users", 
    icon: "people-outline", 
    color: "#3B82F6", 
    param: "forUsers",
    description: "Send to all registered users"
  },
  { 
    label: "All Tour Guides", 
    value: "guiders", 
    icon: "map-outline", 
    color: "#10B981", 
    param: "forGuiders",
    description: "Send to all tour guides"
  },
  { 
    label: "All Photographers", 
    value: "photographers", 
    icon: "camera-outline", 
    color: "#8B5CF6", 
    param: "forPhotographers",
    description: "Send to all photographers"
  },
  { 
    label: "Specific User", 
    value: "userId", 
    icon: "person-outline", 
    color: "#2c5a73", 
    param: "userIds",
    description: "Send to specific user by ID"
  },
  { 
    label: "Specific Guide", 
    value: "guiderId", 
    icon: "person-outline", 
    color: "#2c5a73", 
    param: "guiderIds",
    description: "Send to specific guide by ID"
  },
  { 
    label: "Specific Photographer", 
    value: "photographerId", 
    icon: "person-outline", 
    color: "#2c5a73", 
    param: "photographerIds",
    description: "Send to specific photographer by ID"
  },
];

export default function NotificationList({ navigation }) {
  const { user } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    recipientType: "users",
    specificId: "",
  });

  // ✅ FETCH NOTIFICATIONS
  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      // Your API might expect different format - try both options
      
      // OPTION 1: If it expects POST with body
      const payload = {
        userId: user?.id,
        page: pageNum,
        perPage: 20,
      };

      console.log("📡 Fetching notifications with payload:", payload);
      
      // Using the correct endpoint from your API config
      const res = await api.post(API.GET_NOTIFICATIONS, payload);
      
      // OPTION 2: If it expects GET with params, uncomment below:
      // const res = await api.get(API.GET_NOTIFICATIONS, {
      //   params: {
      //     userId: user?.id,
      //     page: pageNum,
      //     perPage: 20,
      //   }
      // });

      console.log("📥 Fetch response:", res.data);

      // Check response structure - adjust based on your API
      if (res.data?.status) {
        const newNotifications = res.data.data || [];
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        
        setHasMore(newNotifications.length === 20);
        setPage(pageNum);
      } else {
        console.log("❌ API returned status false:", res.data);
        setNotifications([]);
      }
    } catch (error) {
      console.log("❌ Fetch error:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please login again");
      } else {
        Alert.alert("Error", error.response?.data?.message || "Failed to load notifications");
      }
      setNotifications([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // ✅ LOAD MORE
  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchNotifications(page + 1, true);
    }
  };

  // ✅ CREATE NOTIFICATION
  const createNotification = async () => {
    if (!form.title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    if (!form.description.trim()) {
      Alert.alert("Error", "Description is required");
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
      };

      // Set recipient based on selection
      switch (form.recipientType) {
        case "users":
          payload.forUsers = true;
          break;
        case "guiders":
          payload.forGuiders = true;
          break;
        case "photographers":
          payload.forPhotographers = true;
          break;
        case "userId":
          if (!form.specificId) {
            Alert.alert("Error", "Please enter User ID");
            setLoading(false);
            return;
          }
          payload.userIds = [parseInt(form.specificId)];
          break;
        case "guiderId":
          if (!form.specificId) {
            Alert.alert("Error", "Please enter Guide ID");
            setLoading(false);
            return;
          }
          payload.guiderIds = [parseInt(form.specificId)];
          break;
        case "photographerId":
          if (!form.specificId) {
            Alert.alert("Error", "Please enter Photographer ID");
            setLoading(false);
            return;
          }
          payload.photographerIds = [parseInt(form.specificId)];
          break;
      }

      console.log("📤 Sending create payload:", payload);
      
      const res = await api.post(API.CREATE_NOTIFICATION, payload);
      console.log("📥 Create response:", res.data);

      if (res.data?.status) {
        Alert.alert("Success", res.data.message || "Notification sent successfully");
        setCreateModalVisible(false);
        resetForm();
        fetchNotifications(1, false);
      } else {
        Alert.alert("Error", res.data?.message || "Create failed");
      }
    } catch (error) {
      console.log("❌ Create error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ MARK AS READ
  const markAsRead = async (id) => {
    try {
      await api.post(API.MARK_AS_READ_NOTIFICATION, null, {
        params: { notificationId: id },
      });

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, markAsRead: true } : notif
        )
      );

      if (selectedNotification?.id === id) {
        setSelectedNotification({ ...selectedNotification, markAsRead: true });
      }
    } catch (error) {
      console.log("Mark read error:", error);
    }
  };

  // ✅ DELETE NOTIFICATION
  const deleteNotification = async (id) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post(API.DELETE_NOTIFICATION, null, {
                params: { notificationId: id },
              });

              setNotifications(prev => prev.filter(notif => notif.id !== id));

              if (selectedNotification?.id === id) {
                setDetailsModalVisible(false);
              }
            } catch (error) {
              console.log("Delete error:", error);
              Alert.alert("Error", "Delete failed");
            }
          }
        }
      ]
    );
  };

  // ✅ MARK ALL AS READ
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.markAsRead).map(n => n.id);
      
      for (const id of unreadIds) {
        await api.post(API.MARK_AS_READ_NOTIFICATION, null, {
          params: { notificationId: id },
        });
      }

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, markAsRead: true }))
      );
    } catch (error) {
      console.log("Mark all read error:", error);
    }
  };

  // ✅ PULL TO REFRESH
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(1, false);
  };

  // ✅ RESET FORM
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      recipientType: "users",
      specificId: "",
    });
  };

  // ✅ INITIAL FETCH
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  // ✅ GET ICON BASED ON TYPE
  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'booking': return { name: 'calendar', color: '#3B82F6' };
      case 'payment': return { name: 'cash', color: '#10B981' };
      case 'approval': return { name: 'checkmark-circle', color: '#8B5CF6' };
      case 'reminder': return { name: 'time', color: '#F59E0B' };
      default: return { name: 'notifications', color: '#2c5a73' };
    }
  };

  // Show loading only on first load
  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5a73" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1e3c4f", "#2c5a73", "#3b7a8f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Bar */}
      {notifications.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {notifications.filter(n => !n.markAsRead).length} unread • {notifications.length} total
          </Text>
          {notifications.filter(n => !n.markAsRead).length > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>
            You don't have any notifications yet.
          </Text>
          <TouchableOpacity
            style={styles.createFirstBtn}
            onPress={() => setCreateModalVisible(true)}
          >
            <LinearGradient
              colors={["#2c5a73", "#1e3c4f"]}
              style={styles.createFirstBtnGradient}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createFirstBtnText}>Create First Notification</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => {
            const icon = getNotificationIcon(item.type);
            return (
              <TouchableOpacity
                style={[styles.card, !item.markAsRead && styles.unreadCard]}
                onPress={() => {
                  setSelectedNotification(item);
                  setDetailsModalVisible(true);
                  if (!item.markAsRead) {
                    markAsRead(item.id);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text
                      style={[
                        styles.title,
                        !item.markAsRead && styles.unreadTitle,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.time}>{getTimeAgo(item.createdOn)}</Text>
                  </View>

                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.cardFooter}>
                    {!item.markAsRead && (
                      <View style={styles.unreadBadge}>
                        <View style={styles.unreadDot} />
                        <Text style={styles.unreadBadgeText}>New</Text>
                      </View>
                    )}

                    <View style={styles.actionButtons}>
                      {!item.markAsRead && (
                        <TouchableOpacity
                          style={styles.markReadBtn}
                          onPress={() => markAsRead(item.id)}
                        >
                          <Ionicons name="checkmark-circle-outline" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteNotification(item.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2c5a73"]}
              tintColor="#2c5a73"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#2c5a73" />
              </View>
            ) : null
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setCreateModalVisible(false);
          resetForm();
        }}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Notification</Text>
              <TouchableOpacity
                onPress={() => {
                  setCreateModalVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={18} color="#2c5a73" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter notification title"
                  placeholderTextColor="#94a3b8"
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />
              </View>

              <Text style={styles.label}>Description *</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons name="chatbubble-outline" size={18} color="#2c5a73" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter notification description"
                  placeholderTextColor="#94a3b8"
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <Text style={styles.label}>Send To *</Text>
              <View style={styles.recipientGrid}>
                {RECIPIENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.recipientCard,
                      form.recipientType === type.value && styles.recipientCardSelected,
                    ]}
                    onPress={() => setForm({ ...form, recipientType: type.value, specificId: "" })}
                  >
                    <View style={[styles.recipientIcon, { backgroundColor: `${type.color}15` }]}>
                      <Ionicons name={type.icon} size={24} color={type.color} />
                    </View>
                    <Text style={styles.recipientLabel}>{type.label}</Text>
                    <Text style={styles.recipientDesc}>{type.description}</Text>
                    {form.recipientType === type.value && (
                      <View style={styles.recipientCheck}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {(form.recipientType === 'userId' || form.recipientType === 'guiderId' || form.recipientType === 'photographerId') && (
                <>
                  <Text style={styles.label}>Enter ID *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="hash-outline" size={18} color="#2c5a73" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={`Enter ${form.recipientType === 'userId' ? 'User' : form.recipientType === 'guiderId' ? 'Guide' : 'Photographer'} ID`}
                      placeholderTextColor="#94a3b8"
                      value={form.specificId}
                      onChangeText={(text) => setForm({ ...form, specificId: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setCreateModalVisible(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.createBtn, loading && styles.buttonDisabled]}
                  onPress={createNotification}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#2c5a73", "#1e3c4f"]}
                    style={styles.createBtnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send-outline" size={16} color="#fff" />
                        <Text style={styles.createBtnText}>Send</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailsModalVisible(false)}
        >
          <View style={styles.detailModalContent}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Notification Details</Text>
                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailBody}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons 
                        name={getNotificationIcon(selectedNotification.type).name} 
                        size={40} 
                        color={getNotificationIcon(selectedNotification.type).color} 
                      />
                    </View>

                    <View style={styles.detailStatusBadge}>
                      <Ionicons 
                        name={selectedNotification.markAsRead ? "eye-outline" : "eye-off-outline"} 
                        size={14} 
                        color={selectedNotification.markAsRead ? "#10B981" : "#F59E0B"} 
                      />
                      <Text style={[
                        styles.detailStatusText,
                        { color: selectedNotification.markAsRead ? "#10B981" : "#F59E0B" }
                      ]}>
                        {selectedNotification.markAsRead ? "Read" : "Unread"}
                      </Text>
                    </View>

                    <Text style={styles.detailTime}>
                      {new Date(selectedNotification.createdOn).toLocaleString()}
                    </Text>

                    <Text style={styles.detailTitle}>{selectedNotification.title}</Text>
                    <Text style={styles.detailDescription}>
                      {selectedNotification.description}
                    </Text>

                    {selectedNotification.userIds && selectedNotification.userIds.length > 0 && (
                      <View style={styles.recipientInfo}>
                        <Ionicons name="people-outline" size={16} color="#2c5a73" />
                        <Text style={styles.recipientInfoText}>
                          Sent to {selectedNotification.userIds.length} user(s)
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>

                <View style={styles.detailFooter}>
                  <TouchableOpacity
                    style={styles.detailDeleteBtn}
                    onPress={() => deleteNotification(selectedNotification.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.detailDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Keep your existing styles here (they're the same as before)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  statsText: {
    fontSize: 13,
    color: "#64748b",
  },
  markAllText: {
    fontSize: 13,
    color: "#2c5a73",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  unreadCard: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  cardLeft: {
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1e293b",
    flex: 1,
  },
  unreadTitle: {
    fontWeight: "700",
    color: "#0f172a",
  },
  time: {
    fontSize: 11,
    color: "#94a3b8",
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unreadBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
    marginRight: 4,
  },
  unreadBadgeText: {
    fontSize: 10,
    color: "#3B82F6",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  markReadBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
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
  createFirstBtn: {
    borderRadius: 12,
    overflow: "hidden",
  },
  createFirstBtnGradient: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  createFirstBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
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
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 6,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1e293b",
  },
  textAreaContainer: {
    alignItems: "flex-start",
    minHeight: 100,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  recipientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  recipientCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  recipientCardSelected: {
    borderColor: "#2c5a73",
    backgroundColor: "#f0f9ff",
  },
  recipientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  recipientLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  recipientDesc: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    marginTop: 2,
  },
  recipientCheck: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 30,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  createBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  createBtnGradient: {
    flexDirection: "row",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  detailModalContent: {
    width: "85%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  detailBody: {
    alignItems: "center",
    paddingVertical: 8,
  },
  detailIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  detailStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  detailTime: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  detailDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  recipientInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  recipientInfoText: {
    fontSize: 11,
    color: "#2c5a73",
    marginLeft: 4,
  },
  detailFooter: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  detailDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  detailDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 6,
  },
});