import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./types";
import { CaptureScreen } from "../screens/CaptureScreen";
import { DetailScreen } from "../screens/DetailScreen";
import { HomeScreen } from "../screens/HomeScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Find it later" }} />
        <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: "Add item" }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: "Item details" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
