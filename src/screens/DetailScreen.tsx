import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

export function DetailScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Detail</Text>
      <Text style={styles.body}>
        Placeholder for item id: {route.params.itemId}
      </Text>
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


