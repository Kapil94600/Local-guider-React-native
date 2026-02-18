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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { API } from "../../api/apis";
import { AuthContext } from "../../context/AuthContext";

export default function UserEditProfileScreen({ navigation }) {
  const { user, setUser } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  /* PREFILL */
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setUsername(user.username || "");
      setAddress(user.address || "");
    }
  }, [user]);

  /* IMAGE PICK */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  /* SAVE PROFILE */
  const handleSave = async () => {
  if (!name.trim()) {
    Alert.alert("Validation", "Name is required");
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("userId", user.user_Id?.toString() || user.id?.toString()); // 👈 mandatory
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("username", username);
    formData.append("address", address);

    // optional fields
    formData.append("gender", "male");
    formData.append("dob", "1998-06-15");

    if (image?.uri) {
      formData.append("profile", {
        uri: image.uri,
        name: `profile_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
    }

    const res = await api.post(API.UPDATE_PROFILE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!res?.data?.success) {
      throw new Error(res?.data?.message);
    }

    setUser(res.data.data);
    Alert.alert("Success", "Profile updated successfully");
    navigation.goBack();
  } catch (err) {
    console.log("PROFILE UPDATE ERROR 👉", err?.response?.data || err);
    Alert.alert("Error", err?.response?.data?.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* PROFILE IMAGE */}
      <View style={styles.imageWrapper}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={{
              uri:
                image?.uri ||
                user?.profile_Image_Url ||
                "https://via.placeholder.com/150",
            }}
            style={styles.image}
          />
          <Text style={styles.changeText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      {/* FORM */}
      <View style={styles.card}>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Username" value={username} onChangeText={setUsername} />
        <Input label="Phone" value={phone} onChangeText={setPhone} />
        <Input label="Email" value={email} onChangeText={setEmail} />
        <Input label="Address" value={address} onChangeText={setAddress} />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* INPUT COMPONENT */
const Input = ({ label, value, onChangeText }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
    />
  </>
);

/* STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#446f94e3",
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  imageWrapper: { alignItems: "center", marginTop: 20 },
  image: { width: 120, height: 120, borderRadius: 60 },
  changeText: {
    textAlign: "center",
    marginTop: 8,
    color: "#2563EB",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
  },
  label: { fontWeight: "600", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: "#3a0250e3",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
