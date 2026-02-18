import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext } from "../context/AuthContext";
import { IS_ADMIN_APP } from "../appMode";

/* 🔐 AUTH */
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

/* 👤 USER */
import UserDashboard from "../screens/UserDashboard";
import UserMenuScreen from "../screens/UserMenuScreen";
import UserProfileScreen from "../screens/User/UserProfileScreen";
import UserEditProfileScreen from "../screens/User/userEditProfileScreen";
import ProfileUpdateScreen from "../screens/User/ProfileUpdateScreen";
import ProfilePictureScreen from "../screens/User/ProfilePictureScreen";
import AddBalanceScreen from "../screens/User/AddBalanceScreen";
import ContactUsScreen from "../screens/User/ContactUsScreen";
import GuiderListScreen from "../screens/User/GuiderListScreen.js";
import PlaceListScreen from "../screens/User/PlaceListScreen.js";
import TopPlacesScreen from "../screens/User/TopPlacesScreen.js";
import TopGuidersScreen from "../screens/User/TopGuidersScreen.js";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";

import TransactionHistory from "../screens/User/TransactionHistory";
import MyBookings from "../screens/User/MyBookings";
import AboutUs from "../screens/User/AboutUs";
import TermsConditions from "../screens/User/TermsConditions";
import HelpSupport from "../screens/User/HelpSupport";
import FindTourGuides from "../screens/User/FindTourGuides";
import FindPhotographers from "../screens/User/FindPhotographers";
import ExplorePlaces from "../screens/User/ExplorePlaces";


// For admin

/* 📍 LOCATION */
import LocationPicker from "../screens/User/LocationPicker";
import LocationSearchScreen from "../screens/User/LocationSearchScreen";
import MapSelectScreen from "../screens/User/MapSelectScreen";

/* 📸 PHOTOGRAPHERS */
import PhotographersListScreen from "../screens/User/PhotographersListScreen";

/* 🎭 ROLES - ADD THESE SCREENS */
import RoleRequestScreen from "../screens/RoleRequestScreen";
import GuiderRequestScreen from "../screens/User/GuiderRequestScreen";
import PhotographerRequest from "../screens/User/PhotographerRequest";  // ✅ ADD THIS
// import PhotographerRequestScreen from "../screens/User/PhotographerRequestScreen"; // ✅ ADD THIS
import GuiderDashboard from "../screens/GuiderDashboard";
import PhotographerDashboard from "../screens/PhotographerDashboard";

/* 👑 ADMIN */
import AdminStack from "./AdminStack";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 🔐 AUTH FLOW */}
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            {!IS_ADMIN_APP && (
              <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            )}
          </>
        ) : IS_ADMIN_APP ? (
          // 👑 Admin APK → always AdminStack
          <Stack.Screen name="Admin" component={AdminStack} />
        ) : user.role === "ADMIN" ? (
          // 👑 User APK but role = ADMIN
          <Stack.Screen name="Admin" component={AdminStack} />
        ) : user.role === "GUIDER" ? (
          // 🧭 Guider role
          <Stack.Screen name="GuiderDashboard" component={GuiderDashboard} />
        ) : user.role === "PHOTOGRAPHER" ? (
          // 📸 Photographer role
          <Stack.Screen
            name="PhotographerDashboard"
            component={PhotographerDashboard}
          />
        ) : (
          // 👤 Normal User (can send role request)
          <>
            <Stack.Screen name="UserDashboard" component={UserDashboard} />

            {/* 👤 PROFILE */}
            <Stack.Screen name="UserMenu" component={UserMenuScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen
              name="UserEditProfile"
              component={UserEditProfileScreen}
            />
            <Stack.Screen
              name="ProfileUpdate"
              component={ProfileUpdateScreen}
            />
            <Stack.Screen
              name="ProfilePicture"
              component={ProfilePictureScreen}
            />
            <Stack.Screen
              name="GuiderListScreen"
              component={GuiderListScreen}
            />
            <Stack.Screen
              name="PhotographersListScreen"
              component={PhotographersListScreen}
            />
            <Stack.Screen
              name="PlaceListScreen"
              component={PlaceListScreen}
            />
             <Stack.Screen
              name="TopPlacesScreen"
              component={TopPlacesScreen}
            />
              <Stack.Screen
              name="TopGuidersScreen"
              component={TopGuidersScreen}
            />
            {/* 💰 WALLET */}
            <Stack.Screen name="AddBalance" component={AddBalanceScreen} />

            {/* 🎭 ROLE REQUEST - ADD THESE SCREENS */}
            <Stack.Screen name="RoleRequest" component={RoleRequestScreen} />
            <Stack.Screen
              name="GuiderRequestScreen"
              component={GuiderRequestScreen}
              options={{ title: "Become a Guider", headerShown: false }} // ✅ ADD THIS
            />
            <Stack.Screen
              name="PhotographerRequest"
              component={PhotographerRequest}
              options={{ title: "Become a Guider", headerShown: false }} // ✅ ADD THIS
            />
            {/* <Stack.Screen 
              name="PhotographerRequestScreen" 
              component={PhotographerRequestScreen} 
              options={{ title: "Become a Photographer", headerShown: true }} // ✅ ADD THIS
            /> */}

            {/* ☎️ CONTACT */}
            <Stack.Screen name="ContactUs" component={ContactUsScreen} />

            {/* 📍 LOCATION FLOW */}
            <Stack.Screen name="LocationPicker" component={LocationPicker} />
            <Stack.Screen
              name="LocationSearch"
              component={LocationSearchScreen}
            />
            <Stack.Screen name="MapSelect" component={MapSelectScreen} />
<Stack.Screen name="Notifications" component={NotificationsScreen} />
<Stack.Screen 
  name="MyBookings" 
  component={MyBookings} 
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="TransactionHistory" 
  component={TransactionHistory} 
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="AboutUs" 
  component={AboutUs} 
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="TermsConditions" 
  component={TermsConditions} 
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="HelpSupport" 
  component={HelpSupport} 
  options={{ headerShown: false }}
/>

<Stack.Screen 
  name="FindTourGuides" 
  component={FindTourGuides} 
  options={{ headerShown: false }}
/>

<Stack.Screen 
  name="FindPhotographers" 
  component={FindPhotographers} 
  options={{ headerShown: false }}
/>

<Stack.Screen 
  name="ExplorePlaces" 
  component={ExplorePlaces} 
  options={{ headerShown: false }}
/>


            {/* 📸 PHOTOGRAPHERS LIST */}
            {/* <Stack.Screen
              name="PhotographersList"
              component={PhotographersListScreen}
            /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}