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

export default function AppointmentList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.post(API.GET_APPOINTMENTS, {
        page: 1,
        perPage: 50,
        admin: true,
      });
      setList(res.data?.data || []);
    } catch (e) {
      console.log("Appointment list error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const respond = (item, status) => {
    Alert.alert(
      status === "APPROVED" ? "Approve Appointment" : "Reject Appointment",
      `Are you sure you want to ${status.toLowerCase()} this appointment?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "APPROVED" ? "Approve" : "Reject",
          style: status === "APPROVED" ? "default" : "destructive",
          onPress: async () => {
            try {
              await api.post(API.RESPOND_APPOINTMENT, {
                appointmentId: item.id,
                status, // "APPROVED" | "REJECTED"
              });
              fetchAppointments();
            } catch (e) {
              console.log("Respond appointment error:", e.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {item.serviceName || "Appointment"}
        </Text>
        <Text style={styles.meta}>
          User: {item.userName || "—"}
        </Text>
        <Text style={styles.meta}>
          Provider: {item.providerName || "—"}
        </Text>
        <Text style={styles.meta}>
          Date: {item.date || "—"} • Slot: {item.timeSlot || "—"}
        </Text>
        <Text style={styles.status}>
          Status: {item.status}
        </Text>
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
      onRefresh={fetchAppointments}
      renderItem={renderItem}
      ListEmptyComponent={
        <Text style={styles.empty}>No appointments found</Text>
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
  title: {
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
