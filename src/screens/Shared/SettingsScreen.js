import React, { useContext, useState } from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../../src/context/AuthContext";

export default function SettingsScreen() {
  const { logout } = useContext(AuthContext);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Dark Mode */}
      <View style={styles.row}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>

      {/* Language */}
      <View style={styles.row}>
        <Text style={styles.label}>Language</Text>
        <TouchableOpacity onPress={() => setLanguage(language === "English" ? "Hindi" : "English")}>
          <Text style={styles.value}>{language}</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: "600", color: "#1976D2" },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
