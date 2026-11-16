import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SESSION_TYPES, sessionKcal, today, uid } from '../lib/nutrition';
import { useStore } from '../lib/store';
import { SessionType } from '../lib/types';
import { Button, Card, Chips, colors, Input, Label, styles } from '../ui';

const TYPE_OPTIONS = (Object.keys(SESSION_TYPES) as SessionType[]).map((t) => ({
  value: t,
  label: SESSION_TYPES[t].label,
}));

/** Affiche une durée en mm:ss ou h:mm:ss */
function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Chrono de séance + calcul des calories dépensées (METs).
 * Le chrono est sauvegardé : tu peux fermer l'appli pendant la séance,
 * il continue de tourner (on stocke l'heure de début, pas le temps écoulé).
 */
export default function SessionCard() {
  const { data, startSession, cancelSession, addSession, removeSession } = useStore();
  const [type, setType] = useState<SessionType>('muscu');
  const [manual, setManual] = useState(false);
  const [manualMin, setManualMin] = useState('');
  const [now, setNow] = useState(Date.now());
  const active = data.activeSession;
  const weight = data.profile.weightKg;

  // Rafraîchit l'affichage du chrono chaque seconde
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const todaySessions = data.sessions.filter((s) => s.date === today());

  // --- Chrono en cours ---
  if (active) {
    const elapsed = now - active.startedAt;
    const minutes = elapsed / 60000;
    const kcal = sessionKcal(active.type, weight, minutes);

    const stop = () => {
      const durationMin = Math.max(1, Math.round(minutes));
      addSession({
        id: uid(),
        date: today(),
        type: active.type,
        durationMin,
        kcal: sessionKcal(active.type, weight, durationMin),
      });
    };

    return (
      <Card style={{ borderColor: colors.accent }}>
        <Text style={styles.muted}>{SESSION_TYPES[active.type].label} en cours</Text>
        <Text style={{ color: colors.text, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {formatElapsed(elapsed)}
        </Text>
        <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '700' }}>≈ {kcal} kcal</Text>
        <Button title="Terminer la séance" onPress={stop} />
        <Button
          title="Annuler"
          variant="ghost"
          onPress={() =>
            Alert.alert('Annuler la séance ?', 'Le chrono sera perdu.', [
              { text: 'Non', style: 'cancel' },
              { text: 'Oui, annuler', style: 'destructive', onPress: cancelSession },
            ])
          }
        />
      </Card>
    );
  }

  // --- Pas de séance en cours ---
  const manualMinutes = parseInt(manualMin, 10) || 0;

  return (
    <Card>
      <Text style={[styles.text, { fontWeight: '700' }]}>Chrono de séance</Text>
      <Label>Type de séance</Label>
      <Chips options={TYPE_OPTIONS} value={type} onChange={setType} />

      {!manual ? (
        <>
          <Button title="🔥 Démarrer le chrono" onPress={() => startSession({ type, startedAt: Date.now() })} />
          <Pressable onPress={() => setManual(true)}>
            <Text style={[styles.muted, { textAlign: 'center', marginTop: 10 }]}>Oublié le chrono ? Saisir la durée</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Label>Durée (minutes)</Label>
          <Input value={manualMin} onChangeText={setManualMin} keyboardType="number-pad" placeholder="ex : 60" />
          {manualMinutes > 0 && (
            <Text style={[styles.muted, { marginTop: 6 }]}>≈ {sessionKcal(type, weight, manualMinutes)} kcal</Text>
          )}
          <Button
            title="Ajouter la séance"
            disabled={manualMinutes <= 0}
            onPress={() => {
              addSession({
                id: uid(),
                date: today(),
                type,
                durationMin: manualMinutes,
                kcal: sessionKcal(type, weight, manualMinutes),
              });
              setManualMin('');
              setManual(false);
            }}
          />
          <Button title="Retour" variant="ghost" onPress={() => setManual(false)} />
        </>
      )}

      {todaySessions.length > 0 && (
        <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
          {todaySessions.map((s) => (
            <Pressable
              key={s.id}
              onLongPress={() =>
                Alert.alert('Supprimer cette séance ?', '', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => removeSession(s.id) },
                ])
              }
            >
              <View style={[styles.row, { marginTop: 4 }]}>
                <Text style={styles.text}>
                  {SESSION_TYPES[s.type].label} · {s.durationMin} min
                </Text>
                <Text style={{ color: colors.accent }}>+{s.kcal} kcal</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={[styles.muted, { marginTop: 10, fontSize: 12 }]}>
        Estimation basée sur les METs (Compendium of Physical Activities), précision ± 20-30 %.
      </Text>
    </Card>
  );
}
