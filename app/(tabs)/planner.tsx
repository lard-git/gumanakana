import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { onValue, push, ref, remove, set } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, Image, Linking, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../FirebaseConfig';
import colors from '../../constants/colors';

const GYM_LOGO = require('../../assets/images/gym-logo.png');

interface Exercise {
  id: string; name: string; sets: number; reps: number; weight: number;
  videoUrl?: string; notes?: string; category?: string;
}
interface Routine { id: string; name: string; exercises: Exercise[]; }

// ─── Exercise library ─────────────────────────────────────────────────────────
const EXERCISE_LIBRARY = [
  { id:'lib_1',  name:'Bench Press',       sets:4, reps:10, weight:60,  videoUrl:'https://www.youtube.com/watch?v=4Y2ZdHCOXok', notes:'Keep elbows at 45°',      category:'Chest' },
  { id:'lib_2',  name:'Incline DB Press',  sets:3, reps:12, weight:20,  videoUrl:'https://www.youtube.com/watch?v=8qP6vTE2w6c', notes:'Targets upper chest',     category:'Chest' },
  { id:'lib_3',  name:'Push-ups',          sets:3, reps:15, weight:0,   videoUrl:'https://www.youtube.com/watch?v=IODxDxX7oi4', notes:'Bodyweight exercise',     category:'Chest' },
  { id:'lib_16', name:'Cable Flyes',       sets:3, reps:14, weight:15,  videoUrl:'', notes:'Full stretch at bottom',  category:'Chest' },
  { id:'lib_17', name:'Chest Dips',        sets:3, reps:12, weight:0,   videoUrl:'', notes:'Lean forward slightly',   category:'Chest' },
  { id:'lib_18', name:'Pec Deck',          sets:3, reps:15, weight:40,  videoUrl:'', notes:'Squeeze at peak',         category:'Chest' },
  { id:'lib_7',  name:'Deadlifts',         sets:4, reps:6,  weight:100, videoUrl:'https://www.youtube.com/watch?v=ytGaGIn3SjE', notes:'Keep back straight',    category:'Back'  },
  { id:'lib_8',  name:'Pull-ups',          sets:4, reps:8,  weight:0,   videoUrl:'https://www.youtube.com/watch?v=eGo4IYlbE5g', notes:'Use bands if needed',   category:'Back'  },
  { id:'lib_9',  name:'Barbell Rows',      sets:4, reps:10, weight:50,  videoUrl:'https://www.youtube.com/watch?v=FWJR5Ve8bnQ', notes:'Pull to lower chest',   category:'Back'  },
  { id:'lib_19', name:'Lat Pulldown',      sets:3, reps:12, weight:55,  videoUrl:'', notes:'Pull to upper chest',    category:'Back'  },
  { id:'lib_20', name:'Seated Cable Row',  sets:3, reps:12, weight:50,  videoUrl:'', notes:'Keep back neutral',      category:'Back'  },
  { id:'lib_21', name:'T-Bar Row',         sets:3, reps:10, weight:40,  videoUrl:'', notes:'Chest on pad',           category:'Back'  },
  { id:'lib_22', name:'Face Pulls',        sets:3, reps:15, weight:20,  videoUrl:'', notes:'Pull to forehead',       category:'Back'  },
  { id:'lib_4',  name:'Squats',            sets:4, reps:10, weight:80,  videoUrl:'https://www.youtube.com/watch?v=aclHkVaku9U', notes:'Go below parallel',    category:'Legs'  },
  { id:'lib_5',  name:'Leg Press',         sets:3, reps:12, weight:120, videoUrl:'https://www.youtube.com/watch?v=IZxyjW7MPJQ', notes:"Don't lock knees",     category:'Legs'  },
  { id:'lib_6',  name:'Lunges',            sets:3, reps:12, weight:0,   videoUrl:'https://www.youtube.com/watch?v=QOVaHwm-Q6U', notes:'Front knee behind toes',category:'Legs'  },
  { id:'lib_23', name:'Romanian Deadlift', sets:3, reps:10, weight:70,  videoUrl:'', notes:'Feel hamstring stretch', category:'Legs'  },
  { id:'lib_24', name:'Leg Curls',         sets:3, reps:12, weight:40,  videoUrl:'', notes:'Full range of motion',   category:'Legs'  },
  { id:'lib_25', name:'Leg Extensions',    sets:3, reps:15, weight:35,  videoUrl:'', notes:'Squeeze at top',         category:'Legs'  },
  { id:'lib_26', name:'Hip Thrust',        sets:4, reps:12, weight:80,  videoUrl:'', notes:'Drive through heels',    category:'Legs'  },
  { id:'lib_27', name:'Calf Raises',       sets:4, reps:20, weight:60,  videoUrl:'', notes:'Full stretch at bottom', category:'Legs'  },
  { id:'lib_10', name:'Overhead Press',    sets:4, reps:8,  weight:40,  videoUrl:'https://www.youtube.com/watch?v=2yjwXTZQDDI', notes:'Engage core',          category:'Shoulders' },
  { id:'lib_11', name:'Lateral Raises',    sets:4, reps:15, weight:10,  videoUrl:'https://www.youtube.com/watch?v=3VcKaXpzqRo', notes:'Controlled movement',  category:'Shoulders' },
  { id:'lib_28', name:'Front Raises',      sets:3, reps:12, weight:8,   videoUrl:'', notes:'Raise to eye level',     category:'Shoulders' },
  { id:'lib_29', name:'Arnold Press',      sets:3, reps:12, weight:16,  videoUrl:'', notes:'Rotate palms up',        category:'Shoulders' },
  { id:'lib_30', name:'Rear Delt Flyes',   sets:3, reps:15, weight:8,   videoUrl:'', notes:'Slight elbow bend',      category:'Shoulders' },
  { id:'lib_12', name:'Bicep Curls',       sets:4, reps:12, weight:15,  videoUrl:'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', notes:'Elbows pinned',       category:'Arms' },
  { id:'lib_13', name:'Tricep Pushdowns',  sets:4, reps:12, weight:20,  videoUrl:'https://www.youtube.com/watch?v=6Fzep104f0s', notes:'Focus on contraction', category:'Arms' },
  { id:'lib_31', name:'Hammer Curls',      sets:3, reps:12, weight:14,  videoUrl:'', notes:'Neutral grip',           category:'Arms' },
  { id:'lib_32', name:'Skull Crushers',    sets:3, reps:12, weight:30,  videoUrl:'', notes:'Lower to forehead',      category:'Arms' },
  { id:'lib_33', name:'Tricep Dips',       sets:3, reps:12, weight:0,   videoUrl:'', notes:'Keep elbows close',      category:'Arms' },
  { id:'lib_34', name:'Preacher Curls',    sets:3, reps:10, weight:20,  videoUrl:'', notes:'Full range of motion',   category:'Arms' },
  { id:'lib_14', name:'Plank',             sets:3, reps:60, weight:0,   videoUrl:'https://www.youtube.com/watch?v=pSHjTRCQxIw', notes:'Hold 60 seconds',     category:'Core' },
  { id:'lib_15', name:'Russian Twists',    sets:3, reps:20, weight:5,   videoUrl:'https://www.youtube.com/watch?v=wkD8rjkR1XQ', notes:'Twist side to side',  category:'Core' },
  { id:'lib_35', name:'Hanging Leg Raises',sets:3, reps:12, weight:0,   videoUrl:'', notes:'Control the descent',    category:'Core' },
  { id:'lib_36', name:'Ab Wheel Rollout',  sets:3, reps:10, weight:0,   videoUrl:'', notes:'Brace core hard',        category:'Core' },
  { id:'lib_37', name:'Cable Crunches',    sets:3, reps:15, weight:25,  videoUrl:'', notes:'Round spine down',       category:'Core' },
  { id:'lib_38', name:'Dead Bug',          sets:3, reps:10, weight:0,   videoUrl:'', notes:'Keep lower back flat',   category:'Core' },
];

const mkId = (p:string, i:number) => `${p}_${i}`;
const fromLib = (id:string) => EXERCISE_LIBRARY.find((e)=>e.id===id)!;

