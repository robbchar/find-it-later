import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

export function CaptureScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capture</Text>
      <Text style={styles.body}>
        Placeholder. Phase 1 will implement camera + save flow here.
      </Text>
      <Button
        title="Go back"
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back to home"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "600" },
  body: { fontSize: 16, color: "#444" },
});


