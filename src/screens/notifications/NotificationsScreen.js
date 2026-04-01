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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

// Time formatter
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

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  // Determine correct parameters based on user role
  const getNotificationParams = () => {
    const role = user?.role?.toUpperCase();
    if (role === "GUIDER") {
      return { guiderId: user?.gid, userRole: "GUIDER" };
    } else if (role === "PHOTOGRAPHER") {
      return { photographerId: user?.pid, userRole: "PHOTOGRAPHER" };
    } else {
      return { userId: user?.id, userRole: "USER" };
    }
  };

  // Fetch notifications (only unread ones)
  const fetchNotifications = async (pageNum = 1, append = false) => {
    if (!user?.id) return;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = getNotificationParams();
      const formData = new URLSearchParams();
      formData.append("page", pageNum.toString());
      formData.append("perPage", PAGE_SIZE.toString());
      if (params.userId) formData.append("userId", params.userId.toString());
      if (params.guiderId) formData.append("guiderId", params.guiderId.toString());
      if (params.photographerId) formData.append("photographerId", params.photographerId.toString());
      if (params.userRole) formData.append("userRole", params.userRole);

      const response = await api.post(API.GET_NOTIFICATIONS, formData.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data?.status) {
        let data = response.data.data || [];
        // Filter out already read notifications
        data = data.filter(item => !item.markAsRead);
        const totalPages = response.data.totalPages || 1;

        if (append) {
          setNotifications(prev => [...prev, ...data]);
        } else {
          setNotifications(data);
        }
        setHasMore(pageNum < totalPages && data.length === PAGE_SIZE);
        setPage(pageNum);
      } else {
        if (pageNum === 1) setNotifications([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
      if (pageNum === 1) setNotifications([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Mark a single notification as read (removes from list)
  const markAsRead = async (notificationId) => {
    try {
      const formData = new URLSearchParams();
      formData.append("notificationId", notificationId.toString());
      const response = await api.post(API.MARK_AS_READ_NOTIFICATION, formData.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (response.data?.status) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        console.warn("Mark as read failed:", response.data?.message);
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.markAsRead).map(n => n.id);
    if (unreadIds.length === 0) {
      Alert.alert("Info", "No unread notifications");
      return;
    }

    Alert.alert(
      "Mark All Read",
      `Mark ${unreadIds.length} notification(s) as read?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const params = getNotificationParams();
              const formData = new URLSearchParams();
              if (params.userId) formData.append("userId", params.userId.toString());
              if (params.guiderId) formData.append("guiderId", params.guiderId.toString());
              if (params.photographerId) formData.append("photographerId", params.photographerId.toString());
              const response = await api.post(API.MARK_AS_READ_NOTIFICATION, formData.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              });
              if (response.data?.status) {
                // Clear all notifications (since they are now read)
                setNotifications([]);
                setHasMore(false);
              } else {
                // Fallback: mark each individually
                for (const id of unreadIds) {
                  await markAsRead(id);
                }
              }
            } catch (error) {
              console.error("Mark all read error:", error);
              Alert.alert("Error", "Failed to mark all as read");
            }
          },
        },
      ]
    );
  };

  // Delete a single notification
  const deleteNotification = async (notificationId) => {
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
              const formData = new URLSearchParams();
              formData.append("notificationId", notificationId.toString());
              const response = await api.post(API.DELETE_NOTIFICATION, formData.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              });
              if (response.data?.status) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                if (selectedNotification?.id === notificationId) setDetailsModal(false);
              } else {
                Alert.alert("Error", response.data?.message || "Failed to delete");
              }
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Network error");
            }
          },
        },
      ]
    );
  };

  // Load more on scroll
  const loadMore = () => {
    if (hasMore && !loadingMore && !refreshing) {
      fetchNotifications(page + 1, true);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1, false);
  };

  // Handle notification press: open details and mark as read
  const handleNotificationPress = (notification) => {
    setSelectedNotification(notification);
    setDetailsModal(true);
    if (!notification.markAsRead) {
      markAsRead(notification.id);
    }
  };

  // Icon based on type
  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'booking': return { name: 'calendar', color: '#3B82F6' };
      case 'payment': return { name: 'cash', color: '#10B981' };
      case 'approval': return { name: 'checkmark-circle', color: '#8B5CF6' };
      case 'reminder': return { name: 'time', color: '#F59E0B' };
      default: return { name: 'notifications', color: '#2c5a73' };
    }
  };

  // Render notification card
  const renderNotificationCard = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    return (
      <TouchableOpacity
        style={styles.notificationCard}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.time}>{getTimeAgo(item.createdOn)}</Text>
          </View>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteNotification(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Details modal
  const renderDetailsModal = () => (
    <Modal
      visible={detailsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setDetailsModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setDetailsModal(false)}
      >
        <View style={styles.modalContent}>
          {selectedNotification && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notification Details</Text>
                <TouchableOpacity onPress={() => setDetailsModal(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.modalIconContainer}>
                  <Ionicons 
                    name={getNotificationIcon(selectedNotification.type).name} 
                    size={40} 
                    color={getNotificationIcon(selectedNotification.type).color} 
                  />
                </View>
                <Text style={styles.modalTime}>
                  {new Date(selectedNotification.createdOn).toLocaleString()}
                </Text>
                <Text style={styles.modalTitleText}>{selectedNotification.title}</Text>
                <Text style={styles.modalDescription}>
                  {selectedNotification.description}
                </Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={() => deleteNotification(selectedNotification.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>You have no unread notifications</Text>
    </View>
  );

  // Header
  const renderHeader = () => (
    <LinearGradient
      colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notifications</Text>
      <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
        <Text style={styles.markAllText}>Mark all read</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  // Stats bar (unread count)
  const renderStats = () => {
    const unreadCount = notifications.filter(n => !n.markAsRead).length;
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  if (loading && !refreshing && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5a73" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderStats()}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderNotificationCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2c5a73']}
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
        ListEmptyComponent={renderEmptyState()}
      />
      {renderDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  markAllText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  statsContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  statsText: { fontSize: 13, color: '#64748b' },
  listContent: { padding: 16 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  contentContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '500', color: '#1e293b', flex: 1 },
  time: { fontSize: 11, color: '#94a3b8', marginLeft: 8 },
  description: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  deleteBtn: { padding: 6, borderRadius: 8, backgroundColor: '#FEE2E2' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  modalBody: { alignItems: 'center' },
  modalIconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalTime: { fontSize: 12, color: '#94a3b8', marginBottom: 12 },
  modalTitleText: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  modalDescription: { fontSize: 14, color: '#475569', lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  modalDeleteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#FEE2E2' },
  modalDeleteText: { fontSize: 14, fontWeight: '600', color: '#EF4444', marginLeft: 6 },
});