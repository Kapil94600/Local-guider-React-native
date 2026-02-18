import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import GuiderHome from "../../screens/Guider/GuiderHome";

const Stack = createStackNavigator();

export default function GuiderNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GuiderHome" component={GuiderHome} />
    </Stack.Navigator>
  );
}
