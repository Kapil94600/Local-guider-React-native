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
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";
import { AuthContext } from "../../context/AuthContext";

const BASE_URL = "https://localguider.sinfode.com";

// 🔥 Get image URL from filename
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}/api/image/download/${path}`;
};

export default function UserEditProfileScreen({ navigation }) {
  const { user, setUser } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  /* PREFILL */
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setUsername(user.username || "");
      setAddress(user.address || "");
      setGender(user.gender || "");
      setDob(user.dob || "");
      
      if (user.profilePicture) {
        setProfileImageUrl(getImageUrl(user.profilePicture));
      }
    }
  }, [user]);

  /* IMAGE PICK */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
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

      // ✅ Get user ID properly
      const userId = user?.id || user?.user_Id;
      
      if (!userId) {
        Alert.alert("Error", "User ID not found");
        return;
      }

      console.log("📝 Updating user with ID:", userId);

      // ✅ Create FormData with correct field names that backend expects
      const formData = new FormData();
      formData.append("userId", userId.toString()); // Backend expects 'userId' as @RequestParam
      formData.append("name", name);
      
      if (phone) formData.append("phone", phone);
      if (email) formData.append("email", email);
      if (username) formData.append("username", username);
      if (address) formData.append("address", address);
      if (gender) formData.append("gender", gender);
      if (dob) formData.append("dob", dob);

      // ✅ Add profile picture if selected
      if (image?.uri) {
        const filename = image.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append("profile", {  // Backend expects 'profile' for image
          uri: image.uri,
          name: `profile_${Date.now()}.jpg`,
          type: type,
        });
        
        console.log("📸 Adding profile image:", filename);
      }

      // ✅ Log form data for debugging
      console.log("📤 Sending update request...");

      const response = await api.post(API.UPDATE_PROFILE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });

      console.log("✅ Update Response:", response.data);

      if (response.data?.status) {
        // ✅ Update user context with new data
        const updatedUser = {
          ...user,
          name: name,
          phone: phone,
          email: email,
          username: username,
          address: address,
          gender: gender,
          dob: dob,
        };
        
        // If image was updated, update profile picture
        if (response.data.data?.profilePicture) {
          updatedUser.profilePicture = response.data.data.profilePicture;
        }
        
        setUser(updatedUser);
        
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert("Error", response.data?.message || "Failed to update profile");
      }
    } catch (err) {
      console.log("❌ PROFILE UPDATE ERROR:", err?.response?.data || err);
      Alert.alert(
        "Error", 
        err?.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <LinearGradient
        colors={['#2c5a73', '#1e3c4f']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* PROFILE IMAGE */}
      <View style={styles.imageWrapper}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          <Image
            source={{
              uri: image?.uri || profileImageUrl || "https://via.placeholder.com/150",
            }}
            style={styles.image}
          />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.changeText}>Tap to change photo</Text>
      </View>

      {/* FORM */}
      <View style={styles.card}>
        <Input 
          label="Full Name *" 
          value={name} 
          onChangeText={setName} 
          icon="person-outline"
        />
        
        <Input 
          label="Username" 
          value={username} 
          onChangeText={setUsername} 
          icon="at-outline"
        />
        
        <Input 
          label="Phone Number" 
          value={phone} 
          onChangeText={setPhone} 
          icon="call-outline"
          keyboardType="phone-pad"
        />
        
        <Input 
          label="Email" 
          value={email} 
          onChangeText={setEmail} 
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <Input 
          label="Address" 
          value={address} 
          onChangeText={setAddress} 
          icon="location-outline"
          multiline
        />
        
        {/* Gender Selection */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === "male" && styles.genderOptionSelected,
            ]}
            onPress={() => setGender("male")}
          >
            <Text style={[
              styles.genderText,
              gender === "male" && styles.genderTextSelected,
            ]}>Male</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === "female" && styles.genderOptionSelected,
            ]}
            onPress={() => setGender("female")}
          >
            <Text style={[
              styles.genderText,
              gender === "female" && styles.genderTextSelected,
            ]}>Female</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === "other" && styles.genderOptionSelected,
            ]}
            onPress={() => setGender("other")}
          >
            <Text style={[
              styles.genderText,
              gender === "other" && styles.genderTextSelected,
            ]}>Other</Text>
          </TouchableOpacity>
        </View>

        <Input 
          label="Date of Birth" 
          value={dob} 
          onChangeText={setDob} 
          icon="calendar-outline"
          placeholder="YYYY-MM-DD"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient
            colors={['#2c5a73', '#1e3c4f']}
            style={styles.btnGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* INPUT COMPONENT */
const Input = ({ label, value, onChangeText, icon, ...props }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      {icon && <Ionicons name={icon} size={20} color="#2c5a73" style={styles.inputIcon} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, icon && styles.inputWithIcon]}
        placeholderTextColor="#94a3b8"
        {...props}
      />
    </View>
  </View>
);

/* STYLES */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f7fa" 
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#2c5a73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  imageWrapper: { 
    alignItems: "center", 
    marginTop: 20,
    marginBottom: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  image: { 
    width: 120, 
    height: 120, 
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#2c5a73',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2c5a73',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changeText: {
    textAlign: "center",
    marginTop: 8,
    color: "#2c5a73",
    fontWeight: "600",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: { 
    fontWeight: "600", 
    color: '#1e293b',
    marginBottom: 6,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  genderOptionSelected: {
    backgroundColor: '#2c5a73',
    borderColor: '#2c5a73',
  },
  genderText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#fff',
  },
  btn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
});