const PRESET_ROUTINES: { name:string; description:string; color:string; exerciseIds:string[] }[] = [
  { name:'Push Day',     color:'#e8a598', description:'Chest · Shoulders · Triceps',          exerciseIds:['lib_1','lib_2','lib_10','lib_11','lib_13','lib_32'] },
  { name:'Pull Day',     color:'#8fcfdf', description:'Back · Biceps · Rear Delts',           exerciseIds:['lib_7','lib_8','lib_9','lib_19','lib_12','lib_22'] },
  { name:'Leg Day',      color:'#a8d8a8', description:'Quads · Hamstrings · Glutes · Calves', exerciseIds:['lib_4','lib_5','lib_23','lib_24','lib_26','lib_27'] },
  { name:'Chest Day',    color:'#e8a598', description:'Compound & isolation chest',           exerciseIds:['lib_1','lib_2','lib_16','lib_18','lib_17','lib_3'] },
  { name:'Back Day',     color:'#8fcfdf', description:'Full back — width & thickness',        exerciseIds:['lib_7','lib_8','lib_19','lib_9','lib_20','lib_22'] },
  { name:'Shoulder Day', color:'#f7c59f', description:'All three heads of the deltoid',       exerciseIds:['lib_10','lib_11','lib_28','lib_29','lib_30'] },
  { name:'Arm Day',      color:'#c4b0e8', description:'Biceps & Triceps superset',            exerciseIds:['lib_12','lib_13','lib_31','lib_32','lib_34','lib_33'] },
  { name:'Core Day',     color:'#f2e29a', description:'Abs & core stability',                 exerciseIds:['lib_14','lib_35','lib_15','lib_36','lib_37','lib_38'] },
];

const WEEKDAYS_FULL  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const WEEKDAYS_SHORT = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const CATEGORIES     = ['All','Chest','Back','Legs','Shoulders','Arms','Core'];
const CATEGORY_COLORS: Record<string,string> = {
  Chest:'#e8a598', Back:'#8fcfdf', Legs:'#a8d8a8',
  Shoulders:'#f7c59f', Arms:'#c4b0e8', Core:'#f2e29a',
};

// ─── Stepper ──────────────────────────────────────────────────────────────────
function StepperRow({ label, value, onDecrement, onIncrement, onChangeText }:{
  label:string; value:string; onDecrement:()=>void; onIncrement:()=>void; onChangeText:(v:string)=>void;
}) {
  return (
    <View style={SS.card}>
      <Text style={SS.label}>{label}</Text>
      <View style={SS.row}>
        <TouchableOpacity style={SS.btn} onPress={onDecrement} activeOpacity={0.7}><Feather name="minus" size={18} color={colors.light.gray700} /></TouchableOpacity>
        <View style={SS.valueWrap}><TextInput style={SS.value} keyboardType="numeric" value={value} onChangeText={onChangeText} textAlign="center" /></View>
        <TouchableOpacity style={SS.btn} onPress={onIncrement} activeOpacity={0.7}><Feather name="plus" size={18} color={colors.light.primary} /></TouchableOpacity>
      </View>
    </View>
  );
}
const SS = StyleSheet.create({
  card:{ backgroundColor:colors.light.secondary, borderRadius:12, borderWidth:1, borderColor:colors.light.border, paddingHorizontal:14, paddingVertical:12, marginBottom:10 },
  label:{ fontSize:10, fontWeight:'700', color:colors.light.mutedForeground, letterSpacing:0.8, textTransform:'uppercase', marginBottom:8 },
  row:{ flexDirection:'row', alignItems:'center' },
  btn:{ width:40, height:40, borderRadius:10, backgroundColor:colors.light.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:colors.light.border },
  valueWrap:{ flex:1, minWidth:0 },
  value:{ fontSize:22, fontWeight:'800', color:colors.light.gray900, textAlign:'center', width:'100%' },
});

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtSeconds = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

// ─── Exercise session card (per-set + rest timer) ─────────────────────────────
interface ExerciseSessionProps {
  item: Exercise;
  completedSets: Set<string>;
  onSetToggle: (key: string) => void;
  restDuration: number;
  activeRestKey: string | null;
  restRemaining: number;
}

