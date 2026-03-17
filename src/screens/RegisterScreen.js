import React, { useState, useRef } from "react";
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
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/apiClient";

// Firebase OTP imports
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { signInWithPhoneNumber } from "firebase/auth";
import { auth, firebaseConfig } from "../firebaseConfig";

export default function RegisterScreen({ navigation }) {
  const recaptchaVerifier = useRef(null);

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP states
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Validation
  const validatePhone = (number) => {
    return number.length === 10 && /^\d+$/.test(number);
  };

  // 🔹 SEND OTP
  const sendOtp = async () => {
    if (!validatePhone(phone)) {
      Alert.alert("Error", "Enter a valid 10-digit phone number");
      return;
    }

    try {
      setOtpLoading(true);
      const phoneNumber = countryCode + phone;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier.current
      );
      setConfirmation(confirmationResult);
      setOtpSent(true);
      Alert.alert("OTP Sent", `Verification code sent to ${phoneNumber}`);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // 🔹 VERIFY OTP
  const verifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setOtpLoading(true);
      await confirmation.confirm(otp);
      setOtpVerified(true);
      Alert.alert("Success", "Phone number verified successfully");
    } catch {
      Alert.alert("Invalid OTP", "Please check the code and try again");
    } finally {
      setOtpLoading(false);
    }
  };

  // 🔹 REGISTER
  const handleRegister = async () => {
    if (!otpVerified) {
      Alert.alert("Error", "Please verify your phone number first");
      return;
    }

    if (!name || !username || !phone || !password) {
      Alert.alert("Error", "All fields are required");
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
      const res = await api.post("/user/register", {
        name,
        username,
        countryCode,
        phone,
        password,
      });

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
      Alert.alert("Error", err.response?.data?.message || "Something went wrong, try again");
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
      {/* Firebase reCAPTCHA modal – must be placed here */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
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
                {phone.length === 10 && !otpVerified && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.inputRightIcon} />
                )}
                {otpVerified && (
                  <Ionicons name="checkmark-done-circle" size={20} color="#10B981" style={styles.inputRightIcon} />
                )}
              </View>
            </View>

            {/* OTP Section */}
            {!otpSent && (
              <TouchableOpacity
                style={[styles.button, otpLoading && styles.buttonDisabled]}
                onPress={sendOtp}
                disabled={otpLoading}
              >
                <LinearGradient
                  colors={['#2c5a73', '#1e3c4f']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>SEND OTP</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {otpSent && !otpVerified && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#94a3b8"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, otpLoading && styles.buttonDisabled]}
                  onPress={verifyOtp}
                  disabled={otpLoading}
                >
                  <LinearGradient
                    colors={['#2c5a73', '#1e3c4f']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    {otpLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>VERIFY OTP</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Password Fields (always visible) */}
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

            {/* Register Button (disabled until OTP verified) */}
            <TouchableOpacity
              style={[styles.button, (!otpVerified || loading) && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={!otpVerified || loading}
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
  container: { flex: 1 },
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: "hidden",
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
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
    marginBottom: 25,
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
    overflow: "hidden",
    marginBottom: 15,
  },
  buttonGradient: {
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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