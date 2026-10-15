import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { onValue, ref } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../FirebaseConfig';

import colors from '../../constants/colors';
import { useSecureScreen } from '../../lib/useSecureScreen';

interface MembershipData {
  end_date: string;
  remaining_days: number;
  status: string;
  plan_display: string;
  start_date: string;
}

interface GymData {
  total_visits: number;
  total_time_spent: number;
  is_checked_in: boolean;
}

interface PersonalInfo {
  firstname: string;
  Lastname: string;
  membership_type: string;
  phone: string;
}

function QRModal({ uid, onClose }: { uid: string; onClose: () => void }) {
  useSecureScreen('member-qr'); // no screenshots / screen recording while the QR is on screen
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 180, useNativeDriver: true }),
    ]).start(onClose);
  };

  return (
    <View style={qrStyles.overlay}>
      <Animated.View style={[qrStyles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={qrStyles.header}>
          <Text style={qrStyles.title}>Your QR Code</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={22} color={colors.light.gray700} />
          </TouchableOpacity>
        </View>
        <View style={qrStyles.qrWrap}>
          <QRCode value={uid} size={200} color={colors.light.background} backgroundColor={colors.light.primary} />
        </View>
        <Text style={qrStyles.sub}>Show this at the front desk to check in</Text>
        <TouchableOpacity style={qrStyles.closeBtn} onPress={handleClose} activeOpacity={0.85}>
          <Text style={qrStyles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const qrStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)' },
  card: {
    backgroundColor: colors.light.card, borderRadius: 20, padding: 28, alignItems: 'center',
    width: 300, borderWidth: 1, borderColor: colors.light.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: colors.light.gray900 },
  qrWrap: { padding: 12, backgroundColor: colors.light.primary, borderRadius: 16 },
  sub: { fontSize: 13, color: colors.light.mutedForeground, marginTop: 20, textAlign: 'center' },
  closeBtn: { marginTop: 24, backgroundColor: colors.light.secondary, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  closeBtnText: { color: colors.light.gray900, fontWeight: '600', fontSize: 15 },
});

export default function Home() {
  const { uid } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [gymData, setGymData] = useState<GymData | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const membershipRef = ref(db, `Customers/${uid}/membership`);
    const gymDataRef = ref(db, `Customers/${uid}/gym_data`);
    const personalInfoRef = ref(db, `Customers/${uid}/personal_info`);
    const allRef = ref(db, 'Customers');

    const unsubM = onValue(membershipRef, (s) => { if (s.exists()) setMembership(s.val()); });
    const unsubG = onValue(gymDataRef, (s) => { if (s.exists()) setGymData(s.val()); });
    const unsubP = onValue(personalInfoRef, (s) => { if (s.exists()) setPersonalInfo(s.val()); });
    const unsubA = onValue(allRef, (s) => {
      let count = 0;
      s.forEach((c) => { if (c.child('gym_data').val()?.is_checked_in) count++; });
      setActiveCount(count);
      setLoading(false);
    });

    return () => { unsubM(); unsubG(); unsubP(); unsubA(); };
  }, [uid]);

  // Android back button closes the QR first
  useEffect(() => {
    if (!showQR) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setShowQR(false); return true; });
    return () => sub.remove();
  }, [showQR]);

  const formatTime = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;

  const calcDaysRemaining = (endDate?: string): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = calcDaysRemaining(membership?.end_date);

  const getPeak = () => {
    const h = new Date().getHours();
    if (h >= 17 && h <= 20) return { label: 'Peak hours', dot: colors.light.error };
    if (h >= 6 && h <= 9) return { label: 'Morning rush', dot: colors.light.warning };
    return { label: 'Off-peak · Quiet now', dot: colors.light.success };
  };

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const isActive = membership?.status?.toLowerCase() === 'active';
  const isExpired = membership?.status?.toLowerCase() === 'expired';
  const isExpiringSoon = isActive && daysRemaining <= 7;
  const peak = getPeak();

  return (
    <>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }}>
        <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
          <View>
            <Text style={styles.greeting}>Hello, {personalInfo?.firstname ?? '—'}</Text>
            <Text style={styles.subGreeting}>Ready to crush today's workout?</Text>
          </View>
          <TouchableOpacity style={styles.qrTopBtn} onPress={() => setShowQR(true)} activeOpacity={0.8}>
            <MaterialIcons name="qr-code-scanner" size={22} color={colors.light.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Current Plan</Text>
              <Text style={styles.heroPlan}>{membership?.plan_display ?? '—'}</Text>
            </View>
            <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeWarning]}>
              <View style={[styles.statusDot, { backgroundColor: isActive ? colors.light.success : colors.light.warning }]} />
              <Text style={[styles.statusText, { color: isActive ? colors.light.success : colors.light.warning }]}>
                {membership?.status ?? 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.daysRow}>
            <Text style={styles.daysNum}>{membership ? daysRemaining : '—'}</Text>
            <Text style={styles.daysLabel}> days remaining</Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <MaterialIcons name="fitness-center" size={18} color={colors.light.primary} />
              <Text style={styles.heroStatVal}>{gymData?.total_visits ?? 0}</Text>
              <Text style={styles.heroStatLbl}>Visits</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <Feather name="clock" size={18} color={colors.light.primary} />
              <Text style={styles.heroStatVal}>{formatTime(gymData?.total_time_spent ?? 0)}</Text>
              <Text style={styles.heroStatLbl}>Time Spent</Text>
            </View>
            <View style={styles.heroStatDiv} />
            <View style={styles.heroStat}>
              <View style={[styles.checkinDot, { backgroundColor: gymData?.is_checked_in ? colors.light.success : colors.light.gray400 }]} />
              <Text style={styles.heroStatVal}>{gymData?.is_checked_in ? 'In' : 'Out'}</Text>
              <Text style={styles.heroStatLbl}>Status</Text>
            </View>
          </View>
        </View>

        {(isExpired || isExpiringSoon) && (
          <View style={[styles.warnBanner, isExpired ? styles.warnBannerError : styles.warnBannerWarn]}>
            <Feather name={isExpired ? 'alert-octagon' : 'alert-triangle'} size={18} color={isExpired ? colors.light.error : colors.light.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warnTitle, { color: isExpired ? colors.light.error : colors.light.warning }]}>
                {isExpired ? 'Membership Expired' : `Expiring in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`}
              </Text>
              <Text style={styles.warnSub}>
                {isExpired ? 'Please renew your membership to continue access.' : 'Renew soon to avoid interruption to your access.'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gym Occupancy</Text>
          <View style={styles.occupancyCard}>
            <View style={styles.occupancyLeft}>
              <View style={[styles.peakDot, { backgroundColor: peak.dot }]} />
              <View>
                <Text style={styles.peakLabel}>{peak.label}</Text>
                <View style={styles.hoursRow}>
                  <Feather name="clock" size={11} color={colors.light.mutedForeground} />
                  <Text style={styles.hoursText}>Open 7:00 AM – 8:00 PM</Text>
                </View>
              </View>
            </View>
            <View style={styles.occupancyRight}>
              <Text style={styles.occupancyCount}>{activeCount}</Text>
              <Text style={styles.occupancyLbl}>members inside</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {showQR && (
        <View style={StyleSheet.absoluteFill}>
          <QRModal uid={uid as string} onClose={() => setShowQR(false)} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.light.background },
  topBar: { paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.light.gray900 },
  subGreeting: { fontSize: 14, color: colors.light.mutedForeground, marginTop: 3 },
  qrTopBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, justifyContent: 'center', alignItems: 'center' },
  heroCard: {
    marginHorizontal: 16, marginBottom: 4, backgroundColor: colors.light.card,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.light.border,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heroLabel: { fontSize: 12, color: colors.light.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroPlan: { fontSize: 20, fontWeight: '700', color: colors.light.gray900 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusBadgeActive: { backgroundColor: 'rgba(29,185,84,0.15)' },
  statusBadgeWarning: { backgroundColor: 'rgba(235,192,105,0.15)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  daysRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  daysNum: { fontSize: 48, fontWeight: '900', color: colors.light.primary, letterSpacing: -2 },
  daysLabel: { fontSize: 15, color: colors.light.mutedForeground, marginLeft: 4 },
  heroStats: { flexDirection: 'row', backgroundColor: colors.light.secondary, borderRadius: 12, padding: 14 },
  heroStat: { flex: 1, alignItems: 'center', gap: 4 },
  heroStatDiv: { width: 1, backgroundColor: colors.light.border },
  heroStatVal: { fontSize: 15, fontWeight: '700', color: colors.light.gray900 },
  heroStatLbl: { fontSize: 11, color: colors.light.mutedForeground },
  checkinDot: { width: 10, height: 10, borderRadius: 5 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.light.gray700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  occupancyCard: { backgroundColor: colors.light.card, borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.light.border },
  occupancyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  hoursText: { fontSize: 11, color: colors.light.mutedForeground },
  peakDot: { width: 10, height: 10, borderRadius: 5 },
  peakLabel: { fontSize: 15, color: colors.light.gray700, fontWeight: '500' },
  occupancyRight: { alignItems: 'flex-end' },
  occupancyCount: { fontSize: 32, fontWeight: '900', color: colors.light.gray900 },
  occupancyLbl: { fontSize: 12, color: colors.light.mutedForeground },
  warnBanner: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1 },
  warnBannerError: { backgroundColor: 'rgba(241,94,108,0.1)', borderColor: 'rgba(241,94,108,0.3)' },
  warnBannerWarn: { backgroundColor: 'rgba(235,192,105,0.1)', borderColor: 'rgba(235,192,105,0.3)' },
  warnTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  warnSub: { fontSize: 12, color: colors.light.mutedForeground, lineHeight: 17 },
});
