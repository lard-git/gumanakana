import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';
import colors from '../../constants/colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const params = useLocalSearchParams();
  const c = colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : '#181818',
          borderTopWidth: 1,
          borderTopColor: '#282828',
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        initialParams={params}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <MaterialIcons name="home" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="planner"
        initialParams={params}
        options={{
          title: 'Planner',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="dumbbell" tintColor={color} size={24} />
            ) : (
              <MaterialIcons name="fitness-center" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        initialParams={params}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <MaterialIcons name="person" size={24} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
