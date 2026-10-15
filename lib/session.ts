import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keeps the member signed in between launches.
// Phones: stored in the device's secure storage (Keychain / Keystore). Web preview: localStorage.
const KEY = 'gym_member_uid';
const hasLocalStorage = () => typeof localStorage !== 'undefined';

export async function saveSession(uid: string): Promise<void> {
  try {
    if (Platform.OS === 'web') { if (hasLocalStorage()) localStorage.setItem(KEY, uid); return; }
    await SecureStore.setItemAsync(KEY, uid);
  } catch { /* if storage fails the member just has to sign in again next time */ }
}

export async function loadSession(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return hasLocalStorage() ? localStorage.getItem(KEY) : null;
    return await SecureStore.getItemAsync(KEY);
  } catch { return null; }
}

export async function clearSession(): Promise<void> {
  try {
    if (Platform.OS === 'web') { if (hasLocalStorage()) localStorage.removeItem(KEY); return; }
    await SecureStore.deleteItemAsync(KEY);
  } catch { /* nothing to clear */ }
}
