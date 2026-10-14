import { router } from 'expo-router';
import { get, ref } from 'firebase/database';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../FirebaseConfig';
import colors from '../constants/colors';

export default function Login() {
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!uid.trim()) {
      setError('Please enter your Member ID');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userRef = ref(db, `Customers/${uid.trim()}/personal_info`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        router.replace({ pathname: '/(tabs)', params: { uid: uid.trim() } });
      } else {
        setError('Member ID not found. Please check and try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad + 40, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.iconWrap}>
            <Image source={require('../assets/images/gym-logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>GymTrack</Text>
          <Text style={styles.tagline}>Your fitness journey, simplified</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Enter your Member ID to continue</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Member ID</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="e.g. 30000001"
              placeholderTextColor={colors.light.gray500}
              value={uid}
              onChangeText={(v) => { setUid(v); if (error) setError(''); }}
              keyboardType="numeric"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            {error ? (
              <View style={styles.errorRow}>
                <Text style={styles.errorDot}>●</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.light.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Gym Management System</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.light.background },
  container: { flexGrow: 1, paddingHorizontal: 24, backgroundColor: colors.light.background, alignItems: 'center', justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  iconWrap: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: colors.light.card,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2, borderColor: colors.light.primary,
    overflow: 'hidden',
  },
  logoImage: { width: 80, height: 80 },
  appName: { fontSize: 32, fontWeight: '800', color: colors.light.gray900, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: colors.light.mutedForeground, marginTop: 6 },
  card: {
    width: '100%', backgroundColor: colors.light.card, borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: colors.light.border, marginBottom: 24,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.light.gray900, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: colors.light.mutedForeground, marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.light.gray700, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: colors.light.border, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: colors.light.gray900, backgroundColor: colors.light.secondary,
  },
  inputError: { borderColor: colors.light.error },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  errorDot: { color: colors.light.error, fontSize: 8 },
  errorText: { fontSize: 13, color: colors.light.error, flex: 1 },
  button: {
    backgroundColor: colors.light.primary, paddingVertical: 16, borderRadius: 10, alignItems: 'center',
    shadowColor: colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.light.primaryForeground, fontSize: 16, fontWeight: '700' },
  footer: { fontSize: 13, color: colors.light.gray500, textAlign: 'center' },
});
