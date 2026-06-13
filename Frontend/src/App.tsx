import React, { useEffect, useCallback } from "react";
import { StatusBar, LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "@/navigation/AppNavigator";
import syncManager from "@/services/sync/SyncManager";
import connectivityService from "@/services/connectivity/ConnectivityService";
import { wsService } from "@/services/websocket";
import { useEmergencyStore } from "@/store/emergencyStore";
import { colors } from "@/config/theme";

LogBox.ignoreLogs(["Reanimated 2", "[Reanimated]"]);

const App: React.FC = () => {
  const handleNewRequest = useEmergencyStore((s) => s.handleNewRequest);
  const handleRequestUpdate = useEmergencyStore((s) => s.handleRequestUpdate);

  useEffect(() => {
    syncManager.startAutoSync();

    const unsubConnectivity = connectivityService.subscribe((status) => {
      syncManager.onConnectivityChange(status);
    });

    const unsubWs = wsService.onMessage((msg) => {
      switch (msg.type) {
        case "new_request":
          if (msg.data) handleNewRequest(msg.data);
          break;
        case "request_update":
          if (msg.request_id && msg.status) handleRequestUpdate(msg.request_id, msg.status);
          break;
      }
    });

    return () => {
      syncManager.stopAutoSync();
      unsubConnectivity();
      unsubWs();
      wsService.disconnect();
    };
  }, [handleNewRequest, handleRequestUpdate]);

  const linking = {
    prefixes: ["emergencyconnect://", "https://emergencyconnect.dev"],
    config: {
      screens: {
        EmergencyDetail: "emergency/:emergencyId",
        MainTabs: {
          screens: {
            Dashboard: "home",
            Emergencies: "alerts",
            Notifications: "notifications",
            Map: "map",
            Profile: "profile",
          },
        },
      } as any,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.white}
        translucent={false}
      />
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
