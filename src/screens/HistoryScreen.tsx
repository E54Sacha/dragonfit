import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { dailyTargets, SESSION_TYPES, sportKcalFor, sumEntries } from '../lib/nutrition';
import { useStore } from '../lib/store';
import { Card, Chips, colors, styles, Title } from '../ui';

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** AAAA-MM-JJ pour une date décalée de `offset` jours par rapport à aujourd'hui */
function dateKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function shortLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${DAY_NAMES[new Date(y, m - 1, d).getDay()]} ${d}`;
}

/** Graphique en barres simple, fait avec des View (pas de librairie) */
function BarChart({
  bars,
  height = 140,
  unit,
}: {
  bars: { label: string; value: number; target?: number; color?: string }[];
  height?: number;
  unit: string;
}) {
  const max = Math.max(1, ...bars.map((b) => Math.max(b.value, b.target ?? 0)));
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 6 }}>
        {bars.map((b, i) => (
          <View key={i} style={{ flex: 1, height, justifyContent: 'flex-end' }}>
            {/* Trait de l'objectif */}
            {b.target !== undefined && b.target > 0 && (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: (b.target / max) * height,
                  height: 2,
                  backgroundColor: colors.muted,
                }}
              />
            )}
            <View
              style={{
                height: Math.max(2, (b.value / max) * height),
                backgroundColor: b.color ?? colors.accent,
                borderRadius: 4,
                opacity: b.value === 0 ? 0.25 : 1,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
        {bars.map((b, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 10 }}>{b.value ? Math.round(b.value) : '–'}</Text>
            <Text style={{ color: colors.muted, fontSize: 10 }} numberOfLines={1}>
              {b.label}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.muted, { fontSize: 11, marginTop: 4 }]}>en {unit}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { data } = useStore();

  // --- Calories sur 7 jours ---
  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => dateKey(i - 6)).map((key) => {
      const eaten = sumEntries(data.entries.filter((e) => e.date === key)).kcal;
      const target = dailyTargets(data.profile, sportKcalFor(data.sessions, key)).kcal;
      return { key, eaten, target };
    });
  }, [data]);

  const loggedDays = week.filter((d) => d.eaten > 0);
  const avgEaten = loggedDays.length ? loggedDays.reduce((t, d) => t + d.eaten, 0) / loggedDays.length : 0;
  const avgTarget = loggedDays.length ? loggedDays.reduce((t, d) => t + d.target, 0) / loggedDays.length : 0;

  // --- Progression par exercice ---
  const exercises = useMemo(() => Array.from(new Set(data.sets.map((s) => s.exercise))), [data.sets]);
  const [exercise, setExercise] = useState<string>('');
  const current = exercise || exercises[exercises.length - 1] || '';

  const progression = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const s of data.sets.filter((x) => x.exercise === current)) {
      byDay[s.date] = Math.max(byDay[s.date] ?? 0, s.weightKg);
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8) // 8 dernières séances
      .map(([key, value]) => ({ label: shortLabel(key), value }));
  }, [data.sets, current]);

  const first = progression[0]?.value ?? 0;
  const last = progression[progression.length - 1]?.value ?? 0;

  // --- Historique des séances (jours avec du sport) ---
  const history = useMemo(() => {
    const days = new Set([...data.sessions.map((s) => s.date), ...data.sets.map((s) => s.date)]);
    return Array.from(days)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 14)
      .map((key) => {
        const sessions = data.sessions.filter((s) => s.date === key);
        const sets = data.sets.filter((s) => s.date === key);
        const exNames = Array.from(new Set(sets.map((s) => s.exercise)));
        return {
          key,
          sessions,
          setCount: sets.length,
          exNames,
          kcal: sessions.reduce((t, s) => t + s.kcal, 0),
          minutes: sessions.reduce((t, s) => t + s.durationMin, 0),
        };
      });
  }, [data.sessions, data.sets]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Title>Chroniques</Title>

      <Card>
        <Text style={[styles.text, { fontWeight: '700', marginBottom: 12 }]}>Calories des 7 derniers jours</Text>
        <BarChart
          unit="kcal · trait gris = objectif du jour"
          bars={week.map((d) => ({
            label: shortLabel(d.key).split(' ')[0],
            value: d.eaten,
            target: d.target,
            color: d.eaten > d.target * 1.05 ? colors.danger : colors.accent,
          }))}
        />
        {loggedDays.length > 0 && (
          <Text style={[styles.text, { marginTop: 10 }]}>
            Moyenne : {Math.round(avgEaten)} kcal/jour pour un objectif de {Math.round(avgTarget)}
            {' '}
            <Text style={{ color: avgEaten > avgTarget ? colors.danger : colors.accent }}>
              ({avgEaten > avgTarget ? '+' : ''}
              {Math.round(avgEaten - avgTarget)})
            </Text>
          </Text>
        )}
      </Card>

      <Card>
        <Text style={[styles.text, { fontWeight: '700', marginBottom: 12 }]}>Progression par exercice</Text>
        {exercises.length === 0 ? (
          <Text style={styles.muted}>Enregistre des séries dans l'onglet Séance pour voir ta progression ici.</Text>
        ) : (
          <>
            <Chips options={exercises.map((e) => ({ value: e, label: e }))} value={current} onChange={setExercise} />
            <View style={{ marginTop: 14 }}>
              <BarChart unit="kg · charge max par séance" bars={progression} />
            </View>
            {progression.length >= 2 && (
              <Text style={[styles.text, { marginTop: 10 }]}>
                {last >= first ? '📈' : '📉'} {last - first >= 0 ? '+' : ''}
                {last - first} kg depuis le {progression[0].label}
              </Text>
            )}
          </>
        )}
      </Card>

      <Text style={[styles.text, { fontWeight: '700', marginVertical: 8 }]}>Historique des séances</Text>
      {history.length === 0 && <Text style={styles.muted}>Aucune séance enregistrée pour l'instant.</Text>}
      {history.map((h) => (
        <Card key={h.key}>
          <View style={styles.row}>
            <Text style={[styles.text, { fontWeight: '700' }]}>{shortLabel(h.key)}</Text>
            {h.kcal > 0 && <Text style={{ color: colors.accent }}>+{h.kcal} kcal</Text>}
          </View>
          {h.sessions.map((s) => (
            <Text key={s.id} style={[styles.muted, { marginTop: 4 }]}>
              {SESSION_TYPES[s.type].label} · {s.durationMin} min
            </Text>
          ))}
          {h.setCount > 0 && (
            <Text style={[styles.muted, { marginTop: 4 }]}>
              {h.setCount} séries : {h.exNames.join(', ')}
            </Text>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}
