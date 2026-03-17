import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import RazorpayCheckout from "react-native-razorpay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../context/AuthContext";

const API = "https://localguider.sinfode.com/api";

export default function AddBalanceScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (user?.id) fetchUserProfile();
    else Alert.alert("Error", "You are not logged in");
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !user?.id) return;

      const formData = new FormData();
      formData.append("userId", user.id.toString());

      const res = await fetch(`${API}/user/get_profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (json?.status && json?.data) setBalance(json.data.balance || 0);
      else Alert.alert("Error", json?.message || "Failed to fetch profile");
    } catch (err) {
      console.log("PROFILE ERROR", err);
      Alert.alert("Error", "Could not fetch balance");
    }
  };

  const getRazorpayKey = async () => {
    const res = await fetch(`${API}/settings/get`, { method: "POST" });
    const json = await res.json();
    if (json?.data?.razorpayAPIKey) return json.data.razorpayAPIKey;
    throw new Error("Failed to fetch Razorpay key");
  };

  const createTransaction = async (amountValue) => {
    const token = await AsyncStorage.getItem("token");
    const formData = new FormData();
    formData.append("userId", user.id.toString());
    formData.append("amount", amountValue);

    const res = await fetch(`${API}/transaction/create`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json();
    if (json.data) return json.data;
    throw new Error("Transaction creation failed: " + (json.message || "Unknown error"));
  };

  const updateTransaction = async (paymentToken, status) => {
    const token = await AsyncStorage.getItem("token");
    const formData = new FormData();
    formData.append("paymentToken", paymentToken);
    formData.append("paymentStatus", status);

    const res = await fetch(`${API}/transaction/update`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json();
    if (!json?.status) throw new Error(json?.message || "Transaction update failed");
    return json;
  };

  const startPayment = async () => {
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert("Error", "Enter valid amount");
      return;
    }

    try {
      setLoading(true);

      const key = await getRazorpayKey();
      const transaction = await createTransaction(amount);
      const orderId = transaction.paymentToken;

      const options = {
        description: "Wallet Recharge",
        currency: "INR",
        key: key,
        amount: parseInt(amount) * 100,
        name: "Local Guider",
        order_id: orderId,
        method: { card: true, upi: true, netbanking: true, wallet: true },
        prefill: { contact: user?.phone || "9999999999" },
        theme: { color: "#2c5a73" },
      };

      const data = await RazorpayCheckout.open(options);
      console.log("PAYMENT SUCCESS", data);

      // -----------------------------------------------------------------
      // 🔁 REPLACE THIS LINE WITH THE CORRECT STATUS STRING (once known)
      // -----------------------------------------------------------------
    await updateTransaction(orderId, "success");
      // -----------------------------------------------------------------

      Alert.alert("Success", "Payment Successful");
      setAmount("");
      await fetchUserProfile();
    } catch (err) {
      console.log("PAYMENT ERROR", err);
      if (err.code === 0) Alert.alert("Payment Cancelled");
      else Alert.alert("Error", err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1e3c4f" />
      <SafeAreaView style={styles.safeArea}>
        {/* Distinct Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.container}>
          {/* Balance Card */}
          <LinearGradient
            colors={['#2c5a73', '#1e3c4f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceRow}>
              <Ionicons name="wallet-outline" size={36} color="#FFD700" />
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>₹ {balance.toFixed(2)}</Text>
            <View style={styles.balanceFooter}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#b0d0e0" />
              <Text style={styles.balanceFooterText}>Secured Wallet</Text>
            </View>
          </LinearGradient>

          {/* Add Money Section */}
          <View style={styles.addMoneyCard}>
            <Text style={styles.sectionTitle}>Add Money</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={24} color="#2c5a73" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#a0b8c5"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={startPayment}
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
                  <>
                    <Ionicons name="add-circle-outline" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Add Balance</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Payment Note */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#b0d0e0" />
            <Text style={styles.noteText}>
              You will be redirected to Razorpay to complete the payment securely.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop:20
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop:18
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    marginTop:25
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 18,
    color: "#fff",
    marginLeft: 10,
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  balanceFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 10,
  },
  balanceFooterText: {
    fontSize: 12,
    color: "#b0d0e0",
    marginLeft: 5,
  },
  addMoneyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#1e3c4f",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e3c4f",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0e0e8",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: "#f5f9fc",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 18,
    color: "#1e3c4f",
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 10,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  noteText: {
    fontSize: 12,
    color: "#b0d0e0",
    marginLeft: 5,
    flex: 1,
  },
});