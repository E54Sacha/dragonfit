import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActiveSession, AppData, Food, FoodEntry, Profile, SavedMeal, Session, WorkoutSet } from './types';

const KEY = 'fitapp-data-v1';

const DEFAULT_DATA: AppData = {
  profile: { sex: 'homme', age: 21, weightKg: 75, heightCm: 178, activity: 'sedentaire', goal: 'maintien' },
  entries: [],
  sets: [],
  sessions: [],
  activeSession: null,
  favorites: [],
  savedMeals: [],
};

interface Store {
  data: AppData;
  ready: boolean;
  setProfile: (p: Profile) => void;
  addEntry: (e: FoodEntry) => void;
  removeEntry: (id: string) => void;
  addSet: (s: WorkoutSet) => void;
  removeSet: (id: string) => void;
  startSession: (a: ActiveSession) => void;
  cancelSession: () => void;
  addSession: (s: Session) => void; // ajoute une séance et arrête le chrono
  removeSession: (id: string) => void;
  addEntries: (e: FoodEntry[]) => void;
  toggleFavorite: (f: Food) => void;
  saveMeal: (m: SavedMeal) => void;
  removeSavedMeal: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

/** Stocke toutes les données sur le téléphone (pas de serveur pour la V1) */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);

  // Chargement au démarrage
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setData({ ...DEFAULT_DATA, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Sauvegarde à chaque modification
  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data, ready]);

  const store: Store = {
    data,
    ready,
    setProfile: (profile) => setData((d) => ({ ...d, profile })),
    addEntry: (e) => setData((d) => ({ ...d, entries: [...d.entries, e] })),
    removeEntry: (id) => setData((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) })),
    addSet: (s) => setData((d) => ({ ...d, sets: [...d.sets, s] })),
    removeSet: (id) => setData((d) => ({ ...d, sets: d.sets.filter((s) => s.id !== id) })),
    startSession: (activeSession) => setData((d) => ({ ...d, activeSession })),
    cancelSession: () => setData((d) => ({ ...d, activeSession: null })),
    addSession: (s) => setData((d) => ({ ...d, sessions: [...d.sessions, s], activeSession: null })),
    removeSession: (id) => setData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) })),
    addEntries: (list) => setData((d) => ({ ...d, entries: [...d.entries, ...list] })),
    toggleFavorite: (f) =>
      setData((d) => ({
        ...d,
        favorites: d.favorites.some((x) => x.id === f.id)
          ? d.favorites.filter((x) => x.id !== f.id)
          : [...d.favorites, f],
      })),
    saveMeal: (m) => setData((d) => ({ ...d, savedMeals: [...d.savedMeals, m] })),
    removeSavedMeal: (id) => setData((d) => ({ ...d, savedMeals: d.savedMeals.filter((m) => m.id !== id) })),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore doit être utilisé dans StoreProvider');
  return s;
}
