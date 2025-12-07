import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  useEffect(() => {
    if (__DEV__) {
      import("./src/debug/findItLaterDebug").then(({ attachFindItLaterDebug }) => {
        attachFindItLaterDebug();
      });
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
