import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../api/apiClient";
import { API } from "../api/endpoints";
import { AuthContext } from "../context/AuthContext";

export default function GuiderNotifications({ navigation }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 15;

  const fetchNotifications = async (pageNum = 1, append = false) => {
    if (!user?.gid) return;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.append("guiderId", user.gid.toString());
      params.append("page", pageNum.toString());
      params.append("perPage", PAGE_SIZE.toString());

      const response = await api.post(API.GET_NOTIFICATIONS, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data?.status) {
        let data = response.data.data || [];
        // Filter out notifications that are already marked as read
        data = data.filter(item => !item.markAsRead);
        const totalPages = response.data.totalPages || 1;

        setNotifications(append ? [...notifications, ...data] : data);
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
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      const params = new URLSearchParams();
      params.append("notificationId", id.toString());

      const response = await api.post(API.MARK_AS_READ_NOTIFICATION, params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data?.status) {
        // Remove from local state (or refetch to filter it out)
        setNotifications(prev => prev.filter(item => item.id !== id));
      } else {
        Alert.alert("Error", response.data?.message || "Failed to mark as read");
      }
    } catch (error) {
      console.error("Mark as read error:", error);
      Alert.alert("Error", "Network error");
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    Alert.alert(
      "Mark All Read",
      "Are you sure you want to mark all notifications as read?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const params = new URLSearchParams();
              params.append("guiderId", user.gid.toString());

              const response = await api.post(API.MARK_AS_READ_NOTIFICATION, params.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              });

              if (response.data?.status) {
                Alert.alert("Success", "All notifications marked as read");
                // Clear list and refetch (the backend will return only unread)
                await fetchNotifications(1, false);
              } else {
                Alert.alert("Error", response.data?.message || "Failed to mark as read");
              }
            } catch (error) {
              console.error("Mark all read error:", error);
              Alert.alert("Error", "Network error");
            }
          },
        },
      ]
    );
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    Alert.alert(
      "Delete All",
      "Are you sure you want to delete ALL notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const params = new URLSearchParams();
              params.append("guiderId", user.gid.toString());

              const response = await api.post(API.DELETE_NOTIFICATION, params.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              });

              if (response.data?.status) {
                Alert.alert("Success", "All notifications deleted");
                setNotifications([]);
                setHasMore(false);
                setPage(1);
              } else {
                Alert.alert("Error", response.data?.message || "Failed to delete");
              }
            } catch (error) {
              console.error("Delete all error:", error);
              Alert.alert("Error", "Network error");
            }
          },
        },
      ]
    );
  };

  // Delete individual
  const handleDelete = async (id) => {
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
              const params = new URLSearchParams();
              params.append("notificationId", id.toString());

              const response = await api.post(API.DELETE_NOTIFICATION, params.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
              });

              if (response.data?.status) {
                setNotifications(prev => prev.filter(item => item.id !== id));
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

  // Initial fetch when user is ready
  useEffect(() => {
    if (user?.gid) {
      fetchNotifications();
    }
  }, [user]); // Re-run if user changes

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !refreshing) {
      fetchNotifications(page + 1, true);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => markAsRead(item.id)}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.date}>
          {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : ""}
        </Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Show loading spinner while initial fetch is in progress
  if (!user?.gid || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction} disabled>
              <Ionicons name="checkmark-done-outline" size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} disabled>
              <Ionicons name="trash-outline" size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.emptyText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={markAllAsRead} style={styles.headerAction}>
            <Ionicons name="checkmark-done-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteAllNotifications} style={styles.headerAction}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.listContent}
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
          loadingMore && <ActivityIndicator color="#2c5a73" style={{ marginVertical: 20 }} />
        }
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No notifications found</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", flex: 1, textAlign: "center" },
  headerActions: { flexDirection: "row", gap: 16 },
  headerAction: { padding: 4 },
  listContent: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardContent: { flex: 1 },
  title: { fontWeight: "bold", fontSize: 16, color: "#1e293b" },
  desc: { color: "#64748b", fontSize: 14, marginVertical: 4 },
  date: { color: "#94a3b8", fontSize: 10, marginTop: 6 },
  deleteBtn: { padding: 8 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#64748b", fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});