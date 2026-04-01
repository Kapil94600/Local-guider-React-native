import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/apiClient";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Simple validation - matching your working version
  const validatePhone = (number) => {
    return number.length === 10 && /^\d+$/.test(number);
  };

  const handleRegister = async () => {
    // Basic validation - matching your working version
    if (!name || !username || !phone || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (phone.length !== 10) {
      Alert.alert("Error", "Phone number must be 10 digits");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Simple register - matching your working version
      const res = await api.post("/user/register", {
        name,
        username,
        countryCode,
        phone,
        password,
      });

      console.log("Register Response:", res.data);

      if (res.data.status) {
        Alert.alert(
          "Success", 
          "Registered successfully! Please login with your credentials.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      } else {
        Alert.alert("Registration Failed", res.data.message || "Something went wrong");
      }
    } catch (err) {
      console.log("Register API Error:", err.response?.data || err.message);
      
      // Handle 401 error specifically
      if (err.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please try again.");
      } else {
        Alert.alert("Error", err.response?.data?.message || "Something went wrong, try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={["#1e3c4f", "#2c5a73", "#3b7a8f"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name="person-add" size={40} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subTitle}>Join our community of explorers! 🚀</Text>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Username */}
            <View style={styles.inputContainer}>
              <Ionicons name="at-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#94a3b8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone with Country Code */}
            <View style={styles.phoneRow}>
              <View style={[styles.inputContainer, styles.countryCodeContainer]}>
                <Ionicons name="flag-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                <TextInput
                  style={styles.countryCodeInput}
                  placeholder="+91"
                  placeholderTextColor="#94a3b8"
                  value={countryCode}
                  onChangeText={setCountryCode}
                  maxLength={4}
                />
              </View>
              
              <View style={[styles.inputContainer, styles.phoneContainer]}>
                <Ionicons name="call-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Phone (10 digits)"
                  placeholderTextColor="#94a3b8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {phone.length === 10 && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.inputRightIcon} />
                )}
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#2c5a73" 
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#2c5a73" 
                />
              </TouchableOpacity>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Password must:</Text>
              <Text style={styles.requirementItem}>✓ Be at least 6 characters</Text>
              <Text style={styles.requirementItem}>✓ Match in both fields</Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['#2c5a73', '#1e3c4f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scroll: { 
    flexGrow: 1, 
    justifyContent: "center", 
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 25,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  iconBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2c5a73',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },
  subTitle: { 
    fontSize: 14, 
    color: "#64748b", 
    textAlign: "center", 
    marginBottom: 25 
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },
  phoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  countryCodeContainer: {
    flex: 1,
    marginRight: 8,
  },
  countryCodeInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },
  phoneContainer: {
    flex: 2,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
  },
  inputRightIcon: {
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  requirementsBox: {
    backgroundColor: "#f1f5f9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 15,
  },
  buttonGradient: {
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold", 
    textAlign: "center" 
  },
  loginLink: {
    marginTop: 5,
    alignItems: "center",
  },
  loginText: { 
    color: "#64748b", 
    textAlign: "center", 
    fontSize: 14,
  },
  loginBold: {
    color: "#2c5a73",
    fontWeight: "600",
  },
});