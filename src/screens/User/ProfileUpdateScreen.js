import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
// No DateTimePicker needed unless you add DOB later

import { AuthContext } from "../../context/AuthContext";
import { LocationContext } from "../../context/LocationContext";
import api from "../../api/apiClient";

const BASE_URL = api.defaults.baseURL || "https://localguider.sinfode.com/api/";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${BASE_URL}${cleanPath}`;
};

export default function ProfileUpdateScreen({ navigation }) {
  const { user, refreshUserDean } = useContext(AuthContext);
  const { location } = useContext(LocationContext);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    address: "",
    latitude: "",
    longitude: "",
    profileImage: null,
    profileImageUrl: null,
  });

  useEffect(() => {
    if (user) {
      const userId = user.id || user.user_Id || user.userId;
      setForm({
        id: userId,
        name: user.name || "",
        email: user.email || "",
        address: user.address || "",
        latitude: user.latitude?.toString() || location?.latitude?.toString() || "",
        longitude: user.longitude?.toString() || location?.longitude?.toString() || "",
        profileImage: null,
        profileImageUrl: user.profile || user.profilePicture || null,
      });
    }
  }, [user, location]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photo library");
        return;
      }

      // ✅ Fix deprecated MediaTypeOptions – use array of strings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // or ImagePicker.MediaType.Images
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2, // 20% quality – same as Flutter
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setForm({
          ...form,
          profileImage: asset,
          profileImageUrl: asset.uri,
        });
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleUpdate = async () => {
    if (!form.name?.trim()) {
      Alert.alert("Validation Error", "Please enter name.");
      return;
    }
    if (!form.email?.trim() || !form.email.includes("@")) {
      Alert.alert("Validation Error", "Please enter valid email.");
      return;
    }
    if (!form.address?.trim()) {
      Alert.alert("Validation Error", "Address cannot be empty.");
      return;
    }

    try {
      setLoading(true);

      const userId = form.id;
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        return;
      }

      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("address", form.address);
      if (form.latitude) formData.append("latitude", form.latitude);
      if (form.longitude) formData.append("longitude", form.longitude);

      if (form.profileImage) {
        const imageUri = form.profileImage.uri;
        const filename = imageUri.split("/").pop() || `profile_${Date.now()}.jpg`;
        const mimeType = form.profileImage.mimeType || "image/jpeg";
        formData.append("profile", {
          uri: imageUri,
          type: mimeType,
          name: filename,
        });
      }

      console.log("📤 Sending update request");

      const response = await api.post("/user/update_profile", formData, {
        timeout: 60000,
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Update Response:", response.data);

      if (response.data?.success === true || response.data?.status === true) {
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);

        if (refreshUserDean) {
          await refreshUserDean();
        }
      } else {
        Alert.alert("Failed", response.data?.message || "Profile update failed");
      }
    } catch (err) {
      console.error("❌ Update error:", err);
      if (err.response) {
        Alert.alert("Error", err.response.data?.message || "Server error");
      } else if (err.request) {
        Alert.alert(
          "Network Error",
          "Could not connect to server. Please check your internet connection."
        );
      } else {
        Alert.alert("Error", err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["#1e3c4f", "#2c5a73", "#3b7a8f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 38 }} />
        </View>
        <Text style={styles.headerSub}>Update your personal information</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer} disabled={loading}>
            {form.profileImageUrl ? (
              <Image source={{ uri: form.profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="person" size={40} color="#94a3b8" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} disabled={loading}>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
          {form.profileImage && (
            <Text style={styles.imageNote}>✓ New photo selected (20% quality)</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Input
            label="Name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            icon="person-outline"
          />
          <Input
            label="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            icon="mail-outline"
            keyboard="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Address"
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            icon="location-outline"
            multiline
          />

          <View style={styles.row}>
            <View style={[styles.halfInput, { marginRight: 8 }]}>
              <Input
                label="Latitude"
                value={form.latitude}
                onChangeText={(text) => setForm({ ...form, latitude: text })}
                icon="compass-outline"
                keyboard="numeric"
              />
            </View>
            <View style={[styles.halfInput, { marginLeft: 8 }]}>
              <Input
                label="Longitude"
                value={form.longitude}
                onChangeText={(text) => setForm({ ...form, longitude: text })}
                icon="compass-outline"
                keyboard="numeric"
              />
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.cancelBtn]} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.updateBtn, loading && styles.buttonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.updateGradient}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.updateBtnText}>Save</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Input = ({ label, value, onChangeText, icon, keyboard, multiline }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      {icon && <Ionicons name={icon} size={20} color="#2c5a73" style={styles.inputIcon} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.multilineInput]}
        keyboardType={keyboard || "default"}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.9)", textAlign: "center" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  imageSection: { alignItems: "center", marginBottom: 20 },
  imageContainer: { position: "relative", marginBottom: 8 },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#2c5a73",
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2c5a73",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  changePhotoText: {
    color: "#2c5a73",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textDecorationLine: "underline",
  },
  imageNote: { fontSize: 11, color: "#10B981", marginTop: 4, fontWeight: "500" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 16 },
  inputWrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", color: "#475569", marginBottom: 6 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#1e293b" },
  multilineInput: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", marginBottom: 8 },
  halfInput: { flex: 1 },
  actionButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  updateBtn: { flex: 1, marginLeft: 8, borderRadius: 12, overflow: "hidden" },
  updateGradient: { paddingVertical: 14, alignItems: "center" },
  updateBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  buttonDisabled: { opacity: 0.7 },
});