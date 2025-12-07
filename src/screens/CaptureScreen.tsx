import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import type { RootStackParamList } from "../navigation/types";
import { insertItem, updateItemLocation } from "../storage/items";
import { persistPhoto } from "../utils/photoStorage";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

export function CaptureScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      setCapturedUri(photo?.uri ?? null);
    } catch {
      Alert.alert("Camera error", "Could not take photo. Please try again.");
    }
  }, []);

  const promptForLocation = useCallback((itemId: string) => {
    return new Promise<void>((resolve) => {
      Alert.alert("Attach location?", "If you allow location, we’ll attach it to this item.", [
        {
          text: "Skip",
          style: "cancel",
          onPress: () => {
            resolve();
          },
        },
        {
          text: "Allow",
          onPress: async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") {
                resolve();
                return;
              }
              const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              await updateItemLocation(itemId, {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                accuracy: pos.coords.accuracy ?? undefined,
              });
            } catch {
              // Best-effort; ignore errors and proceed.
            } finally {
              resolve();
            }
          },
        },
      ]);
    });
  }, []);

  const saveItem = useCallback(async () => {
    if (!capturedUri) return;
    setSaving(true);
    try {
      const id = uuidv4();
      const storedPhotoUri = await persistPhoto(capturedUri, `${id}.jpg`);
      await insertItem({
        id,
        label: label.trim(),
        note: note.trim() ? note.trim() : undefined,
        photoUri: storedPhotoUri,
        createdAt: Date.now(),
      });
      setSaving(false);
      setCapturedUri(null);
      setLabel("");
      setNote("");
      await promptForLocation(id);
      navigation.goBack();
    } catch (error) {
      setSaving(false);
      Alert.alert("Save failed", "Could not save this item. Please try again.");
      console.error(error);
    }
  }, [capturedUri, label, note, navigation, promptForLocation]);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.body}>We need camera permission to capture a photo for your item.</Text>
        <Button
          title="Allow camera"
          onPress={async () => {
            await requestPermission();
          }}
        />
        <Button
          title="Go back"
          onPress={() => {
            navigation.goBack();
          }}
        />
      </View>
    );
  }

  if (capturedUri) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <Image source={{ uri: capturedUri }} style={styles.preview} />
        <View style={styles.form}>
          <TextInput
            placeholder="Label (optional)"
            value={label}
            onChangeText={setLabel}
            style={styles.input}
            returnKeyType="next"
          />
          <TextInput
            placeholder="Note (optional)"
            value={note}
            onChangeText={setNote}
            style={[styles.input, styles.inputMultiline]}
            multiline
          />
          <View style={styles.row}>
            <Button
              title="Retake"
              onPress={() => {
                setCapturedUri(null);
              }}
              disabled={saving}
            />
            <Button title={saving ? "Saving..." : "Save"} onPress={saveItem} disabled={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView style={styles.camera} ref={cameraRef} />
      <View style={styles.cameraControls}>
        <TouchableOpacity
          onPress={takePhoto}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          style={styles.shutterButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },
  cameraControls: {
    position: "absolute",
    bottom: 32,
    width: "100%",
    alignItems: "center",
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "white",
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.5)",
  },
  container: { flex: 1, backgroundColor: "white" },
  preview: { width: "100%", height: "55%" },
  form: { padding: 16, gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  centered: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "600", textAlign: "center" },
  body: { fontSize: 16, color: "#444", textAlign: "center" },
});
