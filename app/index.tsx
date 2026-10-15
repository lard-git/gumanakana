import { Redirect } from 'expo-router';
import { get, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { db } from '../FirebaseConfig';
import colors from '../constants/colors';
import { clearSession, loadSession } from '../lib/session';

export default function Index() {
  const [uid, setUid] = useState<string | null | undefined>(undefined); // undefined = still checking

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadSession();
      if (!saved) { if (alive) setUid(null); return; }
      try {
        const snap = await get(ref(db, `Customers/${saved}/personal_info`));
        if (!snap.exists()) { await clearSession(); if (alive) setUid(null); return; } // member was removed
      } catch {
        // offline: trust the saved session instead of kicking the member out
      }
      if (alive) setUid(saved);
    })();
    return () => { alive = false; };
  }, []);

  if (uid === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.background }}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }
  if (uid === null) return <Redirect href="/login" />;
  return <Redirect href={{ pathname: '/(tabs)', params: { uid } }} />;
}
