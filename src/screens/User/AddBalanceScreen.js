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
    fetchBalance();
  }, []);

  // 🔹 Wallet Balance
  const fetchBalance = async () => {

    try {

      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${API}/transaction/get`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const json = await res.json();

      if (json?.data) {

        let total = 0;

        json.data.forEach(t => {
          if (t.isCredit) total += t.amount;
          else total -= t.amount;
        });

        setBalance(total);
      }

    } catch (err) {
      console.log("BALANCE ERROR", err);
    }

  };

  // 🔹 Razorpay Key
  const getRazorpayKey = async () => {

    const res = await fetch(`${API}/settings/get`, {
      method: "POST"
    });

    const json = await res.json();

    if (json?.data?.razorpayAPIKey) {
      return json.data.razorpayAPIKey;
    }

    throw new Error("Failed to fetch Razorpay key");
  };

  // 🔹 Create Transaction
  const createTransaction = async (amountValue) => {

    const token = await AsyncStorage.getItem("token");
    const userId = await AsyncStorage.getItem("userId");

    const form = new FormData();
    form.append("userId", userId);
    form.append("amount", amountValue);

    const res = await fetch(`${API}/transaction/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    const json = await res.json();

    if (json.data) {
      return json.data;
    }

    throw new Error("Transaction failed");
  };

  // 🔹 Update Transaction Status
  const updateTransaction = async (paymentToken, status) => {

    const token = await AsyncStorage.getItem("token");

    const form = new FormData();
    form.append("paymentToken", paymentToken);
    form.append("paymentStatus", status);

    await fetch(`${API}/transaction/update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

  };

  // 🔹 Start Payment
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

      method: {
        card: true,
        upi: true,
        netbanking: true,
        wallet: true
      },

      prefill: {
        contact: "9999999999"
      },

      theme: { color: "#3399cc" }
    };

    RazorpayCheckout.open(options)

      .then(async (data) => {

        console.log("PAYMENT SUCCESS", data);

        await updateTransaction(orderId, "success");

        Alert.alert("Success", "Payment Successful");

        setAmount("");

        fetchBalance();

      })

      .catch((error) => {

        console.log("PAYMENT CANCELLED", error);

        Alert.alert("Payment Cancelled");

      });

  } catch (err) {

    console.log("PAYMENT ERROR", err);

    Alert.alert("Error", err.message);

  }

  setLoading(false);
};

  return (

    <View style={styles.container}>

      <Text style={styles.title}>Wallet Balance</Text>

      <Text style={styles.balance}>₹ {balance}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      {loading ? (

        <ActivityIndicator size="large" />

      ) : (

        <TouchableOpacity
          style={styles.button}
          onPress={startPayment}
        >
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
    padding: 20
  },

  title: {
    fontSize: 20,
    textAlign: "center"
  },

  balance: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#3399cc"
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20
  },

  button: {
    backgroundColor: "#3399cc",
    padding: 15,
    borderRadius: 8,
    alignItems: "center"
  },

  btnText: {
    color: "#fff",
    fontSize: 16
  }

});