import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { addDays, dailyTargets, dayLabel, forGrams, sportKcalFor, sumEntries, today, uid } from '../lib/nutrition';
import { useStore } from '../lib/store';
import { Meal, MEAL_LABELS } from '../lib/types';
import { Button, Card, colors, ProgressBar, styles, Title } from '../ui';
import DragonCard from './DragonCard';

export default function TodayScreen({
  onAdd,
  date: d,
  onChangeDate,
}: {
  onAdd: () => void;
  date: string;
  onChangeDate: (d: string) => void;
}) {
  const { data, removeEntry, saveMeal, addEntries } = useStore();
  const isToday = d === today();
  const yesterdayEntries = data.entries.filter((e) => e.date === addDays(d, -1));

  const copyYesterday = () =>
    addEntries(yesterdayEntries.map((e) => ({ ...e, id: uid(), date: d })));
  const entries = data.entries.filter((e) => e.date === d);
  const total = sumEntries(entries);
  const sport = sportKcalFor(data.sessions, d);
  const target = dailyTargets(data.profile, sport);
  const remaining = Math.round(target.kcal - total.kcal);

  /** Enregistre un repas du jour pour le rajouter en un clic plus tard */
  const promptSaveMeal = (meal: Meal) => {
    const items = entries.filter((e) => e.meal === meal).map((e) => ({ food: e.food, grams: e.grams }));
    Alert.prompt(
      'Enregistrer ce repas',
      'Donne-lui un nom (ex : « Petit-déj classique »)',
      (name) => {
        if (name?.trim()) saveMeal({ id: uid(), name: name.trim(), items });
      },
      'plain-text',
      MEAL_LABELS[meal]
    );
  };

  const confirmDelete = (id: string, name: string) =>
    Alert.alert('Supprimer ?', name, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeEntry(id) },
    ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Title>Festin du jour</Title>

      {isToday && <DragonCard />}

      {/* Navigation entre les jours */}
      <View style={[styles.row, { marginBottom: 12 }]}>
        <Pressable onPress={() => onChangeDate(addDays(d, -1))} hitSlop={12} style={{ padding: 6 }}>
          <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '800' }}>‹</Text>
        </Pressable>
        <Pressable onPress={() => onChangeDate(today())}>
          <Text style={[styles.text, { fontWeight: '700', fontSize: 17 }]}>{dayLabel(d)}</Text>
        </Pressable>
        <Pressable
          onPress={() => !isToday && onChangeDate(addDays(d, 1))}
          hitSlop={12}
          style={{ padding: 6, opacity: isToday ? 0.2 : 1 }}
        >
          <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '800' }}>›</Text>
        </Pressable>
      </View>

      <Card>
        <View style={styles.row}>
          <View>
            <Text style={{ color: colors.text, fontSize: 36, fontWeight: '800' }}>{Math.round(total.kcal)}</Text>
            <Text style={styles.muted}>sur {target.kcal} kcal</Text>
            {sport > 0 && <Text style={[styles.muted, { color: colors.accent }]}>dont +{sport} kcal de sport</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: remaining >= 0 ? colors.accent : colors.danger, fontSize: 22, fontWeight: '700' }}>
              {Math.abs(remaining)}
            </Text>
            <Text style={styles.muted}>{remaining >= 0 ? 'kcal restantes' : 'kcal en trop'}</Text>
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <ProgressBar value={total.kcal} max={target.kcal} color={colors.accent} />
        </View>

        <Macro label="Protéines" value={total.protein} max={target.protein} color={colors.protein} />
        <Macro label="Glucides" value={total.carbs} max={target.carbs} color={colors.carbs} />
        <Macro label="Lipides" value={total.fat} max={target.fat} color={colors.fat} />
      </Card>

      <Button title="🍖 Ajouter un aliment" onPress={onAdd} />
      {entries.length === 0 && yesterdayEntries.length > 0 && (
        <Button title={`↺ Copier les repas de la veille (${yesterdayEntries.length})`} variant="ghost" onPress={copyYesterday} />
      )}

      {(Object.keys(MEAL_LABELS) as Meal[]).map((meal) => {
        const list = entries.filter((e) => e.meal === meal);
        if (list.length === 0) return null;
        const mealKcal = Math.round(sumEntries(list).kcal);
        return (
          <Card key={meal} style={{ marginTop: 12 }}>
            <View style={styles.row}>
              <Text style={[styles.text, { fontWeight: '700' }]}>{MEAL_LABELS[meal]}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable onPress={() => promptSaveMeal(meal)} hitSlop={8}>
                  <Text style={{ color: colors.accent, fontSize: 13 }}>Enregistrer</Text>
                </Pressable>
                <Text style={styles.muted}>{mealKcal} kcal</Text>
              </View>
            </View>
            {list.map((e) => (
              <Pressable key={e.id} onLongPress={() => confirmDelete(e.id, e.food.name)} style={{ marginTop: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.text} numberOfLines={1}>{e.food.name}</Text>
                    <Text style={styles.muted}>{e.grams} g{e.food.brand ? ` · ${e.food.brand}` : ''}</Text>
                  </View>
                  <Text style={styles.text}>{Math.round(forGrams(e.food.per100g, e.grams).kcal)} kcal</Text>
                </View>
              </Pressable>
            ))}
          </Card>
        );
      })}

      {entries.length > 0 && (
        <Text style={[styles.muted, { textAlign: 'center', marginTop: 8 }]}>Appui long sur un aliment pour le supprimer</Text>
      )}
    </ScrollView>
  );
}

function Macro({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <View style={{ marginTop: 14 }}>
      <View style={[styles.row, { marginBottom: 6 }]}>
        <Text style={styles.text}>{label}</Text>
        <Text style={styles.muted}>
          {Math.round(value)} / {max} g
        </Text>
      </View>
      <ProgressBar value={value} max={max} color={color} />
    </View>
  );
}
