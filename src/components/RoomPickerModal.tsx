import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { Room } from "../models/Room";
import { colors, spacing, typography } from "../theme";

type Props = {
  visible: boolean;
  rooms: Room[];
  selectedRoomId?: string | null;
  onSelect: (roomId: string | null) => void;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRequestClose: () => void;
  allowManage?: boolean;
};

export function RoomPickerModal({
  visible,
  rooms,
  selectedRoomId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onRequestClose,
  allowManage = true,
}: Props) {
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setNewName("");
      setRenamingId(null);
      setRenameValue("");
      setBusy(false);
    }
  }, [visible]);

  const sortedRooms = useMemo(
    () => rooms.slice().sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)),
    [rooms],
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await onCreate(newName.trim());
      setNewName("");
    } catch (err) {
      Alert.alert("Room name exists", "Choose a different room name.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (roomId: string, roomName: string) => {
    Alert.alert("Delete room?", `Room "${roomName}" will be removed. Items will be unassigned.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await onDelete(roomId);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Room }) => {
    const isSelected = selectedRoomId === item.id;
    const isRenaming = renamingId === item.id;
    return (
      <View style={styles.roomRow}>
        <Pressable
          style={styles.roomPressable}
          onPress={() => {
            onSelect(isSelected ? null : item.id);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Room ${item.name}`}
        >
          {allowManage && isRenaming ? (
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={styles.roomInput}
              autoFocus
              placeholder="Room name"
            />
          ) : (
            <Text style={styles.roomName}>{item.name}</Text>
          )}
        </Pressable>
        {allowManage && isRenaming ? (
          <View style={styles.rowActions}>
            <TouchableOpacity
              onPress={async () => {
                if (!renameValue.trim()) return;
                setBusy(true);
                try {
                  await onRename(item.id, renameValue.trim());
                  setRenamingId(null);
                  setRenameValue("");
                } catch (err) {
                  Alert.alert("Room name exists", "Choose a different room name.");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setRenamingId(null);
                setRenameValue("");
              }}
            >
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : allowManage ? (
          <View style={styles.rowActions}>
            <TouchableOpacity
              onPress={() => {
                setRenamingId(item.id);
                setRenameValue(item.name);
              }}
            >
              <Text style={styles.actionText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                confirmDelete(item.id, item.name);
              }}
            >
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onRequestClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Choose room</Text>
            <TouchableOpacity
              onPress={onRequestClose}
              accessibilityRole="button"
              accessibilityLabel="Close room picker"
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={sortedRooms}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListFooterComponent={
              allowManage ? (
                <View style={styles.addRow}>
                  <TextInput
                    placeholder="Add new room"
                    value={newName}
                    onChangeText={setNewName}
                    style={styles.addInput}
                  />
                  <TouchableOpacity
                    onPress={handleCreate}
                    disabled={busy || !newName.trim()}
                    style={styles.addButton}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm + 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  closeText: { color: colors.primary, fontWeight: "600" },
  roomRow: {
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 6,
  },
  roomPressable: { flexDirection: "row", alignItems: "center", gap: 8 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#888",
  },
  radioSelected: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  roomName: typography.label,
  roomInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  rowActions: { flexDirection: "row", gap: 12, paddingLeft: 26 },
  actionText: { color: colors.primary, fontWeight: "600" },
  deleteText: { color: colors.badgeDeleteBg },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
  },
  addButtonText: { color: "white", fontWeight: "700" },
});
