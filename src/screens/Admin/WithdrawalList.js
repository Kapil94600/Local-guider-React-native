import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function WithdrawalList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await api.post(API.GET_WITHDRAWAL, {
        page: 1,
        perPage: 50,
        admin: true,
      });
      setList(res.data?.data || []);
    } catch (e) {
      console.log("Withdrawal list error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const respond = (item, status) => {
    Alert.alert(
      status === "APPROVED" ? "Approve Withdrawal" : "Reject Withdrawal",
      `Are you sure you want to ${status.toLowerCase()} this request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "APPROVED" ? "Approve" : "Reject",
          style: status === "APPROVED" ? "default" : "destructive",
          onPress: async () => {
            try {
              await api.post(API.RESPOND_WITHDRAWAL, {
                withdrawalId: item.id,
                status, // "APPROVED" | "REJECTED"
              });
              fetchWithdrawals();
            } catch (e) {
              console.log("Respond withdrawal error:", e.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.userName || "User"}</Text>
        <Text style={styles.meta}>
          Amount: ₹{item.amount} • {item.method || "—"}
        </Text>
        <Text style={styles.status}>Status: {item.status}</Text>
      </View>

      {item.status === "PENDING" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.approve]}
            onPress={() => respond(item, "APPROVED")}
          >
            <Text style={styles.btnText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.reject]}
            onPress={() => respond(item, "REJECTED")}
          >
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={list}
      keyExtractor={(i) => i.id?.toString()}
      contentContainerStyle={{ padding: 16 }}
      refreshing={loading}
      onRefresh={fetchWithdrawals}
      renderItem={renderItem}
      ListEmptyComponent={
        <Text style={styles.empty}>No withdrawal requests</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    elevation: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  meta: {
    marginTop: 4,
    color: "#6B7280",
  },
  status: {
    marginTop: 6,
    color: "#374151",
    fontWeight: "500",
  },
  actions: {
    justifyContent: "center",
    marginLeft: 8,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    alignItems: "center",
  },
  approve: {
    backgroundColor: "#16A34A",
  },
  reject: {
    backgroundColor: "#DC2626",
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
  },
});
