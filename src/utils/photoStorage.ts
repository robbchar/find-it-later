import * as FileSystem from "expo-file-system/legacy";

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

export async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function persistPhoto(tempUri: string, filename: string): Promise<string> {
  await ensurePhotosDir();
  const destUri = `${PHOTOS_DIR}${filename}`;
  await FileSystem.moveAsync({ from: tempUri, to: destUri });
  return destUri;
}

export async function deletePhoto(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Best-effort cleanup; ignore failures.
  }
}
