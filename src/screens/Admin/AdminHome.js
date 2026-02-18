  // screens/Admin/AdminHome.js
  import React, { useContext, useEffect, useState } from "react";
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
  } from "react-native";
  import axios from "axios";
  import { AuthContext } from "../../src/context/AuthContext";
  import { useFocusEffect, useNavigation } from "@react-navigation/native";

  const BASE_URL = "https://localguider.sinfode.com/api";

  export default function AdminHome() {
    const { logout, token } = useContext(AuthContext);
    const navigation = useNavigation();

    const [stats, setStats] = useState({
      users: 0,
      photographers: 0,
      guiders: 0,
      places: 0,
      withdrawals: 0,
      transactions: 0,
    });

    const fetchStats = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const statsData = response.data.data ? response.data.data : response.data;

        setStats({
          users: statsData.users || 0,
          photographers: statsData.photographers || 0,
          guiders: statsData.guiders || 0,
          places: statsData.places || 0,
          withdrawals: statsData.withdrawals || 0,
          transactions: statsData.transactions || 0,
        });
      } catch (error) {
        console.log("Error fetching stats:", error.response?.data || error.message);
        Alert.alert("Error", "Failed to load dashboard stats");
      }
    };

    useEffect(() => {
      fetchStats();
    }, []);

    useFocusEffect(
      React.useCallback(() => {
        fetchStats();
      }, [])
    );

    const tiles = [
      { label: "Users", count: stats.users, screen: "UserList" },   // ✅ navigate to UserList
      { label: "Photographers", count: stats.photographers },
      { label: "Guiders", count: stats.guiders },
      { label: "Places", count: stats.places },
      { label: "Withdrawals", count: stats.withdrawals },
      { label: "Transactions", count: stats.transactions },
      { label: "Settings", count: null },
      { label: "Notifications", count: null },
    ];

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Admin Dashboard</Text>

        <View style={styles.grid}>
          {tiles.map((tile, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => {
                if (tile.screen) {
                  navigation.navigate(tile.screen);   // ✅ navigate to screen
                } else {
                  Alert.alert(tile.label);
                }
              }}
            >
              <Text style={styles.cardLabel}>{tile.label}</Text>
              {tile.count !== null && (
                <Text style={styles.cardCount}>{tile.count}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#E3F2FD", padding: 20 },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
      color: "#1976D2",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    card: {
      backgroundColor: "#BBDEFB",
      width: "47%",
      padding: 20,
      borderRadius: 12,
      marginBottom: 15,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: "#0D47A1",
      marginBottom: 8,
    },
    cardCount: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#1A237E",
    },
    logoutButton: {
      marginTop: 30,
      backgroundColor: "#f44336",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    logoutText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
  });
