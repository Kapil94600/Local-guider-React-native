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
import { File } from "expo-file-system";
import { AuthContext } from "../../context/AuthContext";
import { LocationContext } from "../../context/LocationContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";
import DateTimePicker from "@react-native-community/datetimepicker";

const BASE_URL = "https://localguider.sinfode.com";

// 🔥 Get image URL from filename
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const filename = path.split("/").pop();
    return `${BASE_URL}/api/image/download/${filename}`;
  } catch (error) {
    return null;
  }
};

export default function ProfileUpdateScreen({ navigation }) {
  const { user, refreshUserDean } = useContext(AuthContext);
  const { location } = useContext(LocationContext);

  /* 🔹 FORM STATE */
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    countryCode: "+91",
    address: "",
    gender: "",
    dob: "",
    latitude: "",
    longitude: "",
    profileImage: null,
    profileImageUrl: null,
  });

  /* ✅ PREFILL DATA FROM USER CONTEXT */
  useEffect(() => {
    if (user) {
      console.log("👤 User data:", user);
      
      // Get user ID from various possible fields
      const userId = user.id || user.user_Id || user.userId;
      
      setForm({
        id: userId,
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        username: user.username || "",
        countryCode: user.countryCode || "+91",
        address: user.address || "",
        gender: user.gender || "",
        dob: user.dob || "",
        latitude: user.latitude?.toString() || location?.latitude?.toString() || "",
        longitude: user.longitude?.toString() || location?.longitude?.toString() || "",
        profileImage: null,
        profileImageUrl: user.profile || user.profilePicture || null,
      });
    }
  }, [user, location]);

  /* ✅ PICK IMAGE FROM GALLERY */
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduce quality to 50% to avoid network errors
        base64: false, // Don't use base64 for better performance
      });

      if (!result.canceled && result.assets[0]) {
        console.log("📸 Image selected:", result.assets[0].uri);
        
        // Get file info using new File API (optional)
        try {
          const file = new File(result.assets[0].uri);
          const fileInfo = await file.info();
          console.log("📸 File size:", fileInfo.size, "bytes");
        } catch (infoError) {
          console.log("Could not get file info, continuing anyway");
        }
        
        setForm({
          ...form,
          profileImage: result.assets[0],
          profileImageUrl: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  /* ✅ UPDATE PROFILE WITH IMAGE - FIXED FOR ANDROID */
  const handleUpdate = async () => {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }

    if (form.phone && form.phone.length !== 10) {
      Alert.alert("Validation Error", "Phone number must be 10 digits");
      return;
    }

    try {
      setLoading(true);

      const userId = user?.id || user?.user_Id || user?.userId;
      
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        return;
      }

      console.log("📝 Updating user with ID:", userId);

      // ✅ Create FormData for multipart/form-data
      const formData = new FormData();
      
      // Add all text fields
      formData.append("userId", userId.toString());
      if (form.name) formData.append("name", form.name);
      if (form.phone) formData.append("phone", form.phone);
      if (form.email) formData.append("email", form.email);
      if (form.username) formData.append("username", form.username);
      if (form.countryCode) formData.append("countryCode", form.countryCode);
      if (form.address) formData.append("address", form.address);
      if (form.gender) formData.append("gender", form.gender);
      if (form.dob) formData.append("dob", form.dob);
      if (form.latitude) formData.append("latitude", form.latitude);
      if (form.longitude) formData.append("longitude", form.longitude);

      // ✅ Add profile image if selected - CORRECT FORMAT FOR ANDROID
      if (form.profileImage) {
        const imageUri = form.profileImage.uri;
        
        // Get filename from URI
        const filename = imageUri.split('/').pop() || `profile_${Date.now()}.jpg`;
        
        // Get correct MIME type
        const mimeType = form.profileImage.mimeType || 
                        (filename.endsWith('.png') ? 'image/png' : 'image/jpeg');
        
        // ✅ CRITICAL: Correct format for Android - must have uri, type, name
        const fileObject = {
          uri: imageUri,
          type: mimeType,
          name: filename,
        };
        
        console.log("📸 File object:", fileObject);
        formData.append("profile", fileObject);
      }

      console.log("📤 Sending update request with FormData");

      // ✅ IMPORTANT: Do NOT set Content-Type header manually!
      // Let axios set it with the correct boundary parameter
      const response = await api.post(API.UPDATE_PROFILE, formData, {
        headers: {
          'Accept': 'application/json',
          // 'Content-Type' is intentionally omitted - axios will set it with boundary
        },
        timeout: 60000, // 60 second timeout for large files
      });

      console.log("✅ Update Response:", response.data);

      if (response.data?.status === true) {
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
        
        // Refresh user data
        if (refreshUserDean) {
          await refreshUserDean();
        }
      } else {
        Alert.alert("Error", response.data?.message || "Profile update failed");
      }
    } catch (err) {
      console.error("❌ Update error:", err);
      
      if (err.response) {
        // Server responded with error
        console.error("❌ Error response data:", err.response.data);
        console.error("❌ Error response status:", err.response.status);
        Alert.alert("Error", err.response.data?.message || "Server error");
      } else if (err.request) {
        // Request was made but no response
        console.error("❌ No response received");
        Alert.alert(
          "Network Error", 
          "Could not connect to server. Please check your internet connection and try again."
        );
      } else {
        // Something else happened
        console.error("❌ Error message:", err.message);
        Alert.alert("Error", err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ✅ UPDATE PROFILE PICTURE ONLY - FIXED FOR ANDROID */
  const updateProfilePictureOnly = async () => {
    if (!form.profileImage) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    try {
      setLoading(true);

      const userId = user?.id || user?.user_Id || user?.userId;
      
      if (!userId) {
        Alert.alert("Error", "User ID not found");
        return;
      }

      const formData = new FormData();
      formData.append("userId", userId.toString());
      
      const imageUri = form.profileImage.uri;
      const filename = imageUri.split('/').pop() || `profile_${Date.now()}.jpg`;
      const mimeType = form.profileImage.mimeType || 
                      (filename.endsWith('.png') ? 'image/png' : 'image/jpeg');
      
      // ✅ CRITICAL: Correct format for Android
      const fileObject = {
        uri: imageUri,
        type: mimeType,
        name: filename,
      };
      
      formData.append("profile", fileObject);

      console.log("📸 Updating profile picture only");

      // ✅ IMPORTANT: No manual Content-Type header
      const response = await api.post(API.UPDATE_PROFILE_PICTURE, formData, {
        headers: {
          'Accept': 'application/json',
        },
        timeout: 60000,
      });

      console.log("✅ Profile picture update response:", response.data);

      if (response.data?.status === true) {
        Alert.alert("Success", "Profile picture updated successfully");
        if (refreshUserDean) {
          await refreshUserDean();
        }
        // Clear the selected image after successful upload
        setForm({ ...form, profileImage: null });
      } else {
        Alert.alert("Error", response.data?.message || "Failed to update profile picture");
      }
    } catch (err) {
      console.error("❌ Profile picture update error:", err);
      Alert.alert("Error", "Failed to update profile picture");
    } finally {
      setLoading(false);
    }
  };

  /* ✅ DATE PICKER HANDLER */
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setForm({ ...form, dob: formattedDate });
    }
  };

  /* ✅ GENDER SELECTOR */
  const GenderSelector = () => (
    <View style={styles.genderContainer}>
      {["Male", "Female", "Other"].map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.genderOption,
            form.gender === option && styles.genderOptionSelected,
          ]}
          onPress={() => setForm({ ...form, gender: option })}
        >
          <Text
            style={[
              styles.genderText,
              form.gender === option && styles.genderTextSelected,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* 🔙 HEADER with Gradient */}
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
        {/* 🖼️ PROFILE IMAGE SECTION */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer} disabled={loading}>
            {form.profileImageUrl ? (
              <Image
                source={{ uri: form.profileImageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="person" size={40} color="#94a3b8" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageHint}>Tap to change profile picture</Text>
          {form.profileImage && (
            <Text style={styles.imageNote}>✓ New photo selected</Text>
          )}
          
          {/* Separate buttons for profile update options */}
          {form.profileImage && (
            <View style={styles.imageActionRow}>
              <TouchableOpacity 
                style={styles.imageActionButton}
                onPress={updateProfilePictureOnly}
                disabled={loading}
              >
                <Text style={styles.imageActionText}>Update Photo Only</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 📝 FORM CARD */}
        <View style={styles.card}>
          {/* Personal Information */}
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Input
            label="Full Name *"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            icon="person-outline"
            required
          />

          <Input
            label="Username"
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
            icon="at-outline"
          />

          <View style={styles.row}>
            <View style={[styles.halfInput, { marginRight: 8 }]}>
              <Input
                label="Country Code"
                value={form.countryCode}
                onChangeText={(text) => setForm({ ...form, countryCode: text })}
                icon="flag-outline"
              />
            </View>
            <View style={[styles.halfInput, { marginLeft: 8 }]}>
              <Input
                label="Phone"
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
                icon="call-outline"
                keyboard="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          <Input
            label="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            icon="mail-outline"
            keyboard="email-address"
            autoCapitalize="none"
          />

          {/* Gender Selection */}
          <Text style={styles.label}>Gender</Text>
          <GenderSelector />

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#2c5a73" />
            <Text style={styles.dateText}>
              {form.dob || "Select Date of Birth"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={form.dob ? new Date(form.dob) : new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Address Information */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Address Information</Text>

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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelBtn]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.updateBtn, loading && styles.buttonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <LinearGradient
                colors={["#2c5a73", "#1e3c4f"]}
                style={styles.updateGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.updateBtnText}>
                    {form.profileImage ? "Update All" : "Update Profile"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* 🔹 REUSABLE INPUT COMPONENT */
const Input = ({ label, value, onChangeText, icon, keyboard, multiline, maxLength, required }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.requiredStar}>*</Text>}
    </Text>
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
        maxLength={maxLength}
      />
    </View>
  </View>
);

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 8,
  },
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
  imageHint: {
    fontSize: 12,
    color: "#64748b",
  },
  imageNote: {
    fontSize: 11,
    color: "#10B981",
    marginTop: 4,
    fontWeight: "500",
  },
  imageActionRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  imageActionButton: {
    backgroundColor: "#2c5a73",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 6,
  },
  requiredStar: {
    color: "#EF4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1e293b",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  halfInput: {
    flex: 1,
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
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
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#1e293b",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
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
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  updateBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  updateGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  updateBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});