function ExerciseSession({ item, completedSets, onSetToggle, restDuration, activeRestKey, restRemaining }: ExerciseSessionProps) {
  const allDone = Array.from({length: item.sets}, (_, i) => `${item.sets}_${i}`).every(
    (_, i) => completedSets.has(`${item.id}_${i}`)
  );
  const doneSets = Array.from({length: item.sets}, (_, i) => i).filter((i) => completedSets.has(`${item.id}_${i}`)).length;

  return (
    <View style={[exS.card, allDone && exS.cardDone]}>
      {/* Exercise header */}
      <View style={exS.header}>
        <View style={exS.headerLeft}>
          {item.category && (
            <View style={[exS.catBar, { backgroundColor: CATEGORY_COLORS[item.category] ?? colors.light.primary }]} />
          )}
          <View>
            <Text style={[exS.name, allDone && exS.nameDone]}>{item.name}</Text>
            <View style={exS.chips}>
              <View style={exS.chip}><Text style={exS.chipTxt}>{item.reps} reps</Text></View>
              {item.weight > 0
                ? <View style={[exS.chip, exS.chipGold]}><Text style={exS.chipGoldTxt}>{item.weight}kg</Text></View>
                : <View style={exS.chip}><Text style={exS.chipTxt}>Bodyweight</Text></View>}
              {item.category && (
                <View style={[exS.chip, { backgroundColor: (CATEGORY_COLORS[item.category] ?? colors.light.primary) + '22' }]}>
                  <Text style={[exS.chipTxt, { color: CATEGORY_COLORS[item.category] ?? colors.light.primary }]}>{item.category}</Text>
                </View>
              )}
            </View>
            {item.notes ? <Text style={exS.notes}>{item.notes}</Text> : null}
          </View>
        </View>
        <View style={exS.headerRight}>
          <Text style={[exS.progress, allDone && exS.progressDone]}>{doneSets}/{item.sets}</Text>
          <Text style={exS.progressLbl}>sets</Text>
          {item.videoUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(item.videoUrl!)} style={{ marginTop: 4 }} activeOpacity={0.7}>
              <MaterialIcons name="play-circle-outline" size={22} color="#f15e6c" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Individual sets */}
      <View style={exS.setsContainer}>
        {Array.from({ length: item.sets }, (_, setIdx) => {
          const key = `${item.id}_${setIdx}`;
          const done = completedSets.has(key);
          const isResting = activeRestKey === key;

          return (
            <TouchableOpacity
              key={key}
              style={[exS.setRow, done && exS.setRowDone, isResting && exS.setRowResting]}
              onPress={() => onSetToggle(key)}
              activeOpacity={0.8}
            >
              {/* Checkbox */}
              <View style={[exS.check, done && exS.checkDone, isResting && exS.checkResting]}>
                {done && !isResting && <Feather name="check" size={13} color="#fff" />}
                {isResting && <Feather name="clock" size={13} color={colors.light.primary} />}
              </View>

              {/* Label */}
              <Text style={[exS.setLabel, done && exS.setLabelDone]}>
                Set {setIdx + 1}
              </Text>

              {/* Reps + weight */}
              <Text style={[exS.setDetail, done && exS.setDetailDone]}>
                {item.reps} reps{item.weight > 0 ? ` · ${item.weight}kg` : ''}
              </Text>

              {/* Rest countdown or done indicator */}
              {isResting ? (
                <View style={exS.restBadge}>
                  <Feather name="clock" size={11} color={colors.light.primary} />
                  <Text style={exS.restBadgeText}>Rest {fmtSeconds(restRemaining)}</Text>
                </View>
              ) : done ? (
                <View style={exS.doneBadge}>
                  <Text style={exS.doneBadgeText}>Done</Text>
                </View>
              ) : (
                <View style={exS.pendingBadge}>
                  <Text style={exS.pendingBadgeText}>Tap</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const exS = StyleSheet.create({
  card: { backgroundColor: colors.light.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.light.border, overflow: 'hidden' },
  cardDone: { borderColor: colors.light.success, opacity: 0.85 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 14, paddingBottom: 10 },
  headerLeft: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  catBar: { width: 3, borderRadius: 2, minHeight: 36, marginTop: 2 },
  name: { fontSize: 16, fontWeight: '800', color: colors.light.gray900, marginBottom: 6 },
  nameDone: { color: colors.light.gray500, textDecorationLine: 'line-through' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border },
  chipTxt: { fontSize: 11, fontWeight: '600', color: colors.light.gray700 },
  chipGold: { backgroundColor: 'rgba(235,192,105,0.15)', borderColor: 'rgba(235,192,105,0.4)' },
  chipGoldTxt: { fontSize: 11, fontWeight: '700', color: colors.light.primary },
  notes: { fontSize: 11, color: colors.light.mutedForeground, marginTop: 5, fontStyle: 'italic' },
  headerRight: { alignItems: 'center', minWidth: 44 },
  progress: { fontSize: 20, fontWeight: '900', color: colors.light.gray700 },
  progressDone: { color: colors.light.success },
  progressLbl: { fontSize: 10, color: colors.light.mutedForeground, fontWeight: '600', textTransform: 'uppercase' },
  setsContainer: { borderTopWidth: 1, borderTopColor: colors.light.border },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  setRowDone: { backgroundColor: 'rgba(29,185,84,0.05)' },
  setRowResting: { backgroundColor: 'rgba(235,192,105,0.06)' },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: colors.light.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  checkDone: { backgroundColor: colors.light.success, borderColor: colors.light.success },
  checkResting: { borderColor: colors.light.primary, backgroundColor: 'rgba(235,192,105,0.15)' },
  setLabel: { fontSize: 14, fontWeight: '700', color: colors.light.gray900, width: 50 },
  setLabelDone: { color: colors.light.gray500, textDecorationLine: 'line-through' },
  setDetail: { flex: 1, fontSize: 13, color: colors.light.gray700 },
  setDetailDone: { color: colors.light.gray400 },
  restBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(235,192,105,0.15)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(235,192,105,0.35)' },
  restBadgeText: { fontSize: 12, fontWeight: '700', color: colors.light.primary },
  doneBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(29,185,84,0.12)', borderRadius: 8 },
  doneBadgeText: { fontSize: 11, fontWeight: '700', color: colors.light.success },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.light.secondary, borderRadius: 8, borderWidth: 1, borderColor: colors.light.border },
  pendingBadgeText: { fontSize: 11, fontWeight: '600', color: colors.light.gray500 },
});

// ─── Rest timer settings modal ─────────────────────────────────────────────────
const REST_PRESETS = [30, 45, 60, 90, 120, 180];

function RestTimerSettings({ visible, duration, onClose, onChange }: {
  visible: boolean; duration: number; onClose: () => void; onChange: (d: number) => void;
}) {
  const [custom, setCustom] = useState(String(duration));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rtS.overlay}>
        <View style={rtS.sheet}>
          <View style={rtS.handle} />
          <Text style={rtS.title}>Rest Timer Duration</Text>
          <Text style={rtS.sub}>Auto-starts after each set is checked off</Text>
          <View style={rtS.presets}>
            {REST_PRESETS.map((p) => (
              <TouchableOpacity
                key={p} style={[rtS.presetBtn, duration === p && rtS.presetBtnActive]}
                onPress={() => { onChange(p); setCustom(String(p)); }} activeOpacity={0.8}
              >
                <Text style={[rtS.presetTxt, duration === p && rtS.presetTxtActive]}>
                  {p >= 60 ? `${p / 60}m` : `${p}s`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={rtS.customLabel}>Custom (seconds)</Text>
          <View style={rtS.customRow}>
            <TouchableOpacity style={rtS.stepBtn} onPress={() => { const v = Math.max(5, (parseInt(custom)||60) - 5); setCustom(String(v)); onChange(v); }} activeOpacity={0.7}>
              <Feather name="minus" size={18} color={colors.light.gray700} />
            </TouchableOpacity>
            <View style={rtS.inputWrap}>
              <TextInput
                style={rtS.input} keyboardType="numeric" value={custom}
                onChangeText={(v) => { setCustom(v); const n = parseInt(v); if (n > 0 && n <= 600) onChange(n); }}
                textAlign="center"
              />
            </View>
            <TouchableOpacity style={rtS.stepBtn} onPress={() => { const v = Math.min(600, (parseInt(custom)||60) + 5); setCustom(String(v)); onChange(v); }} activeOpacity={0.7}>
              <Feather name="plus" size={18} color={colors.light.primary} />
            </TouchableOpacity>
          </View>
          <Text style={rtS.hint}>{fmtSeconds(parseInt(custom) || duration)} per set</Text>
          <TouchableOpacity style={rtS.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={rtS.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const rtS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.light.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, backgroundColor: colors.light.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: colors.light.gray900, marginBottom: 4 },
  sub: { fontSize: 13, color: colors.light.mutedForeground, marginBottom: 20 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  presetBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.light.secondary, borderWidth: 1.5, borderColor: colors.light.border },
  presetBtnActive: { backgroundColor: 'rgba(235,192,105,0.15)', borderColor: colors.light.primary },
  presetTxt: { fontSize: 15, fontWeight: '700', color: colors.light.gray700 },
  presetTxtActive: { color: colors.light.primary },
  customLabel: { fontSize: 11, fontWeight: '700', color: colors.light.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  customRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border, justifyContent: 'center', alignItems: 'center' },
  inputWrap: { flex: 1 },
  input: { fontSize: 28, fontWeight: '900', color: colors.light.gray900, textAlign: 'center' },
  hint: { fontSize: 12, color: colors.light.mutedForeground, textAlign: 'center', marginBottom: 20 },
  doneBtn: { backgroundColor: colors.light.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: colors.light.primaryForeground },
});

// ─── Main Planner ─────────────────────────────────────────────────────────────
export default function Planner() {
  const { uid }  = useLocalSearchParams();
  const insets   = useSafeAreaInsets();
  const [tab, setTab] = useState<'schedule'|'routines'>('schedule');

  // Schedule
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [workouts, setWorkouts]       = useState<Record<string,Exercise[]>>({});

  // Routines
  const [routines, setRoutines]           = useState<Routine[]>([]);
  const [openRoutineId, setOpenRoutineId] = useState<string|null>(null);

  // New-routine flow
  const [newRoutineStep, setNewRoutineStep]   = useState<'idle'|'picker'|'custom'|'preset-list'>('idle');
  const [newRoutineName, setNewRoutineName]   = useState('');
  const [selectedPreset, setSelectedPreset]  = useState<typeof PRESET_ROUTINES[0]|null>(null);

  // "Add to schedule" day-picker
  const [schedPickerVisible, setSchedPickerVisible] = useState(false);
  const pendingScheduleRef = useRef<{ exercises:Exercise[]; name:string }|null>(null);
  const [schedPickerDay, setSchedPickerDay] = useState('Monday');

  // ── Active Workout Session ────────────────────────────────────────────────────
  const [sessionVisible, setSessionVisible]   = useState(false);
  const [sessionDay, setSessionDay]           = useState('Monday');

  // Per-set completion: key = `${exerciseId}_${setIndex}`
  const [completedSets, setCompletedSets]     = useState<Set<string>>(new Set());

  // Overall workout stopwatch
  const [workoutElapsed, setWorkoutElapsed]   = useState(0); // seconds
  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Per-set rest timer
  const [restDuration, setRestDuration]       = useState(60); // seconds, user-configurable
  const [restRemaining, setRestRemaining]     = useState(0);
  const [activeRestKey, setActiveRestKey]     = useState<string | null>(null); // which set is resting
  const [restSettingsVisible, setRestSettingsVisible] = useState(false);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Exercise form
  const [customModal, setCustomModal]         = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise|null>(null);
  const [form, setForm] = useState({ name:'', sets:'3', reps:'10', weight:'0', videoUrl:'', notes:'' });
  const [weightUnit, setWeightUnit] = useState<'kg'|'lbs'>('kg');

  // Library
  const [libraryModal, setLibraryModal]     = useState(false);
  const [libraryTarget, setLibraryTarget]   = useState<'schedule'|string>('schedule');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [librarySearch, setLibrarySearch]   = useState('');

  // ── Firebase ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setWorkouts({});
    const unsub = onValue(ref(db, `Customers/${uid}/workouts`), (snap) => {
      const empty: Record<string, Exercise[]> = {};
      WEEKDAYS_FULL.forEach((d) => { empty[d] = []; });
      if (snap.exists()) {
        const data = snap.val();
        WEEKDAYS_FULL.forEach((day) => { if (data[day]) empty[day] = Object.values(data[day]) as Exercise[]; });
      }
      setWorkouts(empty);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const unsub = onValue(ref(db, `Customers/${uid}/routines`), (snap) => {
      if (snap.exists()) {
        setRoutines(Object.entries(snap.val()).map(([id, val]: any) => ({
          id, name: val.name,
          exercises: val.exercises ? Object.values(val.exercises) as Exercise[] : [],
        })));
      } else setRoutines([]);
    });
    return () => unsub();
  }, [uid]);

  // ── Save helpers ──────────────────────────────────────────────────────────────
  const saveScheduleDay = async (day: string, exercises: Exercise[]) => {
    const obj: Record<string, Exercise> = {};
    exercises.forEach((e) => { obj[e.id] = e; });
    await set(ref(db, `Customers/${uid}/workouts/${day}`), exercises.length ? obj : null);
  };

  const saveRoutineExercises = async (routineId: string, exercises: Exercise[]) => {
    const obj: Record<string, Exercise> = {};
    exercises.forEach((e) => { obj[e.id] = e; });
    await set(ref(db, `Customers/${uid}/routines/${routineId}/exercises`), exercises.length ? obj : null);
  };

  // ── Add to schedule day picker ────────────────────────────────────────────────
  const openSchedPicker = (exercises: Exercise[], name: string) => {
    pendingScheduleRef.current = { exercises, name };
    const todayIdx = new Date().getDay();
    setSchedPickerDay(WEEKDAYS_FULL[todayIdx === 0 ? 6 : todayIdx - 1]);
    setSchedPickerVisible(true);
  };

  const confirmSchedule = async () => {
    const pending = pendingScheduleRef.current;
    if (!pending) return;
    const newExs = pending.exercises.map((e) => ({ ...e, id: `r_${Date.now()}_${Math.random().toString(36).slice(2)}` }));
    await saveScheduleDay(schedPickerDay, newExs);
    setSchedPickerVisible(false);
    pendingScheduleRef.current = null;
    setTab('schedule');
    setSelectedDay(schedPickerDay);
    setOpenRoutineId(null);
  };

  // ── Workout Session ───────────────────────────────────────────────────────────
  const clearTimers = () => {
    if (workoutTimerRef.current) { clearInterval(workoutTimerRef.current); workoutTimerRef.current = null; }
    if (restTimerRef.current)    { clearInterval(restTimerRef.current);    restTimerRef.current    = null; }
  };

  const startWorkout = (day: string) => {
    setSessionDay(day);
    setCompletedSets(new Set());
    setWorkoutElapsed(0);
    setRestRemaining(0);
    setActiveRestKey(null);
    setSessionVisible(true);
    workoutTimerRef.current = setInterval(() => setWorkoutElapsed((s) => s + 1), 1000);
  };

  const startRest = (key: string, duration: number) => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setActiveRestKey(key);
    setRestRemaining(duration);
    restTimerRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current!);
          restTimerRef.current = null;
          setActiveRestKey(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (restTimerRef.current) { clearInterval(restTimerRef.current); restTimerRef.current = null; }
    setActiveRestKey(null);
    setRestRemaining(0);
  };

  const handleSetToggle = (key: string) => {
    setCompletedSets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Cancel rest if this set was resting
        if (activeRestKey === key) {
          if (restTimerRef.current) { clearInterval(restTimerRef.current); restTimerRef.current = null; }
          setActiveRestKey(null);
          setRestRemaining(0);
        }
      } else {
        next.add(key);
        // Auto-start rest timer
        startRest(key, restDuration);
      }
      return next;
    });
  };

  const finishWorkout = async () => {
    clearTimers();
    const today = new Date().toISOString().split('T')[0];
    const sessionExs = workouts[sessionDay] ?? [];
    const totalSets = sessionExs.reduce((a, e) => a + e.sets, 0);
    const doneSets  = completedSets.size;
    await set(ref(db, `Customers/${uid}/workout_logs/${today}`), {
      count: doneSets,
      totalSets,
      duration: workoutElapsed,
      day: sessionDay,
      updatedAt: Date.now(),
    });
    setSessionVisible(false);
    setCompletedSets(new Set());
    setActiveRestKey(null);
    setWorkoutElapsed(0);
    setRestRemaining(0);
  };

  const closeSession = () => {
    clearTimers();
    setSessionVisible(false);
    setCompletedSets(new Set());
    setActiveRestKey(null);
    setWorkoutElapsed(0);
    setRestRemaining(0);
  };

  // cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  // ── Routine CRUD ──────────────────────────────────────────────────────────────
  const createCustomRoutine = async () => {
    if (!newRoutineName.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
    await push(ref(db, `Customers/${uid}/routines`), { name: newRoutineName.trim(), exercises: {} });
    setNewRoutineName('');
    setNewRoutineStep('idle');
  };

  const createPresetRoutine = async () => {
    if (!selectedPreset) return;
    const exercises: Record<string, Exercise> = {};
    const exList: Exercise[] = selectedPreset.exerciseIds.map((libId, i) => {
      const src = fromLib(libId);
      const id = mkId('p', i);
      const ex: Exercise = { id, name: src.name, sets: src.sets, reps: src.reps, weight: src.weight, videoUrl: src.videoUrl, notes: src.notes, category: src.category };
      exercises[id] = ex;
      return ex;
    });
    await push(ref(db, `Customers/${uid}/routines`), { name: selectedPreset.name, exercises });
    setSelectedPreset(null);
    setNewRoutineStep('idle');
    openSchedPicker(exList, selectedPreset.name);
  };

  const deleteRoutine = (r: Routine) => {
    const doDelete = async () => {
      await remove(ref(db, `Customers/${uid}/routines/${r.id}`));
      if (openRoutineId === r.id) setOpenRoutineId(null);
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Delete "${r.name}"?`)) doDelete();
    } else {
      Alert.alert('Delete Routine', `Delete "${r.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // ── Weight helpers ─────────────────────────────────────────────────────────────
  const toDisplayWeight = (kg: number) => weightUnit === 'lbs' ? +(kg * 2.20462).toFixed(1) : kg;
  const toKg = (val: number) => weightUnit === 'lbs' ? +(val / 2.20462).toFixed(2) : val;
  const weightStep = weightUnit === 'lbs' ? 5 : 2.5;
  const stepField = (field: 'sets' | 'reps' | 'weight', delta: number) => {
    setForm((f) => {
      const cur = parseFloat(f[field]) || 0;
      const step = field === 'weight' ? weightStep : 1;
      return { ...f, [field]: String(Math.max(0, +(cur + delta * step).toFixed(1))) };
    });
  };

  // ── Exercise form ──────────────────────────────────────────────────────────────
  const openAddCustom = () => {
    setEditingExercise(null);
    setForm({ name: '', sets: '3', reps: '10', weight: '0', videoUrl: '', notes: '' });
    setCustomModal(true);
  };
  const openEdit = (ex: Exercise) => {
    setEditingExercise(ex);
    setForm({ name: ex.name, sets: String(ex.sets), reps: String(ex.reps), weight: String(toDisplayWeight(ex.weight)), videoUrl: ex.videoUrl ?? '', notes: ex.notes ?? '' });
    setCustomModal(true);
  };
  const saveCustom = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Please enter exercise name'); return; }
    const wKg = toKg(parseFloat(form.weight) || 0);
    const updated = { name: form.name, sets: parseInt(form.sets) || 3, reps: parseInt(form.reps) || 10, weight: wKg, videoUrl: form.videoUrl, notes: form.notes };
    if (openRoutineId) {
      const r = routines.find((x) => x.id === openRoutineId)!;
      const exs = [...r.exercises];
      if (editingExercise) { const i = exs.findIndex((e) => e.id === editingExercise.id); if (i !== -1) exs[i] = { ...exs[i], ...updated }; }
      else exs.push({ id: `custom_${Date.now()}`, ...updated });
      await saveRoutineExercises(openRoutineId, exs);
    } else {
      const exs = [...(workouts[selectedDay] ?? [])];
      if (editingExercise) { const i = exs.findIndex((e) => e.id === editingExercise.id); if (i !== -1) exs[i] = { ...exs[i], ...updated }; }
      else exs.push({ id: `custom_${Date.now()}`, ...updated });
      await saveScheduleDay(selectedDay, exs);
    }
    setCustomModal(false);
  };

  const deleteExercise = (ex: Exercise) => {
    const msg = openRoutineId ? `Remove "${ex.name}"?` : `Remove "${ex.name}" from ${selectedDay}?`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        if (openRoutineId) {
          const r = routines.find((x) => x.id === openRoutineId)!;
          saveRoutineExercises(openRoutineId, r.exercises.filter((e) => e.id !== ex.id));
        } else {
          saveScheduleDay(selectedDay, (workouts[selectedDay] ?? []).filter((e) => e.id !== ex.id));
        }
      }
    } else {
      Alert.alert('Remove Exercise', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => {
          if (openRoutineId) {
            const r = routines.find((x) => x.id === openRoutineId)!;
            await saveRoutineExercises(openRoutineId, r.exercises.filter((e) => e.id !== ex.id));
          } else {
            await saveScheduleDay(selectedDay, (workouts[selectedDay] ?? []).filter((e) => e.id !== ex.id));
          }
        }},
      ]);
    }
  };

  // ── Library ────────────────────────────────────────────────────────────────────
  const openLibrary = (target: 'schedule' | string) => {
    setLibraryTarget(target); setSelectedCategory('All'); setLibrarySearch(''); setLibraryModal(true);
  };
  const addFromLibrary = async (libEx: typeof EXERCISE_LIBRARY[0]) => {
    const newEx = { id: `lib_${Date.now()}`, name: libEx.name, sets: libEx.sets, reps: libEx.reps, weight: libEx.weight, videoUrl: libEx.videoUrl, notes: libEx.notes, category: libEx.category };
    if (libraryTarget !== 'schedule') {
      const r = routines.find((x) => x.id === libraryTarget)!;
      await saveRoutineExercises(libraryTarget, [...r.exercises, newEx]);
    } else {
      await saveScheduleDay(selectedDay, [...(workouts[selectedDay] ?? []), newEx]);
    }
    setLibraryModal(false);
  };
  const filteredLibrary = EXERCISE_LIBRARY.filter((e) =>
    (selectedCategory === 'All' || e.category === selectedCategory) &&
    e.name.toLowerCase().includes(librarySearch.toLowerCase())
  );

  // ── Derived ────────────────────────────────────────────────────────────────────
  const topPad      = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const todayExs    = workouts[selectedDay] ?? [];
  const totalSets   = todayExs.reduce((a, e) => a + e.sets, 0);
  const openRoutine = routines.find((r) => r.id === openRoutineId) ?? null;
  const sessionExs  = workouts[sessionDay] ?? [];
  const totalSessionSets = sessionExs.reduce((a, e) => a + e.sets, 0);
  const sessionPct  = totalSessionSets > 0 ? Math.round((completedSets.size / totalSessionSets) * 100) : 0;
  const sessionAllDone = totalSessionSets > 0 && completedSets.size >= totalSessionSets;

  // Planning exercise card
  const PlanCard = ({ item }: { item: Exercise }) => (
    <View style={styles.exCard}>
      <View style={styles.exCardLeft}>
        {item.category ? <View style={[styles.exCatBar, { backgroundColor: CATEGORY_COLORS[item.category] ?? colors.light.primary }]} /> : null}
        <View style={styles.exMeta}>
          <Text style={styles.exName}>{item.name}</Text>
          <View style={styles.exChips}>
            <View style={styles.chip}><Text style={styles.chipText}>{item.sets} sets</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>{item.reps} reps</Text></View>
            {item.weight > 0
              ? <View style={[styles.chip, styles.chipAccent]}><Text style={styles.chipAccentText}>{weightUnit === 'lbs' ? `${+(item.weight * 2.20462).toFixed(1)}lbs` : `${item.weight}kg`}</Text></View>
              : <View style={styles.chip}><Text style={styles.chipText}>Bodyweight</Text></View>}
          </View>
          {item.notes ? <Text style={styles.exNotes}>{item.notes}</Text> : null}
        </View>
      </View>
      <View style={styles.exActions}>
        {item.videoUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(item.videoUrl!)} activeOpacity={0.7}>
            <MaterialIcons name="play-circle-outline" size={22} color="#f15e6c" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => openEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="edit-2" size={17} color={colors.light.gray600} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteExercise(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="trash-2" size={17} color={colors.light.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {tab === 'schedule' ? 'Workout Planner' : openRoutine ? openRoutine.name : 'Routines'}
            </Text>
            <Text style={styles.headerSub}>
              {tab === 'schedule'
                ? todayExs.length > 0 ? `${todayExs.length} exercises · ${totalSets} sets` : 'No exercises planned'
                : openRoutine ? `${openRoutine.exercises.length} exercises` : `${routines.length} routine${routines.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.addFab}
            onPress={() => { if (tab === 'schedule') openAddCustom(); else if (openRoutine) openAddCustom(); else setNewRoutineStep('picker'); }}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add" size={24} color={colors.light.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['schedule', 'routines'] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => { setTab(t); setOpenRoutineId(null); }} activeOpacity={0.8}>
              <MaterialIcons name={t === 'schedule' ? 'calendar-today' : 'fitness-center'} size={14} color={tab === t ? colors.light.primaryForeground : colors.light.gray600} />
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>{t === 'schedule' ? 'Schedule' : 'Routines'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Day pills */}
        {tab === 'schedule' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
            {WEEKDAYS_FULL.map((day, i) => {
              const hasPlan = (workouts[day]?.length ?? 0) > 0;
              const isSel = selectedDay === day;
              return (
                <TouchableOpacity key={day} style={[styles.dayPill, isSel && styles.dayPillActive]} onPress={() => setSelectedDay(day)} activeOpacity={0.75}>
                  <Text style={[styles.dayPillText, isSel && styles.dayPillTextActive]}>{WEEKDAYS_SHORT[i]}</Text>
                  {hasPlan && <View style={[styles.dayDot, isSel && styles.dayDotActive]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Back button in routine detail */}
        {tab === 'routines' && openRoutine && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setOpenRoutineId(null)} activeOpacity={0.8}>
            <Feather name="arrow-left" size={16} color={colors.light.gray700} />
            <Text style={styles.backBtnText}>All Routines</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ══ SCHEDULE ══ */}
      {tab === 'schedule' && (
        <FlatList
          data={todayExs} keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {todayExs.length > 0 && (
                <TouchableOpacity style={styles.startWorkoutBanner} onPress={() => startWorkout(selectedDay)} activeOpacity={0.85}>
                  <View style={styles.startWorkoutBannerLeft}>
                    <View style={styles.startWorkoutIconWrap}>
                      <Feather name="play" size={18} color={colors.light.primaryForeground} />
                    </View>
                    <View>
                      <Text style={styles.startWorkoutBannerTitle}>Start Workout</Text>
                      <Text style={styles.startWorkoutBannerSub}>{todayExs.length} exercises · {totalSets} sets</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.light.primaryForeground} />
                </TouchableOpacity>
              )}
              <View style={styles.listHeader}>
                <TouchableOpacity style={styles.libraryBtn} onPress={() => openLibrary('schedule')} activeOpacity={0.8}>
                  <MaterialIcons name="library-books" size={16} color={colors.light.success} />
                  <Text style={styles.libraryBtnText}>Browse Exercise Library</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><MaterialIcons name="fitness-center" size={32} color={colors.light.gray400} /></View>
              <Text style={styles.emptyTitle}>Rest day or plan ahead</Text>
              <Text style={styles.emptySub}>Add exercises from the library or tap +</Text>
            </View>
          }
          renderItem={({ item }) => <PlanCard item={item} />}
        />
      )}

      {/* ══ ROUTINES LIST ══ */}
      {tab === 'routines' && !openRoutine && (
        <FlatList
          data={routines} keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><MaterialIcons name="playlist-add" size={32} color={colors.light.gray400} /></View>
              <Text style={styles.emptyTitle}>No routines yet</Text>
              <Text style={styles.emptySub}>Tap + to create a routine or pick a preset</Text>
            </View>
          }
          renderItem={({ item }) => {
            const muscles = [...new Set(item.exercises.map((e) => e.category).filter(Boolean))] as string[];
            return (
              <View style={styles.routineCard}>
                <TouchableOpacity style={styles.routineCardMain} onPress={() => setOpenRoutineId(item.id)} activeOpacity={0.85}>
                  <View style={styles.routineIconWrap}>
                    <Image source={GYM_LOGO} style={styles.routineLogo} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routineName}>{item.name}</Text>
                    <Text style={styles.routineMeta}>{item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}</Text>
                    {muscles.length > 0 && (
                      <View style={styles.muscleTags}>
                        {muscles.map((m) => (
                          <View key={m} style={[styles.muscleTag, { backgroundColor: CATEGORY_COLORS[m] + '33' }]}>
                            <View style={[styles.muscleTagDot, { backgroundColor: CATEGORY_COLORS[m] }]} />
                            <Text style={[styles.muscleTagText, { color: CATEGORY_COLORS[m] }]}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.routineCardActions}>
                  <TouchableOpacity style={styles.addBtn} onPress={() => openSchedPicker(item.exercises, item.name)} activeOpacity={0.8}>
                    <MaterialIcons name="add" size={15} color={colors.light.primaryForeground} />
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteRoutine(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="trash-2" size={16} color={colors.light.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ══ ROUTINE DETAIL ══ */}
      {tab === 'routines' && openRoutine && (
        <FlatList
          data={openRoutine.exercises} keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <TouchableOpacity style={styles.addToScheduleBtn} onPress={() => openSchedPicker(openRoutine.exercises, openRoutine.name)} activeOpacity={0.85}>
                <MaterialIcons name="add" size={16} color={colors.light.primaryForeground} />
                <Text style={styles.addToScheduleBtnText}>Add to Schedule</Text>
              </TouchableOpacity>
              <View style={styles.listHeader}>
                <TouchableOpacity style={styles.libraryBtn} onPress={() => openLibrary(openRoutine.id)} activeOpacity={0.8}>
                  <MaterialIcons name="library-books" size={16} color={colors.light.success} />
                  <Text style={styles.libraryBtnText}>Browse Exercise Library</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><MaterialIcons name="add-circle-outline" size={32} color={colors.light.gray400} /></View>
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.emptySub}>Add exercises from the library or tap +</Text>
            </View>
          }
          renderItem={({ item }) => <PlanCard item={item} />}
        />
      )}

      {/* ══════════ MODALS ══════════ */}

      {/* ── WORKOUT SESSION (full screen) ── */}
      <Modal visible={sessionVisible} animationType="slide" onRequestClose={closeSession}>
        <View style={[sS.container, { backgroundColor: colors.light.background }]}>

          {/* Session header */}
          <View style={[sS.header, { paddingTop: topPad + 16 }]}>
            <TouchableOpacity onPress={closeSession} style={sS.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={20} color={colors.light.gray700} />
            </TouchableOpacity>

            <View style={sS.headerCenter}>
              <Text style={sS.dayTitle}>{sessionDay}</Text>
              <Text style={sS.setProgress}>{completedSets.size} / {totalSessionSets} sets done</Text>
            </View>

            {/* Overall workout stopwatch */}
            <View style={sS.stopwatch}>
              <Feather name="clock" size={12} color={colors.light.mutedForeground} />
              <Text style={sS.stopwatchTime}>{fmtSeconds(workoutElapsed)}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={sS.progressBg}>
            <View style={[sS.progressFill, { width: `${sessionPct}%` }]} />
          </View>

          {/* Active rest banner (pinned below progress bar) */}
          {activeRestKey && (
            <View style={sS.restBanner}>
              <View style={sS.restBannerLeft}>
                <MaterialIcons name="timer" size={18} color={colors.light.primary} />
                <View>
                  <Text style={sS.restBannerLabel}>Rest Timer</Text>
                  <Text style={sS.restBannerTime}>{fmtSeconds(restRemaining)}</Text>
                </View>
              </View>
              <View style={sS.restBannerRight}>
                {/* circular-ish countdown ring using a View trick */}
                <View style={sS.restRing}>
                  <Text style={sS.restRingText}>{restRemaining}</Text>
                </View>
                <TouchableOpacity style={sS.skipBtn} onPress={skipRest} activeOpacity={0.8}>
                  <Text style={sS.skipBtnText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Rest timer settings shortcut */}
          <View style={sS.sessionToolbar}>
            <TouchableOpacity style={sS.restSettingBtn} onPress={() => setRestSettingsVisible(true)} activeOpacity={0.8}>
              <MaterialIcons name="timer" size={15} color={colors.light.mutedForeground} />
              <Text style={sS.restSettingBtnText}>Rest: {restDuration >= 60 ? `${restDuration / 60}m` : `${restDuration}s`}</Text>
              <Feather name="settings" size={13} color={colors.light.gray500} />
            </TouchableOpacity>
            {sessionAllDone && (
              <View style={sS.allDoneTag}>
                <Feather name="star" size={12} color={colors.light.primary} />
                <Text style={sS.allDoneTagText}>All done!</Text>
              </View>
            )}
          </View>

          {/* Exercise list — per-set cards */}
          <FlatList
            data={sessionExs}
            keyExtractor={(i) => i.id}
            contentContainerStyle={sS.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No exercises for {sessionDay}</Text>
                <Text style={styles.emptySub}>Add exercises to this day first</Text>
              </View>
            }
            renderItem={({ item }) => (
              <ExerciseSession
                item={item}
                completedSets={completedSets}
                onSetToggle={handleSetToggle}
                restDuration={restDuration}
                activeRestKey={activeRestKey}
                restRemaining={restRemaining}
              />
            )}
          />

          {/* Footer: finish button */}
          <View style={[sS.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 24 : 32) }]}>
            <TouchableOpacity
              style={[sS.finishBtn, sessionAllDone && sS.finishBtnDone]}
              onPress={finishWorkout}
              activeOpacity={0.85}
            >
              <Feather name={sessionAllDone ? 'check-circle' : 'flag'} size={18} color={colors.light.primaryForeground} />
              <Text style={sS.finishBtnText}>
                {sessionAllDone ? 'All Done! Finish Workout' : `Finish Workout · ${completedSets.size}/${totalSessionSets} sets`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Rest timer settings ── */}
      <RestTimerSettings
        visible={restSettingsVisible}
        duration={restDuration}
        onClose={() => setRestSettingsVisible(false)}
        onChange={(d) => setRestDuration(d)}
      />

      {/* ── Add to schedule day-picker ── */}
      <Modal visible={schedPickerVisible} transparent animationType="slide" onRequestClose={() => setSchedPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Add to Schedule</Text>
            <Text style={styles.modalSubtitle}>
              Which day for{pendingScheduleRef.current ? ` "${pendingScheduleRef.current.name}"` : ' this routine'}?
            </Text>
            <View style={styles.dayGrid}>
              {WEEKDAYS_FULL.map((day, i) => {
                const hasPlan = (workouts[day]?.length ?? 0) > 0;
                const isSel = schedPickerDay === day;
                return (
                  <TouchableOpacity key={day} style={[styles.dayGridBtn, isSel && styles.dayGridBtnActive]} onPress={() => setSchedPickerDay(day)} activeOpacity={0.75}>
                    <Text style={[styles.dayGridText, isSel && styles.dayGridTextActive]}>{WEEKDAYS_SHORT[i]}</Text>
                    {hasPlan && <View style={[styles.dayGridDot, isSel && styles.dayGridDotActive]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            {(workouts[schedPickerDay]?.length ?? 0) > 0 && (
              <View style={styles.dayNote}>
                <Feather name="alert-circle" size={13} color={colors.light.error} />
                <Text style={styles.dayNoteText}>{schedPickerDay} already has {workouts[schedPickerDay]?.length} exercise{workouts[schedPickerDay]?.length !== 1 ? 's' : ''} — they will be replaced</Text>
              </View>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSchedPickerVisible(false)} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmSchedule} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>Add to {schedPickerDay}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── New routine: type picker ── */}
      <Modal visible={newRoutineStep === 'picker'} transparent animationType="slide" onRequestClose={() => setNewRoutineStep('idle')}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>New Routine</Text>
            <Text style={styles.modalSubtitle}>How do you want to start?</Text>
            <TouchableOpacity style={styles.routineTypeCard} onPress={() => setNewRoutineStep('preset-list')} activeOpacity={0.85}>
              <View style={[styles.routineTypeIcon, { backgroundColor: 'rgba(235,192,105,0.15)' }]}>
                <Image source={GYM_LOGO} style={{ width: 28, height: 28 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineTypeTitle}>Use a Preset</Text>
                <Text style={styles.routineTypeSub}>Push Day, Pull Day, Leg Day &amp; more</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.light.gray500} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.routineTypeCard} onPress={() => setNewRoutineStep('custom')} activeOpacity={0.85}>
              <View style={[styles.routineTypeIcon, { backgroundColor: 'rgba(29,185,84,0.12)' }]}>
                <Feather name="edit-3" size={22} color={colors.light.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineTypeTitle}>Start from Scratch</Text>
                <Text style={styles.routineTypeSub}>Name it and build your own exercise list</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.light.gray500} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewRoutineStep('idle')} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── New routine: custom name ── */}
      <Modal visible={newRoutineStep === 'custom'} transparent animationType="slide" onRequestClose={() => setNewRoutineStep('picker')}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Name Your Routine</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Push Day, Monday Grind…" placeholderTextColor={colors.light.gray500} value={newRoutineName} onChangeText={setNewRoutineName} autoFocus />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewRoutineStep('picker')} activeOpacity={0.8}><Text style={styles.cancelBtnText}>Back</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createCustomRoutine} activeOpacity={0.8}><Text style={styles.saveBtnText}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── New routine: preset list ── */}
      <Modal visible={newRoutineStep === 'preset-list'} transparent animationType="slide" onRequestClose={() => setNewRoutineStep('picker')}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '88%' }]}>
            <View style={styles.sheetHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.modalTitle}>Choose a Preset</Text>
              <TouchableOpacity onPress={() => setNewRoutineStep('picker')}><Feather name="x" size={20} color={colors.light.gray600} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Tap to preview. You'll pick a schedule day after adding.</Text>
            <FlatList
              data={PRESET_ROUTINES} keyExtractor={(i) => i.name}
              showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}
              renderItem={({ item }) => {
                const isSelected = selectedPreset?.name === item.name;
                return (
                  <View>
                    <TouchableOpacity
                      style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                      onPress={() => setSelectedPreset(isSelected ? null : item)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.presetLogoWrap, { backgroundColor: item.color + '22', borderColor: item.color + '55' }]}>
                        <Image source={GYM_LOGO} style={styles.presetLogo} resizeMode="contain" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.presetName}>{item.name}</Text>
                        <Text style={styles.presetDesc}>{item.description}</Text>
                        <Text style={styles.presetCount}>{item.exerciseIds.length} exercises</Text>
                      </View>
                      <View style={[styles.presetCheck, isSelected && styles.presetCheckSelected]}>
                        {isSelected && <Feather name="check" size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                    {isSelected && (
                      <View style={styles.presetExList}>
                        {item.exerciseIds.map((libId) => {
                          const ex = fromLib(libId);
                          return (
                            <View key={libId} style={styles.presetExRow}>
                              <View style={[styles.presetExDot, { backgroundColor: CATEGORY_COLORS[ex.category] ?? colors.light.primary }]} />
                              <Text style={styles.presetExName}>{ex.name}</Text>
                              <Text style={styles.presetExDetail}>{ex.sets}×{ex.reps}{ex.weight > 0 ? ` · ${ex.weight}kg` : ''}</Text>
                            </View>
                          );
                        })}
                        <TouchableOpacity style={styles.addPresetBtn} onPress={createPresetRoutine} activeOpacity={0.85}>
                          <MaterialIcons name="add" size={16} color={colors.light.primaryForeground} />
                          <Text style={styles.addPresetBtnText}>Add "{item.name}" to My Routines</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── Exercise form ── */}
      <Modal visible={customModal} transparent animationType="slide" onRequestClose={() => setCustomModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}>
            <View style={styles.modalSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.modalTitle}>{editingExercise ? 'Edit Exercise' : 'New Exercise'}</Text>
              <TextInput style={styles.modalInput} placeholder="Exercise name" placeholderTextColor={colors.light.gray500} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
              <StepperRow label="SETS" value={form.sets} onDecrement={() => stepField('sets', -1)} onIncrement={() => stepField('sets', 1)} onChangeText={(v) => setForm((f) => ({ ...f, sets: v }))} />
              <StepperRow label="REPS" value={form.reps} onDecrement={() => stepField('reps', -1)} onIncrement={() => stepField('reps', 1)} onChangeText={(v) => setForm((f) => ({ ...f, reps: v }))} />
              <View style={styles.stepperCard}>
                <View style={styles.stepperCardHeader}>
                  <Text style={styles.stepperLabel}>WEIGHT</Text>
                  <View style={styles.unitToggle}>
                    <TouchableOpacity style={[styles.unitBtn, weightUnit === 'kg' && styles.unitBtnActive]} onPress={() => { if (weightUnit === 'lbs') { setForm((f) => ({ ...f, weight: String(+(parseFloat(f.weight) / 2.20462).toFixed(1)) })); setWeightUnit('kg'); } }} activeOpacity={0.8}><Text style={[styles.unitBtnText, weightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.unitBtn, weightUnit === 'lbs' && styles.unitBtnActive]} onPress={() => { if (weightUnit === 'kg') { setForm((f) => ({ ...f, weight: String(+(parseFloat(f.weight) * 2.20462).toFixed(1)) })); setWeightUnit('lbs'); } }} activeOpacity={0.8}><Text style={[styles.unitBtnText, weightUnit === 'lbs' && styles.unitBtnTextActive]}>lbs</Text></TouchableOpacity>
                  </View>
                </View>
                <View style={styles.stepperInner}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => stepField('weight', -1)} activeOpacity={0.7}><Feather name="minus" size={18} color={colors.light.gray700} /></TouchableOpacity>
                  <View style={styles.stepValueWrap}><TextInput style={styles.stepValue} keyboardType="numeric" value={form.weight} onChangeText={(v) => setForm((f) => ({ ...f, weight: v }))} textAlign="center" /></View>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => stepField('weight', 1)} activeOpacity={0.7}><Feather name="plus" size={18} color={colors.light.primary} /></TouchableOpacity>
                </View>
              </View>
              <TextInput style={[styles.modalInput, { marginTop: 12 }]} placeholder="YouTube URL (optional)" placeholderTextColor={colors.light.gray500} value={form.videoUrl} onChangeText={(v) => setForm((f) => ({ ...f, videoUrl: v }))} autoCapitalize="none" />
              <TextInput style={styles.modalInput} placeholder="Notes (optional)" placeholderTextColor={colors.light.gray500} value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCustomModal(false)} activeOpacity={0.8}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveCustom} activeOpacity={0.8}><Text style={styles.saveBtnText}>Save Exercise</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Exercise library (SCROLLABLE) ── */}
      <Modal visible={libraryModal} transparent animationType="slide" onRequestClose={() => setLibraryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <ScrollView 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.sheetHandle} />
              <View style={styles.libHeader}>
                <Text style={styles.modalTitle}>Exercise Library</Text>
                <TouchableOpacity onPress={() => setLibraryModal(false)}>
                  <Feather name="x" size={20} color={colors.light.gray600} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.libAddingTo}>
                Adding to <Text style={{ color: colors.light.primary }}>
                  {libraryTarget === 'schedule' ? selectedDay : (routines.find((r) => r.id === libraryTarget)?.name ?? 'Routine')}
                </Text>
              </Text>
              
              {/* Search bar */}
              <View style={styles.searchWrap}>
                <Feather name="search" size={15} color={colors.light.gray500} style={{ marginRight: 8 }} />
                <TextInput 
                  style={styles.searchInput} 
                  placeholder="Search exercises…" 
                  placeholderTextColor={colors.light.gray500} 
                  value={librarySearch} 
                  onChangeText={setLibrarySearch} 
                />
                {librarySearch ? (
                  <TouchableOpacity onPress={() => setLibrarySearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x-circle" size={15} color={colors.light.gray500} />
                  </TouchableOpacity>
                ) : null}
              </View>
              
              {/* Category chips - horizontal scroll */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.catRow}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.catChip, selectedCategory === cat && styles.catChipActive]} 
                    onPress={() => setSelectedCategory(cat)} 
                    activeOpacity={0.7}
                  >
                    {cat !== 'All' && <View style={[styles.catChipDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />}
                    <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.libCount}>
                {filteredLibrary.length} exercise{filteredLibrary.length !== 1 ? 's' : ''}
              </Text>
              
              {/* Exercise list */}
              {filteredLibrary.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.libItem} 
                  onPress={() => addFromLibrary(item)} 
                  activeOpacity={0.75}
                >
                  <View style={[styles.libCatDot, { backgroundColor: CATEGORY_COLORS[item.category] ?? colors.light.primary }]} />
                  <View style={styles.libInfo}>
                    <Text style={styles.libName}>{item.name}</Text>
                    <Text style={styles.libDetail}>
                      {item.category} · {item.sets}×{item.reps}{item.weight > 0 ? ` · ${item.weight}kg` : ' · Bodyweight'}
                    </Text>
                  </View>
                  <View style={styles.libAddBtn}>
                    <MaterialIcons name="add" size={18} color={colors.light.success} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Session styles ───────────────────────────────────────────────────────────
const sS = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.light.border, gap: 12 },
  closeBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.light.secondary, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  dayTitle:     { fontSize: 20, fontWeight: '800', color: colors.light.gray900 },
  setProgress:  { fontSize: 13, color: colors.light.mutedForeground, marginTop: 2 },
  stopwatch:    { alignItems: 'center', gap: 2 },
  stopwatchTime:{ fontSize: 16, fontWeight: '900', color: colors.light.primary, fontVariant: ['tabular-nums'] as any },
  progressBg:   { height: 4, backgroundColor: colors.light.secondary },
  progressFill: { height: 4, backgroundColor: colors.light.primary },
  restBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(235,192,105,0.1)', borderBottomWidth: 1, borderBottomColor: 'rgba(235,192,105,0.25)',
  },
  restBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  restBannerLabel: { fontSize: 11, fontWeight: '700', color: colors.light.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.8 },
  restBannerTime:  { fontSize: 28, fontWeight: '900', color: colors.light.primary, lineHeight: 32, fontVariant: ['tabular-nums'] as any },
  restBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  restRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: colors.light.primary, backgroundColor: 'rgba(235,192,105,0.1)', justifyContent: 'center', alignItems: 'center' },
  restRingText: { fontSize: 14, fontWeight: '900', color: colors.light.primary },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border },
  skipBtnText: { fontSize: 13, fontWeight: '700', color: colors.light.gray700 },
  sessionToolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  restSettingBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.light.secondary, borderRadius: 8, borderWidth: 1, borderColor: colors.light.border },
  restSettingBtnText: { fontSize: 12, fontWeight: '700', color: colors.light.gray700 },
  allDoneTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(235,192,105,0.12)', borderRadius: 8 },
  allDoneTagText: { fontSize: 12, fontWeight: '700', color: colors.light.primary },
  list:   { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.light.background, borderTopWidth: 1, borderTopColor: colors.light.border },
  finishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.light.gray600, borderRadius: 14, paddingVertical: 16 },
  finishBtnDone: { backgroundColor: colors.light.success },
  finishBtnText: { fontSize: 16, fontWeight: '800', color: colors.light.primaryForeground },
});

// ─── Shared styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.light.background },
  header:      { backgroundColor: colors.light.background, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14, gap: 10 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.light.gray900 },
  headerSub:   { fontSize: 13, color: colors.light.mutedForeground, marginTop: 3 },
  addFab:      { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  tabRow:      { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: colors.light.secondary, borderRadius: 10, padding: 3, gap: 3, borderWidth: 1, borderColor: colors.light.border },
  tabBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  tabBtnActive:     { backgroundColor: colors.light.primary },
  tabBtnText:       { fontSize: 13, fontWeight: '700', color: colors.light.gray600 },
  tabBtnTextActive: { color: colors.light.primaryForeground },
  dayScrollContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  dayPill:      { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, alignItems: 'center' },
  dayPillActive:{ backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  dayPillText:  { fontSize: 12, fontWeight: '700', color: colors.light.gray600, letterSpacing: 0.5 },
  dayPillTextActive: { color: colors.light.primaryForeground },
  dayDot:       { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.light.primary, marginTop: 4 },
  dayDotActive: { backgroundColor: colors.light.primaryForeground },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 10 },
  backBtnText:  { fontSize: 13, fontWeight: '600', color: colors.light.gray700 },
  list:         { paddingTop: 8, paddingHorizontal: 16 },
  listHeader:   { marginBottom: 8 },
  startWorkoutBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.light.primary, borderRadius: 14, padding: 16, marginBottom: 12 },
  startWorkoutBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  startWorkoutIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  startWorkoutBannerTitle: { fontSize: 17, fontWeight: '800', color: colors.light.primaryForeground },
  startWorkoutBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  exCard:      { backgroundColor: colors.light.card, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: colors.light.border, overflow: 'hidden' },
  exCardLeft:  { flex: 1, flexDirection: 'row', gap: 10 },
  exCatBar:    { width: 3, borderRadius: 2, minHeight: 40 },
  exMeta:      { flex: 1 },
  exName:      { fontSize: 16, fontWeight: '700', color: colors.light.gray900, marginBottom: 6 },
  exChips:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border },
  chipText:    { fontSize: 12, color: colors.light.gray700, fontWeight: '600' },
  chipAccent:  { backgroundColor: 'rgba(235,192,105,0.15)', borderColor: 'rgba(235,192,105,0.4)' },
  chipAccentText: { fontSize: 12, color: colors.light.primary, fontWeight: '700' },
  exNotes:     { fontSize: 12, color: colors.light.mutedForeground, marginTop: 6, fontStyle: 'italic' },
  exActions:   { flexDirection: 'column', alignItems: 'center', gap: 12, paddingLeft: 10 },
  empty:       { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.light.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: colors.light.gray700 },
  emptySub:    { fontSize: 13, color: colors.light.mutedForeground, textAlign: 'center', paddingHorizontal: 24 },
  libraryBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(29,185,84,0.1)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(29,185,84,0.25)' },
  libraryBtnText: { fontSize: 13, fontWeight: '700', color: colors.light.success },
  routineCard: { flexDirection: 'row', backgroundColor: colors.light.card, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.light.border, overflow: 'hidden' },
  routineCardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  routineCardActions: { justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 14, borderLeftWidth: 1, borderLeftColor: colors.light.border },
  routineIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(235,192,105,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(235,192,105,0.25)' },
  routineLogo: { width: 26, height: 26 },
  routineName: { fontSize: 16, fontWeight: '700', color: colors.light.gray900 },
  routineMeta: { fontSize: 12, color: colors.light.mutedForeground, marginTop: 2 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.light.primary, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  addBtnText:  { fontSize: 12, fontWeight: '700', color: colors.light.primaryForeground },
  addToScheduleBtn: { backgroundColor: colors.light.primary, borderRadius: 12, paddingVertical: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addToScheduleBtnText: { fontSize: 15, fontWeight: '700', color: colors.light.primaryForeground },
  muscleTags:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  muscleTag:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  muscleTagDot: { width: 5, height: 5, borderRadius: 3 },
  muscleTagText: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:  { backgroundColor: colors.light.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetHandle: { width: 36, height: 4, backgroundColor: colors.light.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:  { fontSize: 20, fontWeight: '800', color: colors.light.gray900, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: colors.light.mutedForeground, marginBottom: 16 },
  modalInput:  { borderWidth: 1.5, borderColor: colors.light.border, borderRadius: 10, padding: 13, fontSize: 15, color: colors.light.gray900, backgroundColor: colors.light.secondary, marginBottom: 10 },
  modalBtns:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:   { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: colors.light.secondary },
  saveBtn:     { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center', backgroundColor: colors.light.primary },
  cancelBtnText: { fontWeight: '600', color: colors.light.gray700, fontSize: 15 },
  saveBtnText:   { fontWeight: '700', color: colors.light.primaryForeground, fontSize: 15 },
  dayGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dayGridBtn:  { flex: 1, minWidth: 68, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border, alignItems: 'center' },
  dayGridBtnActive: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  dayGridText: { fontSize: 12, fontWeight: '700', color: colors.light.gray600, letterSpacing: 0.5 },
  dayGridTextActive: { color: colors.light.primaryForeground },
  dayGridDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.light.primary, marginTop: 4 },
  dayGridDotActive: { backgroundColor: colors.light.primaryForeground },
  dayNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(241,94,108,0.08)', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(241,94,108,0.25)' },
  dayNoteText: { flex: 1, fontSize: 12, color: colors.light.mutedForeground },
  routineTypeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.light.secondary, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.light.border },
  routineTypeIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  routineTypeTitle: { fontSize: 15, fontWeight: '700', color: colors.light.gray900, marginBottom: 3 },
  routineTypeSub:   { fontSize: 12, color: colors.light.mutedForeground },
  presetCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.light.secondary, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: colors.light.border },
  presetCardSelected: { borderColor: colors.light.primary, backgroundColor: 'rgba(235,192,105,0.06)' },
  presetLogoWrap: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  presetLogo:  { width: 28, height: 28 },
  presetName:  { fontSize: 15, fontWeight: '700', color: colors.light.gray900, marginBottom: 2 },
  presetDesc:  { fontSize: 12, color: colors.light.mutedForeground },
  presetCount: { fontSize: 11, color: colors.light.primary, fontWeight: '700', marginTop: 3 },
  presetCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.light.border, justifyContent: 'center', alignItems: 'center' },
  presetCheckSelected: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  presetExList: { backgroundColor: colors.light.secondary, borderRadius: 12, padding: 14, marginTop: -4, marginBottom: 8, borderWidth: 1, borderColor: colors.light.border },
  presetExRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  presetExDot: { width: 8, height: 8, borderRadius: 4 },
  presetExName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.light.gray900 },
  presetExDetail: { fontSize: 12, color: colors.light.mutedForeground },
  addPresetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.light.primary, borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  addPresetBtnText: { fontSize: 14, fontWeight: '700', color: colors.light.primaryForeground },
  stepperCard: { backgroundColor: colors.light.secondary, borderRadius: 12, borderWidth: 1, borderColor: colors.light.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  stepperCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepperLabel: { fontSize: 10, fontWeight: '700', color: colors.light.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase' },
  stepperInner: { flexDirection: 'row', alignItems: 'center' },
  stepBtn:     { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.light.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.light.border },
  stepValueWrap: { flex: 1, minWidth: 0 },
  stepValue:   { fontSize: 22, fontWeight: '800', color: colors.light.gray900, textAlign: 'center', width: '100%' },
  unitToggle:  { flexDirection: 'row', gap: 6 },
  unitBtn:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, alignItems: 'center' },
  unitBtnActive: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  unitBtnText: { fontSize: 13, fontWeight: '700', color: colors.light.gray600 },
  unitBtnTextActive: { color: colors.light.primaryForeground },
  libHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  libAddingTo: { fontSize: 13, color: colors.light.mutedForeground, marginBottom: 12 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.light.secondary, borderRadius: 10, borderWidth: 1, borderColor: colors.light.border, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: colors.light.gray900 },
  catRow:      { paddingBottom: 12, gap: 8 },
  catChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border },
  catChipActive: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  catChipDot:  { width: 6, height: 6, borderRadius: 3 },
  catChipText: { fontSize: 11, fontWeight: '600', color: colors.light.gray700 },
  catChipTextActive: { color: colors.light.primaryForeground },
  libCount:    { fontSize: 11, color: colors.light.mutedForeground, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  libList:     { flex: 1 },
  libItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.light.border, gap: 12 },
  libCatDot:   { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  libInfo:     { flex: 1 },
  libName:     { fontSize: 15, fontWeight: '700', color: colors.light.gray900, marginBottom: 2 },
  libDetail:   { fontSize: 12, color: colors.light.mutedForeground },
  libAddBtn:   { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(29,185,84,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(29,185,84,0.25)' },
});