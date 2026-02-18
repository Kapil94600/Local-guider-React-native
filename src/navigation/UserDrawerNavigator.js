import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";

import UserDashboard from "../screens/UserDashboard";
import CustomDrawer from "./CustomDrawer";

const Drawer = createDrawerNavigator();

export default function UserDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawer {...props} />}
    >
      <Drawer.Screen name="UserDashboard" component={UserDashboard} />
    </Drawer.Navigator>
  );
}
