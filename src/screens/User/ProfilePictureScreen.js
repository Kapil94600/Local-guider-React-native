import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

export default function ProfilePictureScreen({ navigation }) {
  const { refreshUser } = useContext(AuthContext);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!res.canceled) {
      setImage(res.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("file", {
      uri: image.uri,
      name: "profile.jpg",
      type: "image/jpeg",
    });

    try {
      setLoading(true);
      const res = await api.post(
        "/user/update_profile_picture",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res?.data?.status) {
        await refreshUser();
        Alert.alert("Success", "Profile picture updated");
        navigation.goBack();
      } else {
        Alert.alert("Failed", "Upload failed");
      }
    } catch (e) {
      Alert.alert("Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Picture</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.image} />
          ) : (
            <Ionicons name="image-outline" size={40} color="#6B7280" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={uploadImage}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Uploading..." : "Upload"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#2563EB",
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    alignItems: "center",
  },
  imageBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  btn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
