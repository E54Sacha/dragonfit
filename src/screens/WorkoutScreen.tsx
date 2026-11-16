import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { today, uid } from '../lib/nutrition';
import { useStore } from '../lib/store';
import { Button, Card, colors, Input, Label, styles, Title } from '../ui';
import SessionCard from './SessionCard';

export default function WorkoutScreen() {
  const { data, addSet, removeSet } = useStore();
  const [exercise, setExercise] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const d = today();

  const todaySets = data.sets.filter((s) => s.date === d);

  // Exercices déjà utilisés, pour les retrouver en un clic
  const known = useMemo(() => Array.from(new Set(data.sets.map((s) => s.exercise))).slice(-8), [data.sets]);

  // Meilleure charge déjà soulevée pour l'exercice en cours (record perso)
  const best = useMemo(() => {
    const list = data.sets.filter((s) => s.exercise.toLowerCase() === exercise.trim().toLowerCase());
    return list.length ? Math.max(...list.map((s) => s.weightKg)) : null;
  }, [data.sets, exercise]);

  const grouped = todaySets.reduce<Record<string, typeof todaySets>>((acc, s) => {
    (acc[s.exercise] ??= []).push(s);
    return acc;
  }, {});

  const volume = todaySets.reduce((t, s) => t + s.reps * s.weightKg, 0);

  const save = () => {
    const r = parseInt(reps, 10);
    const w = Number(weight.replace(',', '.')) || 0;
    if (!exercise.trim() || !r) return;
    addSet({ id: uid(), date: d, exercise: exercise.trim(), reps: r, weightKg: w });
    setReps(''); // on garde l'exercice et la charge pour la série suivante
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Title>Entraînement</Title>

      <SessionCard />

      <Text style={[styles.text, { fontWeight: '700', marginTop: 4, marginBottom: 8 }]}>Séries</Text>

      <Card>
        <Label>Exercice</Label>
        <Input value={exercise} onChangeText={setExercise} placeholder="ex : Développé couché" />
        {known.length > 0 && (
          <View style={[styles.chips, { marginTop: 8 }]}>
            {known.map((k) => (
              <Pressable key={k} onPress={() => setExercise(k)} style={styles.chip}>
                <Text style={styles.chipText}>{k}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {best !== null && <Text style={[styles.muted, { marginTop: 8 }]}>Record : {best} kg</Text>}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Label>Répétitions</Label>
            <Input value={reps} onChangeText={setReps} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Label>Charge (kg)</Label>
            <Input value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
          </View>
        </View>
        <Button title="Ajouter la série" onPress={save} disabled={!exercise.trim() || !reps} />
      </Card>

      {todaySets.length > 0 && (
        <Text style={[styles.muted, { marginBottom: 8 }]}>
          {todaySets.length} séries · volume total {Math.round(volume)} kg
        </Text>
      )}

      {Object.entries(grouped).map(([name, sets]) => (
        <Card key={name}>
          <Text style={[styles.text, { fontWeight: '700' }]}>{name}</Text>
          {sets.map((s, i) => (
            <Pressable
              key={s.id}
              onLongPress={() =>
                Alert.alert('Supprimer cette série ?', '', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => removeSet(s.id) },
                ])
              }
            >
              <View style={[styles.row, { marginTop: 8 }]}>
                <Text style={styles.muted}>Série {i + 1}</Text>
                <Text style={styles.text}>
                  {s.reps} × <Text style={{ color: colors.accent }}>{s.weightKg} kg</Text>
                </Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ))}
    </ScrollView>
  );
}
