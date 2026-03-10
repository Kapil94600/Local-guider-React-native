import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "https://localguider.sinfode.com/api";

export default function AddBalanceScreen() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // 🔹 Get user profile (contains current wallet balance)
  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      if (!token || !userId) {
        Alert.alert("Error", "You are not logged in");
        return;
      }

      // Send userId as form data (backend expects form data, not JSON)
      const formData = new FormData();
      formData.append("userId", userId);

      const res = await fetch(`${API}/user/get_profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // No Content-Type header – browser sets it automatically with boundary
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();

      if (json?.status && json?.data) {
        // The user object contains the 'balance' field
        setBalance(json.data.balance || 0);
      } else {
        console.log("Profile fetch failed:", json);
        Alert.alert("Error", json?.message || "Failed to fetch profile");
      }
    } catch (err) {
      console.log("PROFILE ERROR", err);
      Alert.alert("Error", "Could not fetch balance");
    }
  };

  // 🔹 Razorpay Key (no parameters needed)
  const getRazorpayKey = async () => {
    const res = await fetch(`${API}/settings/get`, {
      method: "POST",
    });
    const json = await res.json();
    if (json?.data?.razorpayAPIKey) {
      return json.data.razorpayAPIKey;
    }
    throw new Error("Failed to fetch Razorpay key");
  };

  // 🔹 Create Transaction (uses FormData)
  const createTransaction = async (amountValue) => {
    const token = await AsyncStorage.getItem("token");
    const userId = await AsyncStorage.getItem("userId");

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("amount", amountValue);

    const res = await fetch(`${API}/transaction/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await res.json();
    if (json.data) {
      return json.data; // contains paymentToken
    }
    throw new Error("Transaction creation failed");
  };

  // 🔹 Update Transaction Status (uses FormData)
  const updateTransaction = async (paymentToken, status) => {
    const token = await AsyncStorage.getItem("token");

    const formData = new FormData();
    formData.append("paymentToken", paymentToken);
    formData.append("paymentStatus", status);

    const res = await fetch(`${API}/transaction/update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Failed to update transaction: ${res.status}`);
    }

    const json = await res.json();
    if (!json?.status) {
      throw new Error(json?.message || "Transaction update failed");
    }
  };

  // 🔹 Start Payment
  const startPayment = async () => {
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert("Error", "Enter valid amount");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Get Razorpay key
      const key = await getRazorpayKey();

      // Step 2: Create transaction
      const transaction = await createTransaction(amount);
      const orderId = transaction.paymentToken;

      // Step 3: Open Razorpay
      const options = {
        description: "Wallet Recharge",
        currency: "INR",
        key: key,
        amount: parseInt(amount) * 100, // Razorpay expects paise
        name: "Local Guider",
        order_id: orderId,
        method: {
          card: true,
          upi: true,
          netbanking: true,
          wallet: true,
        },
        prefill: {
          contact: "9999999999", // You can replace with user's phone
        },
        theme: { color: "#3399cc" },
      };

      const data = await RazorpayCheckout.open(options);
      console.log("PAYMENT SUCCESS", data);

      // Step 4: Update transaction status to success
      await updateTransaction(orderId, "success");

      Alert.alert("Success", "Payment Successful");
      setAmount("");

      // Step 5: Refresh the user profile to get updated balance
      await fetchUserProfile();
    } catch (err) {
      console.log("PAYMENT ERROR", err);
      
      // Razorpay cancellation has code 0
      if (err.code === 0) {
        Alert.alert("Payment Cancelled");
      } else {
        Alert.alert("Error", err.message || "Payment failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet Balance</Text>
      <Text style={styles.balance}>₹ {balance.toFixed(2)}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#3399cc" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={startPayment}>
          <Text style={styles.btnText}>Add Balance</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
  },
  balance: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#3399cc",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#3399cc",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
  },
});