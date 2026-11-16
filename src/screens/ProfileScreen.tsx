import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { ACTIVITY_FACTORS, bmr, dailyTargets, GOAL_ADJUST, tdee } from '../lib/nutrition';
import { useStore } from '../lib/store';
import { Activity, Goal, Profile, Sex } from '../lib/types';
import { XP_RULES } from '../lib/dragon';
import { Button, Card, Chips, colors, Input, Label, styles, Title } from '../ui';

export default function ProfileScreen() {
  const { data, setProfile } = useStore();
  const [p, setP] = useState<Profile>(data.profile);
  const [age, setAge] = useState(String(p.age));
  const [weight, setWeight] = useState(String(p.weightKg));
  const [height, setHeight] = useState(String(p.heightCm));
  const [saved, setSaved] = useState(false);
  const [dragonName, setDragonName] = useState(p.dragonName ?? '');

  const draft: Profile = {
    ...p,
    age: Number(age) || p.age,
    weightKg: Number(weight.replace(',', '.')) || p.weightKg,
    heightCm: Number(height) || p.heightCm,
    dragonName: dragonName.trim() || undefined,
  };
  const t = dailyTargets(draft);

  const update = (patch: Partial<Profile>) => {
    setP({ ...p, ...patch });
    setSaved(false);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Title>Ton dragon</Title>
      <Card>
        <Label>Nom de ton dragon</Label>
        <Input value={dragonName} onChangeText={(v) => (setDragonName(v), setSaved(false))} placeholder="ex : Braisombre" />
        <Text style={[styles.muted, { marginTop: 10 }]}>
          Il gagne de l'XP grâce à ta régularité : +{XP_RULES.dayLogged} par jour où tu notes tes repas, +
          {XP_RULES.dayOnTarget} si tu es à ±10 % de ton objectif, +{XP_RULES.session} par séance chronométrée, +
          {XP_RULES.set} par série.
        </Text>
      </Card>

      <Text style={[styles.text, { fontWeight: '700', marginVertical: 8 }]}>Ton profil</Text>
      <Card>
        <Label>Sexe</Label>
        <Chips<Sex>
          options={[
            { value: 'homme', label: 'Homme' },
            { value: 'femme', label: 'Femme' },
          ]}
          value={p.sex}
          onChange={(sex) => update({ sex })}
        />
        <Label>Âge</Label>
        <Input value={age} onChangeText={(v) => (setAge(v), setSaved(false))} keyboardType="number-pad" />
        <Label>Poids (kg)</Label>
        <Input value={weight} onChangeText={(v) => (setWeight(v), setSaved(false))} keyboardType="decimal-pad" />
        <Label>Taille (cm)</Label>
        <Input value={height} onChangeText={(v) => (setHeight(v), setSaved(false))} keyboardType="number-pad" />
        <Label>Activité au quotidien (hors sport)</Label>
        <Text style={[styles.muted, { marginBottom: 8 }]}>
          Le sport est ajouté séance par séance avec le chrono de l'onglet Séance.
        </Text>
        <Chips<Activity>
          options={(Object.keys(ACTIVITY_FACTORS) as Activity[]).map((a) => ({ value: a, label: ACTIVITY_FACTORS[a].label }))}
          value={p.activity}
          onChange={(activity) => update({ activity })}
        />
        <Label>Objectif</Label>
        <Chips<Goal>
          options={(Object.keys(GOAL_ADJUST) as Goal[]).map((g) => ({ value: g, label: GOAL_ADJUST[g].label }))}
          value={p.goal}
          onChange={(goal) => update({ goal })}
        />
      </Card>

      <Card>
        <Text style={styles.muted}>Métabolisme de base (Mifflin-St Jeor)</Text>
        <Text style={styles.text}>{Math.round(bmr(draft))} kcal/jour</Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>Dépense totale estimée</Text>
        <Text style={styles.text}>{Math.round(tdee(draft))} kcal/jour</Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>Objectif journalier (sans sport)</Text>
        <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '800' }}>{t.kcal} kcal</Text>
        <Text style={[styles.text, { marginTop: 4 }]}>
          <Text style={{ color: colors.protein }}>P {t.protein} g</Text>
          {'   '}
          <Text style={{ color: colors.carbs }}>G {t.carbs} g</Text>
          {'   '}
          <Text style={{ color: colors.fat }}>L {t.fat} g</Text>
        </Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>
          Ce sont des estimations : ajuste selon l'évolution réelle de ton poids sur 2-3 semaines.
        </Text>
      </Card>

      <Button
        title={saved ? 'Enregistré ✓' : 'Enregistrer'}
        onPress={() => {
          setProfile(draft);
          setSaved(true);
        }}
      />
    </ScrollView>
  );
}
