import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { RoomPickerModal } from "../components/RoomPickerModal";
import type { Item } from "../models/Item";
import type { Room } from "../models/Room";
import type { RootStackParamList } from "../navigation/types";
import { deleteItem, listItems, searchItems } from "../storage/items";
import { createRoom, deleteRoom, listRooms, renameRoom } from "../storage/rooms";
import { colors, spacing, typography } from "../theme";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [roomPickerVisible, setRoomPickerVisible] = useState(false);
  const [manageRoomsVisible, setManageRoomsVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRooms = useCallback(async () => {
    try {
      const data = await listRooms();
      setRooms(data);
      if (roomFilter && !data.find((r) => r.id === roomFilter)) {
        setRoomFilter(null);
      }
    } catch (err) {
      console.error(err);
    }
  }, [roomFilter]);

  const loadItems = useCallback(
    async (term = "", opts?: { showSpinner?: boolean }) => {
      if (opts?.showSpinner !== false) {
        setLoading(true);
      }
      try {
        setError(null);
        const rows = term.trim()
          ? await searchItems(term.trim(), 100, roomFilter ?? undefined)
          : await listItems(100, roomFilter ?? undefined);
        setItems(rows);
      } catch (err) {
        console.error(err);
        setError("Could not load items.");
        Alert.alert("Load failed", "Could not load items. Pull to retry.");
      } finally {
        if (opts?.showSpinner !== false) {
          setLoading(false);
        }
      }
    },
    [roomFilter],
  );

  useFocusEffect(
    useCallback(() => {
      loadRooms();
      loadItems(searchTerm, { showSpinner: true }).catch(() => {});
    }, [loadItems, loadRooms, searchTerm]),
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadItems(searchTerm, { showSpinner: false }).catch(() => {});
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadItems, searchTerm]);

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
            accessibilityRole="button"
            accessibilityLabel={`Item ${item.label || "No label"}, saved ${formatTimestamp(item.createdAt)}`}
          >
            <Image source={{ uri: item.photoUri }} style={styles.thumbnail} />
            <View style={styles.cardBody}>
              <Text style={styles.label}>{item.label || "No label"}</Text>
              <Text style={styles.meta}>{formatTimestamp(item.createdAt)}</Text>
              {item.location ? <Text style={styles.badge}>Location</Text> : null}
              {item.roomName ? <Text style={styles.badgeRoom}>{item.roomName}</Text> : null}
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
        <Text style={styles.emptyTitle}>No items in this room</Text>
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
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search label or note"
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
          accessibilityLabel="Search items"
          returnKeyType="search"
        />
        {searchTerm ? (
          <TouchableOpacity
            onPress={() => {
              setSearchTerm("");
            }}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity
        style={styles.filterRow}
        onPress={() => {
          setRoomPickerVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Filter by room"
      >
        <Text style={styles.filterLabel}>Room filter</Text>
        <Text style={styles.filterValue}>
          {roomFilter ? (rooms.find((r) => r.id === roomFilter)?.name ?? "Room") : "All rooms"}
        </Text>
      </TouchableOpacity>

      {rooms.length === 0 ? (
        <TouchableOpacity
          style={styles.noRooms}
          onPress={() => {
            setManageRoomsVisible(true);
          }}
        >
          <Text style={styles.noRoomsText}>No rooms yet. Edit them now?</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.noRooms}
          onPress={() => {
            setManageRoomsVisible(true);
          }}
        >
          <Text style={styles.noRoomsText}>Edit rooms</Text>
        </TouchableOpacity>
      )}

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
                await loadRooms();
                await loadItems(searchTerm);
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <RoomPickerModal
        visible={roomPickerVisible}
        rooms={[{ id: "all", name: "All rooms", sort: -1 }, ...rooms]}
        selectedRoomId={roomFilter ?? "all"}
        onSelect={(id) => {
          if (id === "all") {
            setRoomFilter(null);
          } else {
            setRoomFilter(id);
          }
          setRoomPickerVisible(false);
          loadItems(searchTerm, { showSpinner: true }).catch(() => {});
        }}
        onCreate={async () => {}}
        onRename={async () => {}}
        onDelete={async () => {}}
        onRequestClose={() => {
          setRoomPickerVisible(false);
        }}
        allowManage={false}
      />
      <RoomPickerModal
        visible={manageRoomsVisible}
        rooms={rooms}
        selectedRoomId={roomFilter}
        onSelect={(id) => {
          setRoomFilter(id);
          setManageRoomsVisible(false);
          loadItems(searchTerm, { showSpinner: true }).catch(() => {});
        }}
        onCreate={async (name) => {
          await createRoom(name);
          await loadRooms();
          await loadItems(searchTerm, { showSpinner: true });
        }}
        onRename={async (id, name) => {
          await renameRoom(id, name);
          await loadRooms();
          await loadItems(searchTerm, { showSpinner: true });
        }}
        onDelete={async (id) => {
          await deleteRoom(id);
          await loadRooms();
          if (roomFilter === id) setRoomFilter(null);
          await loadItems(searchTerm, { showSpinner: true });
        }}
        onRequestClose={() => {
          setManageRoomsVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16 },
  clearButton: { padding: 6 },
  clearButtonText: { fontSize: 20, color: "#666" },
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
  meta: typography.body,
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.badgeLocationBg,
    color: colors.badgeLocationText,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    fontSize: 12,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    backgroundColor: colors.badgeDeleteBg,
    marginVertical: 6,
    borderRadius: 12,
  },
  deleteText: { color: "white", fontWeight: "700" },
  emptyContainer: { flexGrow: 1, justifyContent: "center", padding: 24 },
  emptyState: { alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyBody: { fontSize: 16, color: "#555", textAlign: "center" },
  primaryButton: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
  },
  fabText: { fontSize: 28, color: "white", marginTop: -2 },
  error: {
    position: "absolute",
    bottom: 8,
    left: 12,
    right: 12,
    textAlign: "center",
    color: colors.error,
  },
  badgeRoom: {
    alignSelf: "flex-start",
    backgroundColor: colors.badgeRoomBg,
    color: colors.badgeRoomText,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    fontSize: 12,
  },
  filterList: { maxHeight: 50 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "white",
  },
  filterChipSelected: {
    backgroundColor: "#1a73e8",
    borderColor: "#1a73e8",
  },
  filterChipText: { color: "#333", fontWeight: "600" },
  filterChipTextSelected: { color: "white" },
  filterRow: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterLabel: { fontSize: 14, color: "#555" },
  filterValue: { fontSize: 16, fontWeight: "600" },
  noRooms: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "#fff9c4",
  },
  noRoomsText: { color: "#6d4c41", fontWeight: "600", textAlign: "center" },
});
