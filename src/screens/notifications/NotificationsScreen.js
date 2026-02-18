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

// Time formatter function
const getTimeAgo = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
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

  // Determine user role and ID for API params
  const getNotificationParams = () => {
    const params = {
      page: 1,
      perPage: 20,
    };

    if (user?.role === "GUIDER") {
      params.guiderId = user.gId || user.id;
    } else if (user?.role === "PHOTOGRAPHER") {
      params.photographerId = user.pId || user.id;
    } else {
      params.userId = user?.id;
    }

    return params;
  };

  // Fetch notifications from API
  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = {
        ...getNotificationParams(),
        page: pageNum,
        perPage: 20,
      };

      const response = await api.post("/notification/get", null, { params });

      if (response.data?.status) {
        const newNotifications = response.data.data || [];
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        
        setHasMore(newNotifications.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Load more notifications on scroll
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1, false);
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.post("/notification/mark_as_read", null, {
        params: { notificationId }
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, markAsRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete notification
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
              await api.post("/notification/delete", null, {
                params: { notificationId }
              });

              // Remove from local state
              setNotifications(prev =>
                prev.filter(notif => notif.id !== notificationId)
              );

              if (selectedNotification?.id === notificationId) {
                setDetailsModal(false);
              }
            } catch (error) {
              console.error("Error deleting notification:", error);
              Alert.alert("Error", "Failed to delete notification");
            }
          }
        }
      ]
    );
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    setSelectedNotification(notification);
    setDetailsModal(true);
    if (!notification.markAsRead) {
      markAsRead(notification.id);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'booking':
        return { name: 'calendar', color: '#3B82F6' };
      case 'payment':
        return { name: 'cash', color: '#10B981' };
      case 'approval':
        return { name: 'checkmark-circle', color: '#8B5CF6' };
      case 'reminder':
        return { name: 'time', color: '#F59E0B' };
      default:
        return { name: 'notifications', color: '#2c5a73' };
    }
  };

  // Render notification card
  const renderNotificationCard = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.markAsRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.markAsRead && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{getTimeAgo(item.createdOn)}</Text>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.footerRow}>
            {!item.markAsRead && (
              <View style={styles.unreadBadge}>
                <View style={styles.unreadDot} />
                <Text style={styles.unreadText}>New</Text>
              </View>
            )}
            
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

  // Details Modal
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

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You don't have any notifications at the moment
      </Text>
    </View>
  );

  // Header component
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
      <TouchableOpacity 
        style={styles.markAllBtn}
        onPress={() => {
          notifications.forEach(n => {
            if (!n.markAsRead) markAsRead(n.id);
          });
        }}
      >
        <Text style={styles.markAllText}>Mark all read</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  // Stats bar
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

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderStats()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
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
      )}

      {renderDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  statsText: {
    fontSize: 13,
    color: '#64748b',
  },
  listContent: {
    padding: 16,
  },
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
  unreadCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  time: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 4,
  },
  unreadText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalBody: {
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 6,
  },
});