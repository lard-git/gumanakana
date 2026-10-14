import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../FirebaseConfig';
import colors from '../../constants/colors';

interface PersonalInfo {
  firstname: string;
  Lastname: string;
  phone: string;
  membership_type: string;
}
interface GymData {
  total_visits: number;
  total_time_spent: number;
  is_checked_in: boolean;
}
interface MembershipData {
  plan_display: string;
  start_date: string;
  end_date: string;
  monthly_rate: number;
  status: string;
  remaining_days: number;
}
interface AttendanceRecord {
  checkin: string;
  checkout: string;
  date: string;
  time_spent: number;
}
interface WorkoutLog {
  count: number;
  updatedAt?: number;
}

// ─── Workout calendar ─────────────────────────────────────────────────────────
function WorkoutCalendar({ logs }: { logs: Record<string, WorkoutLog> }) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const _now   = new Date();
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth    = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const streak = (() => {
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (logs[k]) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  })();

  const monthWorkouts = Object.keys(logs).filter((k) => k.startsWith(monthKey)).length;
  const totalDays     = Object.keys(logs).length;

  const canGoNext = new Date(year, month + 1, 1) <= new Date();
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={calS.wrap}>
      {/* Month nav */}
      <View style={calS.nav}>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month - 1, 1))} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <Feather name="chevron-left" size={20} color={colors.light.gray700} />
        </TouchableOpacity>
        <Text style={calS.monthTitle}>{monthName}</Text>
        <TouchableOpacity onPress={() => setViewDate(new Date(year, month + 1, 1))} disabled={!canGoNext} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <Feather name="chevron-right" size={20} color={canGoNext ? colors.light.gray700 : colors.light.border} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={calS.dayLabels}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
          <Text key={i} style={calS.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={calS.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={i} style={calS.cell} />;
          const key      = getKey(day);
          const log      = logs[key];
          const isToday  = key === todayStr;
          const hasWorkout = !!log;
          const isFuture = key > todayStr;

          return (
            <View key={i} style={calS.cell}>
              <View style={[
                calS.dayCircle,
                hasWorkout && calS.dayCircleWorkout,
                isToday && !hasWorkout && calS.dayCircleToday,
                isToday && hasWorkout && calS.dayCircleTodayWorkout,
              ]}>
                <Text style={[
                  calS.dayNum,
                  isFuture   && calS.dayNumFuture,
                  hasWorkout && calS.dayNumWorkout,
                ]}>
                  {day}
                </Text>
              </View>
              {hasWorkout && !isToday && <View style={calS.workoutDot} />}
            </View>
          );
        })}
      </View>

      {/* Stats row */}
      <View style={calS.statsRow}>
        <View style={calS.statItem}>
          <Text style={calS.statNum}>{streak}</Text>
          <Text style={calS.statLbl}>🔥 Streak</Text>
        </View>
        <View style={calS.statDivider} />
        <View style={calS.statItem}>
          <Text style={calS.statNum}>{monthWorkouts}</Text>
          <Text style={calS.statLbl}>This Month</Text>
        </View>
        <View style={calS.statDivider} />
        <View style={calS.statItem}>
          <Text style={calS.statNum}>{totalDays}</Text>
          <Text style={calS.statLbl}>Total Days</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={calS.legend}>
        <View style={calS.legendItem}>
          <View style={[calS.legendDot, { backgroundColor: colors.light.primary }]} />
          <Text style={calS.legendText}>Workout logged</Text>
        </View>
        <View style={calS.legendItem}>
          <View style={[calS.legendDot, { backgroundColor: 'rgba(235,192,105,0.2)', borderWidth: 2, borderColor: colors.light.primary }]} />
          <Text style={calS.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { uid }   = useLocalSearchParams();
  const insets    = useSafeAreaInsets();
  const [loading, setLoading]   = useState(true);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [gymData, setGymData]   = useState<GymData | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [recentHistory, setRecentHistory] = useState<AttendanceRecord[]>([]);
  const [profileImage, setProfileImage]   = useState<string | null>(null);
  const [workoutLogs, setWorkoutLogs]     = useState<Record<string, WorkoutLog>>({});

  useEffect(() => {
    const u1 = onValue(ref(db, `Customers/${uid}/personal_info`), (s) => { if (s.exists()) setPersonalInfo(s.val()); });
    const u2 = onValue(ref(db, `Customers/${uid}/gym_data`),      (s) => { if (s.exists()) setGymData(s.val()); });
    const u3 = onValue(ref(db, `Customers/${uid}/membership`),    (s) => { if (s.exists()) setMembership(s.val()); });
    const u4 = onValue(ref(db, `Customers/${uid}/attendance_history`), (s) => {
      if (s.exists()) {
        const records: AttendanceRecord[] = [];
        s.forEach((c) => { records.push(c.val()); });
        setRecentHistory(records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
      }
    });
    const u5 = onValue(ref(db, `Customers/${uid}/workout_logs`), (s) => {
      setWorkoutLogs(s.exists() ? (s.val() as Record<string, WorkoutLog>) : {});
    });
    const t = setTimeout(() => setLoading(false), 500);
    return () => { clearTimeout(t); u1(); u2(); u3(); u4(); u5(); };
  }, [uid]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
  const fmtTOD  = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        router.replace('/login');
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => router.replace('/login') },
      ]);
    }
  };

  const topPad    = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const isActive  = membership?.status?.toLowerCase() === 'active';
  const isExpired = membership?.status?.toLowerCase() === 'expired';

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.light.primary} /></View>;
  }

  const statusColor = isActive ? colors.light.success : isExpired ? colors.light.error : colors.light.warning;
  const statusBg    = isActive ? colors.light.successLight : isExpired ? colors.light.errorLight : colors.light.warningLight;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.85}>
          <Image source={profileImage ? { uri: profileImage } : require('../../assets/images/gym-logo.png')} style={styles.avatar} />
          <View style={styles.cameraOverlay}>
            <Feather name="camera" size={14} color="white" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{personalInfo?.firstname} {personalInfo?.Lastname}</Text>
        <Text style={styles.memberId}>ID: {uid}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{membership?.status ?? 'Unknown'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Visit stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{gymData?.total_visits ?? 0}</Text>
            <Text style={styles.statLbl}>Total Visits</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{fmtTime(gymData?.total_time_spent ?? 0)}</Text>
            <Text style={styles.statLbl}>Time Spent</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <View style={styles.checkInRow}>
              <View style={[styles.checkInDot, { backgroundColor: gymData?.is_checked_in ? colors.light.success : colors.light.gray400 }]} />
              <Text style={styles.statNum}>{gymData?.is_checked_in ? 'In' : 'Out'}</Text>
            </View>
            <Text style={styles.statLbl}>Check-in</Text>
          </View>
        </View>

        {/* Workout Progress Calendar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workout Progress</Text>
            <View style={styles.inlineBadge}>
              <MaterialIcons name="fitness-center" size={12} color={colors.light.primary} />
              <Text style={[styles.inlineBadgeText, { color: colors.light.primary }]}>Tracker</Text>
            </View>
          </View>
          <WorkoutCalendar logs={workoutLogs} />
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
          </View>
          <InfoRow icon={<Feather name="user" size={16} color={colors.light.primary} />}   label="Full Name" value={`${personalInfo?.firstname ?? ''} ${personalInfo?.Lastname ?? ''}`} />
          <InfoRow icon={<Feather name="phone" size={16} color={colors.light.primary} />}  label="Phone"     value={personalInfo?.phone ?? 'Not provided'} />
          <InfoRow icon={<Feather name="hash" size={16} color={colors.light.primary} />}   label="Member ID" value={uid as string} last />
        </View>

        {/* Membership */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Membership</Text>
            <View style={[styles.inlineBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.inlineBadgeText, { color: statusColor }]}>{membership?.status ?? 'Unknown'}</Text>
            </View>
          </View>
          <InfoRow icon={<MaterialIcons name="card-membership" size={16} color={colors.light.primary} />} label="Plan"          value={membership?.plan_display ?? '—'} />
          <InfoRow icon={<Feather name="calendar" size={16} color={colors.light.primary} />}              label="Start Date"    value={membership?.start_date ? fmtDate(membership.start_date) : '—'} />
          <InfoRow icon={<Feather name="calendar" size={16} color={colors.light.primary} />}              label="Expiry Date"   value={membership?.end_date   ? fmtDate(membership.end_date)   : '—'} />
          <InfoRow icon={<Feather name="clock" size={16} color={colors.light.primary} />}                label="Days Remaining" value={String(membership?.remaining_days ?? '—')} last />
        </View>

        {/* Recent visits */}
        {recentHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Visits</Text>
            </View>
            {recentHistory.map((r, i) => (
              <View key={i} style={[styles.historyItem, i === recentHistory.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyDotWrap}>
                    <View style={[styles.historyDot, { backgroundColor: colors.light.primary }]} />
                  </View>
                  <View>
                    <Text style={styles.historyDate}>{fmtDate(r.date)}</Text>
                    <Text style={styles.historyTime}>
                      {r.checkin ? fmtTOD(r.checkin) : '—'}{r.checkout ? ` → ${fmtTOD(r.checkout)}` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyDur}>{fmtTime(r.time_spent ?? 0)}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Feather name="log-out" size={17} color={colors.light.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }} />
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Calendar styles ──────────────────────────────────────────────────────────
const calS = StyleSheet.create({
  wrap:        { paddingTop: 4 },
  nav:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitle:  { fontSize: 15, fontWeight: '800', color: colors.light.gray900 },
  dayLabels:   { flexDirection: 'row', marginBottom: 6 },
  dayLabel:    { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.light.gray500, letterSpacing: 0.4 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap' },
  cell:        { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dayCircle:   { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dayCircleWorkout:      { backgroundColor: colors.light.primary },
  dayCircleToday:        { backgroundColor: 'rgba(235,192,105,0.15)', borderWidth: 2, borderColor: colors.light.primary },
  dayCircleTodayWorkout: { backgroundColor: colors.light.primary, borderWidth: 2, borderColor: '#fff' },
  dayNum:       { fontSize: 13, fontWeight: '600', color: colors.light.gray700 },
  dayNumFuture: { color: colors.light.gray400 },
  dayNumWorkout: { color: colors.light.primaryForeground, fontWeight: '800' },
  dayNumToday:   { color: colors.light.primary, fontWeight: '800' },
  workoutDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.light.primary, marginTop: 1 },
  statsRow:    { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.light.border },
  statItem:    { flex: 1, alignItems: 'center' },
  statNum:     { fontSize: 22, fontWeight: '800', color: colors.light.primary },
  statLbl:     { fontSize: 11, color: colors.light.mutedForeground, marginTop: 3, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: colors.light.border },
  legend:      { flexDirection: 'row', gap: 20, marginTop: 12, justifyContent: 'center' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 12, height: 12, borderRadius: 6 },
  legendText:  { fontSize: 11, color: colors.light.mutedForeground },
});

// ─── Profile styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.light.background },
  loading:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.light.background },
  header:      { backgroundColor: colors.light.card, paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.light.border },
  avatarWrap:  { position: 'relative', marginBottom: 14 },
  avatar:      { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.light.primary },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  name:        { fontSize: 22, fontWeight: '800', color: colors.light.gray900 },
  memberId:    { fontSize: 13, color: colors.light.mutedForeground, marginTop: 2, marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusText:  { fontSize: 13, fontWeight: '700' },
  content:     { padding: 16 },
  statsRow:    { backgroundColor: colors.light.card, borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'space-around', borderWidth: 1, borderColor: colors.light.border, marginBottom: 16 },
  statBox:     { alignItems: 'center', flex: 1 },
  statDiv:     { width: 1, backgroundColor: colors.light.border },
  statNum:     { fontSize: 20, fontWeight: '800', color: colors.light.primary },
  statLbl:     { fontSize: 12, color: colors.light.mutedForeground, marginTop: 4 },
  checkInRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkInDot:  { width: 8, height: 8, borderRadius: 4 },
  section:     { backgroundColor: colors.light.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.light.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 14, fontWeight: '700', color: colors.light.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.8 },
  inlineBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(235,192,105,0.12)' },
  inlineBadgeText: { fontSize: 12, fontWeight: '700' },
  infoRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  infoIcon:    { width: 32, alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 11, color: colors.light.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue:   { fontSize: 15, fontWeight: '600', color: colors.light.gray900, marginTop: 1 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyDotWrap: { width: 24, alignItems: 'center' },
  historyDot:  { width: 8, height: 8, borderRadius: 4 },
  historyDate: { fontSize: 14, fontWeight: '600', color: colors.light.gray900 },
  historyTime: { fontSize: 12, color: colors.light.mutedForeground, marginTop: 2 },
  historyDur:  { fontSize: 13, fontWeight: '700', color: colors.light.primary },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: colors.light.error, backgroundColor: colors.light.errorLight, marginTop: 4 },
  logoutText:  { fontSize: 15, fontWeight: '700', color: colors.light.error },
});
