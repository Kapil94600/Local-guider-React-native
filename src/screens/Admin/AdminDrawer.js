import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import AdminStack from "../../navigation/AdminStack";

const Drawer = createDrawerNavigator();

export default function AdminDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: "#3F51B5",
        drawerInactiveTintColor: "#374151",
        drawerStyle: {
          backgroundColor: "#F5F7FB",
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 14,
          marginLeft: -5,
        },
      }}
    >
      {/* 🏠 Dashboard Stack */}
      <Drawer.Screen
        name="Dashboard"
        component={AdminStack}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="view-dashboard" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
