import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // ✅ UPDATED
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
import PlaceDetailsScreen from "../screens/User/PlaceDetailsScreen.js";
import ProfessionalDetailsScreen from '../screens/User/ProfessionalDetailsScreen';
import TransactionHistory from "../screens/User/TransactionHistory";
import MyBookings from "../screens/User/MyBookings";
import AboutUs from "../screens/User/AboutUs";
import TermsConditions from "../screens/User/TermsConditions";
import PrivacyPolicy from "../screens/User/PrivacyPolicy";
import HelpSupport from "../screens/User/HelpSupport";

import ExplorePlaces from "../screens/User/ExplorePlaces";
import LikedScreen from "../screens/User/LikedScreen";
import ReviewScreen from '../screens/User/ReviewScreen';

/* 📍 LOCATION */
import LocationPicker from "../screens/User/LocationPicker";
import LocationSearchScreen from "../screens/User/LocationSearchScreen";
import MapSelectScreen from "../screens/User/MapSelectScreen";

/* 📸 PHOTOGRAPHERS */
import PhotographersListScreen from "../screens/User/PhotographersListScreen";

/* 🎭 ROLES */
import RoleRequestScreen from "../screens/RoleRequestScreen";
import GuiderRequestScreen from "../screens/User/GuiderRequestScreen";
import PhotographerRequest from "../screens/User/PhotographerRequest";
import GuiderDashboard from "../screens/GuiderDashboard";
import GuiderNotifications from "../screens/GuiderNotifications";
import PhotographerDashboard from "../screens/PhotographerDashboard";

/* 👑 ADMIN */
import AdminStack from "./AdminStack";

const Stack = createNativeStackNavigator(); // ✅ UPDATED

export default function AppNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",        // ✅ smooth transition
          animationDuration: 200,   // ✅ fast open
          gestureEnabled: false,    // ✅ reduce lag
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            {!IS_ADMIN_APP && (
              <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            )}
          </>
        ) : IS_ADMIN_APP ? (
          <Stack.Screen name="Admin" component={AdminStack} />
        ) : user.role === "ADMIN" ? (
          <Stack.Screen name="Admin" component={AdminStack} />
        ) :user.role === "GUIDER" ? (
  <>
    <Stack.Screen name="GuiderDashboard" component={GuiderDashboard} />
    <Stack.Screen name="GuiderNotifications" component={GuiderNotifications} />
  </>
) : user.role === "PHOTOGRAPHER" ? (
          <Stack.Screen name="PhotographerDashboard" component={PhotographerDashboard} />
        ) : (
          <>
            <Stack.Screen name="UserDashboard" component={UserDashboard} />
            <Stack.Screen name="ProfessionalDetails" component={ProfessionalDetailsScreen} />
            <Stack.Screen name="ReviewScreen" component={ReviewScreen} />

            <Stack.Screen name="UserMenu" component={UserMenuScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="UserEditProfile" component={UserEditProfileScreen} />
            <Stack.Screen name="ProfileUpdate" component={ProfileUpdateScreen} />
            <Stack.Screen name="ProfilePicture" component={ProfilePictureScreen} />

            <Stack.Screen name="GuiderListScreen" component={GuiderListScreen} />
            <Stack.Screen name="PhotographersListScreen" component={PhotographersListScreen} />

            <Stack.Screen name="Liked" component={LikedScreen} />
            <Stack.Screen name="LikedScreen" component={LikedScreen} />

            <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
            <Stack.Screen name="PlaceListScreen" component={PlaceListScreen} />
            <Stack.Screen name="TopPlacesScreen" component={TopPlacesScreen} />
            <Stack.Screen name="TopGuidersScreen" component={TopGuidersScreen} />

            <Stack.Screen name="AddBalance" component={AddBalanceScreen} />

            <Stack.Screen name="RoleRequest" component={RoleRequestScreen} />
            <Stack.Screen name="GuiderRequestScreen" component={GuiderRequestScreen} />
            <Stack.Screen name="PhotographerRequest" component={PhotographerRequest} />

            <Stack.Screen name="ContactUs" component={ContactUsScreen} />

            <Stack.Screen name="LocationPicker" component={LocationPicker} />
            <Stack.Screen name="LocationSearch" component={LocationSearchScreen} />
            <Stack.Screen name="MapSelect" component={MapSelectScreen} />

            <Stack.Screen name="Notifications" component={NotificationsScreen} />

            <Stack.Screen name="MyBookings" component={MyBookings} />
            <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
            <Stack.Screen name="AboutUs" component={AboutUs} />
            <Stack.Screen name="TermsConditions" component={TermsConditions} />
             <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            <Stack.Screen name="HelpSupport" component={HelpSupport} />

            <Stack.Screen name="ExplorePlaces" component={ExplorePlaces} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}