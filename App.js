import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { LocationProvider } from "./src/context/LocationContext";
import { LikesProvider } from "./src/context/LikesContext"; // ✅ Import LikesProvider
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LocationProvider>
          <LikesProvider>   {/* ✅ Wrap with LikesProvider */}
            <AppNavigator />
          </LikesProvider>
        </LocationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}