import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api"; // 👈 path corrected
import { AuthContext } from "../../context/AuthContext";

export default function AddBalanceScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useContext(AuthContext);

  const handleAddBalance = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Error", "Enter valid amount");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/user/add_balance", {
        amount: Number(amount),
      });

      if (res?.data?.status === true) {
        await refreshUser(); // ✅ balance live update
        Alert.alert("Success", "Balance added successfully");
        navigation.goBack();
      } else {
        Alert.alert("Failed", res?.data?.message || "Try again");
      }
    } catch (err) {
      Alert.alert("Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔵 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Add Balance</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 💳 CONTENT */}
      <View style={styles.card}>
        <Text style={styles.label}>Enter Amount</Text>

        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="₹ 0"
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleAddBalance}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Please wait..." : "Add Balance"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    backgroundColor: "#2563EB",
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },

  btn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
