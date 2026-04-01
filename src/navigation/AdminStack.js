import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // ✅ UPDATED

import AdminDashboard from "../screens/AdminDashboard";
import UserListScreen from "../screens/Admin/UserListScreen";
import TransactionListScreen from "../screens/Admin/TransactionListScreen";
import GuiderList from "../screens/Admin/GuiderList";
import GuiderRequests from "../screens/Admin/GuiderRequests";
import PhotographerRequests from "../screens/Admin/PhotographerRequests";
import PhotographerList from "../screens/Admin/PhotographerList";
import PlaceList from "../screens/Admin/PlaceList";
import PlaceGallery from "../screens/Admin/PlaceGallery";
import NotificationList from "../screens/Admin/NotificationList";
import AddPlaceScreen from "../screens/Admin/AddPlaceScreen";
import AdminSettings from "../screens/Admin/AdminSettings";
import WithdrawalList from "../screens/Admin/WithdrawalList";
import AppointmentList from "../screens/Admin/AppointmentList";

const Stack = createNativeStackNavigator(); // ✅ UPDATED

export default function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 200,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="UserList" component={UserListScreen} />
      <Stack.Screen name="GuiderList" component={GuiderList} />
      <Stack.Screen name="GuiderRequests" component={GuiderRequests} />
      <Stack.Screen name="PhotographerList" component={PhotographerList} />
      <Stack.Screen name="PhotographerRequests" component={PhotographerRequests} />
      <Stack.Screen name="AddPlaceScreen" component={AddPlaceScreen} />
      <Stack.Screen name="PlaceList" component={PlaceList} />
      <Stack.Screen name="PlaceGallery" component={PlaceGallery} />
      <Stack.Screen name="TransactionList" component={TransactionListScreen} />
      <Stack.Screen name="NotificationList" component={NotificationList} />

      <Stack.Screen name="AdminSettings" component={AdminSettings} options={{ headerShown: true }} />
      <Stack.Screen name="WithdrawalList" component={WithdrawalList} options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentList" component={AppointmentList} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}