import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home / List</Text>
      <Text style={styles.body}>Placeholder. Phase 2 will show saved items here.</Text>
      <Button
        title="Add item"
        onPress={() => {
          navigation.navigate("Capture");
        }}
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
