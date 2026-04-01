import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { LocationProvider } from "./src/context/LocationContext";
import { LikesProvider } from "./src/context/LikesContext";
import AppNavigator from "./src/navigation/AppNavigator";

import { enableScreens, enableFreeze } from 'react-native-screens';

// 🔥 IMPORTANT: ye component ke bahar hona chahiye
enableScreens(true);
enableFreeze(true);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LocationProvider>
          <LikesProvider>
            <AppNavigator />
          </LikesProvider>
        </LocationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}