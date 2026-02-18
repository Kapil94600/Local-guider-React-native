import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import UserHome from "../../screens/User/UserHome";
import GuiderRequestScreen from "../../screens/User/GuiderRequestScreen";
import PhotographerRequestScreen from "../../screens/User/PhotographerRequestScreen";

const Stack = createStackNavigator();

export default function UserNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UserHome" 
        component={UserHome} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GuiderRequestScreen" 
        component={GuiderRequestScreen} 
        options={{ 
          title: "Become a Guider",
          headerStyle: { backgroundColor: "#42738f" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen 
        name="PhotographerRequestScreen" 
        component={PhotographerRequestScreen} 
        options={{ 
          title: "Become a Photographer",
          headerStyle: { backgroundColor: "#42738f" },
          headerTintColor: "#fff",
        }}
      />
    </Stack.Navigator>
  );
}