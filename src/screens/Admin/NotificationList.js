import React, { useEffect, useState } from "react";
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
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function NotificationList({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [page, setPage] = useState(0); // Spring Boot usually starts from 0
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 15;

  const [form, setForm] = useState({
    title: "",
    description: "",
    recipientType: "users",
    specificId: "",
  });

  const fetchNotifications = async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await api.post(API.GET_NOTIFICATIONS, null, {
        params: {
          admin: true,
          page: pageNum,
          perPage: PAGE_SIZE,
        },
      });

      if (response.data?.status) {
        const data = response.data.data || [];
        const totalPages = response.data.totalPages || 0;
        setNotifications(append ? [...notifications, ...data] : data);
        setHasMore(pageNum < totalPages - 1);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleCreate = async () => {
  if (!form.title.trim() || !form.description.trim()) {
    Alert.alert("Error", "Please fill title and description");
    return;
  }

  try {
    setLoading(true);

    // ✅ FINAL SAFE PAYLOAD (NO NULL VALUES)
    let payload = {
      title: form.title,
      description: form.description,
      fromAdmin: true,
      markAsRead: false,

      forAll: false,
      forUsers: false,
      forGuiders: false,
      forPhotographers: false,

      userId: 0,
      guiderId: 0,
      photographerId: 0,

      sendTo: "",
      note: "",
      type: "general"
    };

    // ✅ Recipient logic
    if (form.recipientType === "all") {
      payload.forAll = true;
    } 
    else if (form.recipientType === "users") {
      payload.forUsers = true;
    } 
    else if (form.recipientType === "guiders") {
      payload.forGuiders = true;
    } 
    else if (form.recipientType === "photographers") {
      payload.forPhotographers = true;
    } 
    else if (form.recipientType === "specific") {
      payload.userId = Number(form.specificId || 0);
    }

    // ✅ DEBUG (optional)
    console.log("FINAL PAYLOAD:", payload);

    const response = await api.post(API.CREATE_NOTIFICATION, payload);

    if (response.data?.status || response.status === 200) {
      Alert.alert("Success", "Notification sent successfully");
      setCreateModalVisible(false);
      setForm({
        title: "",
        description: "",
        recipientType: "users",
        specificId: ""
      });
      fetchNotifications(0, false);
    } else {
      Alert.alert("Error", response.data?.message || "Failed to create");
    }

  } catch (error) {
    console.log("ERROR:", error.response?.data || error.message);
    Alert.alert("Error", "Something went wrong (500)");
  } finally {
    setLoading(false);
  }
};

  const handleDelete = (id) => {
    Alert.alert("Confirm", "Delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await api.post(API.DELETE_NOTIFICATION, null, {
              params: { notificationId: id },
            });
            if (response.data?.status) {
              setNotifications((prev) => prev.filter((n) => n.id !== id));
            }
          } catch (e) {
            Alert.alert("Error", "Delete failed");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={() => setCreateModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(0, false)} colors={["#2c5a73"]} />
        }
        onEndReached={() => hasMore && fetchNotifications(page + 1, true)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore && <ActivityIndicator color="#2c5a73" style={{ margin: 10 }} />}
      />

      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Notification</Text>
            
            <TextInput
              placeholder="Title"
              style={styles.input}
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
            />
            <TextInput
              placeholder="Message"
              style={[styles.input, styles.textArea]}
              multiline
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
            />

            <Text style={styles.label}>Recipient Group:</Text>
            <View style={styles.recipientRow}>
              {["users", "guiders", "photographers", "specific"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.recipientBtn, form.recipientType === type && styles.activeRecipient]}
                  onPress={() => setForm({ ...form, recipientType: type })}
                >
                  <Text style={[styles.recipientText, form.recipientType === type && styles.activeText]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.recipientType === "specific" && (
              <TextInput
                placeholder="Enter User ID"
                style={styles.input}
                value={form.specificId}
                onChangeText={(t) => setForm({ ...form, specificId: t })}
                keyboardType="numeric"
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={styles.sendBtn} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff" }}>Send Now</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 50 : 40, paddingBottom: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  listContent: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", elevation: 2 },
  cardContent: { flex: 1 },
  title: { fontWeight: "bold", fontSize: 16, color: "#1e293b" },
  desc: { color: "#64748b", fontSize: 14, marginVertical: 4 },
  date: { color: "#94a3b8", fontSize: 10 },
  deleteBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  label: { fontWeight: "600", marginBottom: 10 },
  recipientRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 },
  recipientBtn: { padding: 8, borderRadius: 15, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  activeRecipient: { backgroundColor: "#2c5a73", borderColor: "#2c5a73" },
  recipientText: { fontSize: 11, color: "#475569" },
  activeText: { color: "#fff" },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { padding: 12 },
  sendBtn: { backgroundColor: "#2c5a73", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
});