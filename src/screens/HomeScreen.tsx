import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import type { Item } from "../models/Item";
import type { RootStackParamList } from "../navigation/types";
import { deleteItem, listItems } from "../storage/items";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

function formatTimestamp(epochMs: number): string {
  const date = new Date(epochMs);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HomeScreen({ navigation }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listItems();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete item?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteItem(id);
            await loadItems();
          },
        },
      ]);
    },
    [loadItems],
  );

  const renderRightActions = useCallback(
    (itemId: string) => (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          handleDelete(itemId);
        }}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    ),
    [handleDelete],
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      return (
        <Swipeable renderRightActions={() => renderRightActions(item.id)}>
          <Pressable
            onPress={() => {
              navigation.navigate("Detail", { itemId: item.id });
            }}
            style={styles.card}
          >
            <Image source={{ uri: item.photoUri }} style={styles.thumbnail} />
            <View style={styles.cardBody}>
              <Text style={styles.label}>{item.label || "No label"}</Text>
              <Text style={styles.meta}>{formatTimestamp(item.createdAt)}</Text>
              {item.location ? <Text style={styles.badge}>Location</Text> : null}
            </View>
          </Pressable>
        </Swipeable>
      );
    },
    [navigation, renderRightActions],
  );

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No items yet</Text>
        <Text style={styles.emptyBody}>Save your first item to see it here.</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            navigation.navigate("Capture");
          }}
        >
          <Text style={styles.primaryButtonText}>Add item</Text>
        </TouchableOpacity>
      </View>
    ),
    [navigation],
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadItems();
                setRefreshing(false);
              }}
            />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          navigation.navigate("Capture");
        }}
        accessibilityRole="button"
        accessibilityLabel="Add item"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingVertical: 8 },
  card: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "white",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: { width: 72, height: 72, borderRadius: 8, backgroundColor: "#ddd" },
  cardBody: { flex: 1, gap: 4 },
  label: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 14, color: "#555" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e7f0ff",
    color: "#1a73e8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    backgroundColor: "#e53935",
    marginVertical: 6,
    borderRadius: 12,
  },
  deleteText: { color: "white", fontWeight: "700" },
  emptyContainer: { flexGrow: 1, justifyContent: "center", padding: 24 },
  emptyState: { alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyBody: { fontSize: 16, color: "#555", textAlign: "center" },
  primaryButton: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: { color: "white", fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1a73e8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
  },
  fabText: { fontSize: 28, color: "white", marginTop: -2 },
});
