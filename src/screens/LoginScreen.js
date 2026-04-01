import React, { useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { IS_ADMIN_APP } from "../appMode";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import api from "../api/apiClient";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);

  // Main login states
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forget password modal states
  const [forgetModalVisible, setForgetModalVisible] = useState(false);
  const [forgetPhone, setForgetPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgetLoading, setForgetLoading] = useState(false);

  // OTP states (for WebView flow)
  const [otp, setOtp] = useState("");
  const [resetStep, setResetStep] = useState("phone"); // 'phone', 'otp', 'password'

  // WebView ref and ready state
  const webViewRef = useRef(null);
  const [webViewReady, setWebViewReady] = useState(false);

  // ✅ Phone validation (10 digits)
  const validatePhone = (number) => /^[0-9]{10}$/.test(number);

  // ✅ Handle messages from WebView
  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message:", data);

      switch (data.type) {
        case "WEBVIEW_READY":
          setWebViewReady(true);
          break;
        case "OTP_SENT":
          setResetStep("otp");
          Alert.alert("OTP Sent", "Verification code sent successfully");
          break;
        case "VERIFIED":
          setResetStep("password");
          Alert.alert("Success", "Phone number verified");
          break;
        case "INVALID":
          Alert.alert("Invalid OTP", "Please check the code and try again");
          break;
        case "ERROR":
          Alert.alert("Error", data.message);
          break;
        default:
          break;
      }
    } catch (err) {
      console.log("Invalid message from WebView", err);
    }
  };

  // ✅ Main login handler
  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Error", "Phone & password are required");
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/user/login", { phone, password });

      if (res.data.status) {
        const userData = res.data.data;
        const token = userData.token;

        await AsyncStorage.setItem("token", token);

        const userId = userData?.id || userData?.user?.id;
        if (userId) {
          await AsyncStorage.setItem("userId", userId.toString());
        }

        // ✅ ROLE CHECK (FINAL)
        if (userData.photographerId || userData.photographer) {
          login({ ...userData, role: "photographer", token });
        } else if (userData.guiderId || userData.guider) {
          login({ ...userData, role: "guider", token });
        } else {
          login({ ...userData, role: "user", token });
        }
      } else {
        Alert.alert("Error", res.data.message || "Login failed");
      }
    } catch (err) {
      Alert.alert("Error", "Invalid phone or password");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Send OTP via WebView
  const sendOtp = () => {
    if (!webViewReady) {
      Alert.alert("Error", "OTP service not ready. Please try again.");
      return;
    }
    if (!validatePhone(forgetPhone)) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    const phoneNumber = "+91" + forgetPhone; // यहाँ देश कोड अपने अनुसार बदलें
    webViewRef.current.injectJavaScript(`
      window.sendOTP('${phoneNumber}');
    `);
  };

  // ✅ Verify OTP via WebView
  const verifyOtp = () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }
    webViewRef.current.injectJavaScript(`
      window.verifyOTP('${otp}');
    `);
  };

  // ✅ Password Reset API call
  const handleForgetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setForgetLoading(true);
      const res = await api.post("/user/forget_password", {
        phoneNumber: forgetPhone,
        password: newPassword,
      });

      if (res.data.status) {
        Alert.alert(
          "Success",
          "Password changed successfully! Please login with your new password.",
          [
            {
              text: "OK",
              onPress: () => {
                setForgetModalVisible(false);
                resetForgetModal();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", res.data.message || "Failed to reset password");
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Something went wrong");
    } finally {
      setForgetLoading(false);
    }
  };

  const resetForgetModal = () => {
    setForgetPhone("");
    setNewPassword("");
    setConfirmPassword("");
    setOtp("");
    setResetStep("phone");
  };

  // Render modal content based on step
  const renderModalContent = () => {
    switch (resetStep) {
      case "phone":
        return (
          <>
            <Text style={styles.modalSubtitle}>
              Enter your phone number to receive an OTP
            </Text>
            <View style={styles.modalInputContainer}>
              <Ionicons name="call-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#94a3b8"
                value={forgetPhone}
                onChangeText={setForgetPhone}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.modalInput}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalButton, forgetLoading && styles.buttonDisabled]}
              onPress={sendOtp}
              disabled={forgetLoading}
            >
              <LinearGradient
                colors={["#2c5a73", "#1e3c4f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalButtonGradient}
              >
                {forgetLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Send OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        );

      case "otp":
        return (
          <>
            <Text style={styles.modalSubtitle}>
              Enter the 6-digit OTP sent to +91{forgetPhone}
            </Text>
            <View style={styles.modalInputContainer}>
              <Ionicons name="key-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor="#94a3b8"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.modalInput}
              />
            </View>
            <TouchableOpacity
              style={[styles.modalButton, forgetLoading && styles.buttonDisabled]}
              onPress={verifyOtp}
              disabled={forgetLoading}
            >
              <LinearGradient
                colors={["#2c5a73", "#1e3c4f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalButtonGradient}
              >
                {forgetLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Verify OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setResetStep("phone")}
            >
              <Text style={styles.modalCancelText}>Change Phone Number</Text>
            </TouchableOpacity>
          </>
        );

      case "password":
        return (
          <>
            <Text style={styles.modalSubtitle}>Set a new password</Text>

            <View style={styles.modalInputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                placeholder="New Password"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                style={styles.modalInput}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#2c5a73"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.modalInput}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#2c5a73"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Password must:</Text>
              <Text style={styles.requirementItem}>• Be at least 6 characters</Text>
              <Text style={styles.requirementItem}>• Match in both fields</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, forgetLoading && styles.buttonDisabled]}
              onPress={handleForgetPassword}
              disabled={forgetLoading}
            >
              <LinearGradient
                colors={["#2c5a73", "#1e3c4f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalButtonGradient}
              >
                {forgetLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Reset Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <LinearGradient
      colors={
        IS_ADMIN_APP
          ? ["#2c3e50", "#3498db"]
          : ["#1e3c4f", "#2c5a73", "#3b7a8f"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Invisible WebView for Firebase OTP */}
      <WebView
        ref={webViewRef}
        source={{ uri: "https://your-domain.com/firebase-otp.html" }} // ✅ अपना होस्टेड URL यहाँ डालें
        style={{ height: 0, width: 0, opacity: 0 }}
        onMessage={onMessage}
        onLoad={() => console.log("WebView loaded")}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : undefined}

  keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={styles.title}>
              {IS_ADMIN_APP ? "Admin Login" : "Welcome Back!"}
            </Text>
            <Text style={styles.subTitle}>
              {IS_ADMIN_APP ? "Access admin dashboard" : "Sign in to continue your journey"}
            </Text>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#94a3b8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                style={styles.input}
              />
              {phone.length === 10 && (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.inputRightIcon} />
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#2c5a73"
                />
              </TouchableOpacity>
            </View>

            {/* Forget Password Link */}
            <TouchableOpacity
              style={styles.forgetLink}
              onPress={() => {
                setForgetModalVisible(true);
                setResetStep("phone"); // start fresh
              }}
            >
              <Text style={styles.forgetText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#2c5a73", "#1e3c4f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>LOGIN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Register Link */}
            {!IS_ADMIN_APP && (
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")}>
                  <Text style={styles.registerLink}>Register here</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forget Password Modal */}
      <Modal
        visible={forgetModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setForgetModalVisible(false);
          resetForgetModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setForgetModalVisible(false);
                  resetForgetModal();
                }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {renderModalContent()}

              {/* Cancel button at bottom for all steps */}
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setForgetModalVisible(false);
                  resetForgetModal();
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Styles (same as before, no changes needed)
const styles = StyleSheet.create({
 
scrollContainer: {
  flexGrow: 1,
  alignItems: "center",
  justifyContent: Platform.OS === "web" ? "center" : "flex-start",
  paddingTop: Platform.OS === "web" ? 80 : 40,
  paddingBottom: 260,
  marginTop:100

},
  card: {
  width: "90%",
  maxWidth: 400,
  backgroundColor: "#fff",
  borderRadius: 24,
  padding: 25,
  elevation: 12,
  marginBottom: 20, // clean spacing
},

  iconContainer: { alignItems: "center", marginBottom: 15 },
  iconBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  logoImage: { width: 70, height: 70, resizeMode: "contain" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 15,
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
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1e293b" },
  inputRightIcon: { marginLeft: 8 },
  eyeIcon: { padding: 8 },
  forgetLink: { alignSelf: "flex-end", marginBottom: 20 },
  forgetText: { color: "#2c5a73", fontSize: 13, fontWeight: "500" },
  button: { borderRadius: 14, marginTop: 5, overflow: "hidden" },
  buttonGradient: { padding: 16, alignItems: "center" },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: { color: "#64748b", fontSize: 14 },
  registerLink: { color: "#2c5a73", fontSize: 14, fontWeight: "600" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  modalInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1e293b" },
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
  requirementItem: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  modalButton: { borderRadius: 14, marginBottom: 10, overflow: "hidden" },
  modalButtonGradient: { padding: 16, alignItems: "center" },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalCancelBtn: {
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    marginTop: 5,
  },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
});