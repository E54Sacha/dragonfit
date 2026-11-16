import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';
import { StoreProvider, useStore } from './src/lib/store';
import AddFoodScreen from './src/screens/AddFoodScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TodayScreen from './src/screens/TodayScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import { colors } from './src/ui';

type Tab = 'today' | 'workout' | 'history' | 'profile';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'today', label: 'Festin', icon: '🍖' },
  { key: 'workout', label: 'Entraînement', icon: '⚔️' },
  { key: 'history', label: 'Chroniques', icon: '📜' },
  { key: 'profile', label: 'Dragon', icon: '🐉' },
];

function Main() {
  const { ready } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [adding, setAdding] = useState(false);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (adding) return <AddFoodScreen onDone={() => setAdding(false)} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === 'today' && <TodayScreen onAdd={() => setAdding(true)} />}
        {tab === 'workout' && <WorkoutScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </View>
      {/* Barre d'onglets en bas */}
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ fontSize: 20, opacity: tab === t.key ? 1 : 0.5 }}>{t.icon}</Text>
            <Text style={{ fontSize: 12, marginTop: 2, color: tab === t.key ? colors.accent : colors.muted }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
        <Main />
      </SafeAreaView>
    </StoreProvider>
  );
}
