import { HeaderBackButton } from "@react-navigation/elements";
import { usePreventRemove, StackActions, CommonActions } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { RoomPickerModal } from "../components/RoomPickerModal";
import type { Item } from "../models/Item";
import type { Room } from "../models/Room";
import type { RootStackParamList } from "../navigation/types";
import { deleteItem, getItem, updateItem } from "../storage/items";
import { createRoom, deleteRoom, listRooms, renameRoom } from "../storage/rooms";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

function formatTimestamp(epochMs: number): string {
  return new Date(epochMs).toLocaleString();
}

function formatAccuracy(accuracy?: number): string | null {
  if (accuracy == null) return null;
  return `Accuracy ~${Math.round(accuracy)}m`;
}

function buildStaticMapUrl(lat: number, lon: number, apiKey?: string): string | null {
  if (!apiKey) return null;
  const marker = `color:red|${lat},${lon}`;
  const params = [
    `center=${lat},${lon}`,
    "zoom=18",
    "size=640x360",
    "maptype=roadmap",
    `markers=${encodeURIComponent(marker)}`,
    `key=${apiKey}`,
  ];
  return `https://maps.googleapis.com/maps/api/staticmap?${params.join("&")}`;
}

function openInMaps(lat: number, lon: number) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  Linking.openURL(url).catch(() => {});
}

export function DetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomPickerVisible, setRoomPickerVisible] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const originalLabel = useRef("");
  const originalNote = useRef("");
  const ignoreUnsaved = useRef(false);
  const blockedAction = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingError(null);
        const record = await getItem(itemId);
        setItem(record);
        setLabel(record?.label ?? "");
        setNote(record?.note ?? "");
        originalLabel.current = record?.label?.trim() ?? "";
        originalNote.current = record?.note?.trim() ?? "";
        const roomId = record?.roomId ?? null;
        setSelectedRoomId(roomId);
        const allRooms = await listRooms();
        setRooms(allRooms);
      } catch (err) {
        console.error(err);
        setLoadingError("Could not load item");
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => {});
  }, [itemId]);

  const hasUnsavedChanges =
    label.trim() !== originalLabel.current ||
    (note.trim() || "") !== (originalNote.current || "") ||
    selectedRoomId !== (item?.roomId ?? null);

  const confirmDiscard = useCallback((onDiscard: () => void) => {
    Alert.alert("Discard changes?", "You have unsaved edits.", [
      {
        text: "Stay",
        style: "cancel",
        onPress: () => {
          blockedAction.current = null;
        },
      },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          ignoreUnsaved.current = true;
          onDiscard();
        },
      },
    ]);
  }, []);

  const handleBackPress = useCallback(() => {
    if (!hasUnsavedChanges) {
      navigation.goBack();
      return;
    }
    navigation.dispatch(CommonActions.goBack());
  }, [confirmDiscard, hasUnsavedChanges, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: (props) => (
        <HeaderBackButton {...props} onPress={handleBackPress} tintColor={props.tintColor} />
      ),
    });
  }, [navigation, handleBackPress]);

  usePreventRemove(hasUnsavedChanges, (event) => {
    if (!hasUnsavedChanges || ignoreUnsaved.current) {
      return;
    }

    const preventDefault = (event as { preventDefault?: () => void }).preventDefault;
    preventDefault?.();
    blockedAction.current = (event as { data?: { action?: any } }).data?.action ?? null;
    confirmDiscard(() => {
      ignoreUnsaved.current = true;
      const action = blockedAction.current;
      blockedAction.current = null;
      if (action) {
        navigation.dispatch(action);
      } else {
        navigation.dispatch(StackActions.pop(1));
      }
    });
  });

  const staticMapKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY;
  const staticMapUrl = useMemo(
    () =>
      item?.location ? buildStaticMapUrl(item.location.lat, item.location.lon, staticMapKey) : null,
    [item?.location, staticMapKey],
  );

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    try {
      await updateItem({
        id: item.id,
        label: label.trim(),
        note: note.trim() || undefined,
        roomId: selectedRoomId ?? undefined,
      });
      const refreshed = await getItem(item.id);
      setItem(refreshed);
      originalLabel.current = label.trim();
      originalNote.current = note.trim();
      setSelectedRoomId(refreshed?.roomId ?? null);
      Alert.alert("Saved", "Item updated.");
      navigation.navigate("Home");
    } catch (error) {
      console.error(error);
      Alert.alert("Save failed", "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete item?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          ignoreUnsaved.current = true;
          await deleteItem(itemId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>{loadingError ?? "Item not found"}</Text>
        <Button
          title="Go back"
          onPress={() => {
            navigation.goBack();
          }}
        />
      </View>
    );
  }

  const accuracyText = formatAccuracy(item.location?.accuracy);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: item.photoUri }} style={styles.photo} />

      <View style={styles.section}>
        <Text style={styles.label}>Label</Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Add a label"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Note</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note"
          style={[styles.input, styles.multiline]}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Room</Text>
        <TouchableOpacity
          style={styles.roomSelector}
          onPress={() => {
            setRoomPickerVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Select room"
        >
          <Text style={styles.roomSelectorLabel}>
            {selectedRoomId
              ? (rooms.find((r) => r.id === selectedRoomId)?.name ?? "Room")
              : "No room selected"}
          </Text>
          <Text style={styles.roomSelectorAction}>Change</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.meta}>Created {formatTimestamp(item.createdAt)}</Text>

      {item.location ? (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>Location</Text>
          <Text style={styles.locationText}>
            {item.location.lat.toFixed(5)}, {item.location.lon.toFixed(5)}
          </Text>
          {accuracyText ? <Text style={styles.locationMeta}>{accuracyText}</Text> : null}
          {staticMapUrl ? (
            <Image source={{ uri: staticMapUrl }} style={styles.mapImage} />
          ) : (
            <Text style={styles.mapFallback}>Map preview unavailable (no API key set).</Text>
          )}
          <TouchableOpacity
            onPress={() => {
              openInMaps(item.location!.lat, item.location!.lon);
            }}
            style={styles.linkButton}
            accessibilityRole="button"
            accessibilityLabel="Open location in Maps"
          >
            <Text style={styles.linkButtonText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.meta}>No location attached.</Text>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save changes"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <RoomPickerModal
        visible={roomPickerVisible}
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        onSelect={(id) => {
          setSelectedRoomId(id);
          setRoomPickerVisible(false);
        }}
        onCreate={async () => {}}
        onRename={async () => {}}
        onDelete={async () => {}}
        onRequestClose={() => {
          setRoomPickerVisible(false);
        }}
        allowManage={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  photo: { width: "100%", height: 260, borderRadius: 12, backgroundColor: "#ddd" },
  section: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "white",
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  meta: { fontSize: 14, color: "#555" },
  roomSelector: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomSelectorLabel: { fontSize: 16, color: "#333" },
  roomSelectorAction: { color: "#1a73e8", fontWeight: "600" },
  locationCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  locationTitle: { fontSize: 16, fontWeight: "700" },
  locationText: { fontSize: 15, color: "#333" },
  locationMeta: { fontSize: 13, color: "#555" },
  mapImage: { width: "100%", height: 180, borderRadius: 8, backgroundColor: "#eee" },
  mapFallback: { fontSize: 13, color: "#666" },
  linkButton: { paddingVertical: 8 },
  linkButtonText: { color: "#1a73e8", fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  saveButton: {
    flex: 1,
    backgroundColor: "#1a73e8",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
  deleteButton: {
    backgroundColor: "#e53935",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: { color: "white", fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "600" },
});
