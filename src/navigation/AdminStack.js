  import React from "react";
  import { createStackNavigator } from "@react-navigation/stack";

  // ✅ CORRECT PATHS
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

  import AdminSettings from "../screens/Admin/AdminSettings";
  import WithdrawalList from "../screens/Admin/WithdrawalList";
  import AppointmentList from "../screens/Admin/AppointmentList";

  const Stack = createStackNavigator();

  export default function AdminStack() {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
        />

        <Stack.Screen
          name="UserList"
          component={UserListScreen}
          options={{
            headerShown: false,
            title: "Users",
          }}
        />

        <Stack.Screen
          name="GuiderList"
          component={GuiderList}
          options={{
            headerShown: false,
            title: "Guiders",
          }}
        />

        <Stack.Screen
          name="GuiderRequests"
          component={GuiderRequests}
          options={{
            headerShown: false,
            title: "Guider Requests",
          }}
        />

        <Stack.Screen
          name="PhotographerList"
          component={PhotographerList}
          options={{
            headerShown: false,
            title: "Photographers",
          }}
        />

        <Stack.Screen
          name="PhotographerRequests"
          component={PhotographerRequests}
          options={{
            headerShown: false,
            title: "Photographer Requests",
          }}
        />

        <Stack.Screen 
          name="PlaceList" 
          component={PlaceList} 
          options={{
            headerShown: false,
            title: "Places",
          }}
        />
        
        <Stack.Screen 
          name="PlaceGallery" 
          component={PlaceGallery} 
        />
        
        <Stack.Screen
          name="TransactionList"
          component={TransactionListScreen}
          options={{
            headerShown: true,
            title: "Transactions",
          }}
        />
        
        <Stack.Screen 
          name="NotificationList" 
          component={NotificationList} 
          options={{
            headerShown: false,
            title: "Notifications",
          }}
        />
        
       
        
        <Stack.Screen
          name="AdminSettings"
          component={AdminSettings}
          options={{ 
            headerShown: true,
            title: "Settings" 
          }}
        />
        
        <Stack.Screen
          name="WithdrawalList"
          component={WithdrawalList}
          options={{ 
            headerShown: true,
            title: "Withdrawals" 
          }}
        />
        
        <Stack.Screen
          name="AppointmentList"
          component={AppointmentList}
          options={{ 
            headerShown: true,
            title: "Appointments" 
          }}
        />

      </Stack.Navigator>
    );
  }