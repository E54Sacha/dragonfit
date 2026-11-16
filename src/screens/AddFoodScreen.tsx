import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { forGrams, uid } from '../lib/nutrition';
import { getByBarcode, searchFoods } from '../lib/openfoodfacts';
import { useStore } from '../lib/store';
import { Food, Meal, MEAL_LABELS, SavedMeal } from '../lib/types';
import { Button, Card, Chips, colors, Input, Label, styles, Title } from '../ui';

type Mode = 'search' | 'meals' | 'scan' | 'manual' | 'confirm';

/** Repas par défaut selon l'heure */
function guessMeal(): Meal {
  const h = new Date().getHours();
  if (h < 11) return 'petit-dej';
  if (h < 15) return 'dejeuner';
  if (h < 18) return 'collation';
  return 'diner';
}

export default function AddFoodScreen({ onDone, date }: { onDone: () => void; date: string }) {
  const { addEntry } = useStore();
  const [mode, setMode] = useState<Mode>('search');
  const [selected, setSelected] = useState<Food | null>(null);

  const pick = (food: Food) => {
    setSelected(food);
    setMode('confirm');
  };

  if (mode === 'confirm' && selected) {
    return (
      <ConfirmFood
        food={selected}
        onBack={() => setMode('search')}
        onSave={(grams, meal) => {
          addEntry({ id: uid(), date, meal, food: selected, grams });
          onDone();
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={[styles.row, { marginBottom: 4 }]}>
        <Title>Ajouter</Title>
        <Pressable onPress={onDone}>
          <Text style={styles.muted}>Fermer</Text>
        </Pressable>
      </View>
      <Chips
        options={[
          { value: 'search', label: 'Rechercher' },
          { value: 'meals', label: 'Mes repas' },
          { value: 'scan', label: 'Scanner' },
          { value: 'manual', label: 'Saisie manuelle' },
        ]}
        value={mode}
        onChange={(m) => setMode(m as Mode)}
      />
      <View style={{ flex: 1, marginTop: 12 }}>
        {mode === 'search' && <SearchFood onPick={pick} />}
        {mode === 'meals' && <SavedMeals onDone={onDone} date={date} />}
        {mode === 'scan' && <ScanFood onPick={pick} />}
        {mode === 'manual' && <ManualFood onPick={pick} />}
      </View>
    </View>
  );
}

function SearchFood({ onPick }: { onPick: (f: Food) => void }) {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await searchFoods(q.trim());
      setResults(r);
      if (r.length === 0) setError('Aucun résultat. Essaie un autre mot ou la saisie manuelle.');
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Input placeholder="ex : skyr, banane, pâtes complètes" value={q} onChangeText={setQ} onSubmitEditing={run} returnKeyType="search" />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} color={colors.accent} />}
      {!!error && <Text style={[styles.muted, { marginTop: 12 }]}>{error}</Text>}
      {results.length > 0 ? (
        <FlatList
          style={{ marginTop: 12 }}
          data={results}
          keyExtractor={(f, i) => f.id + i}
          renderItem={({ item }) => <FoodRow food={item} onPress={() => onPick(item)} />}
        />
      ) : (
        <QuickPicks favorites={data.favorites} entries={data.entries} onPick={onPick} />
      )}
    </View>
  );
}

/** Favoris + aliments récents, affichés quand on n'a pas encore cherché */
function QuickPicks({
  favorites,
  entries,
  onPick,
}: {
  favorites: Food[];
  entries: { food: Food }[];
  onPick: (f: Food) => void;
}) {
  // 10 derniers aliments utilisés, sans doublons et hors favoris
  const recents = useMemo(() => {
    const seen = new Set(favorites.map((f) => f.id));
    const out: Food[] = [];
    for (let i = entries.length - 1; i >= 0 && out.length < 10; i--) {
      const f = entries[i].food;
      if (!seen.has(f.id)) {
        seen.add(f.id);
        out.push(f);
      }
    }
    return out;
  }, [favorites, entries]);

  if (favorites.length === 0 && recents.length === 0) {
    return (
      <Text style={[styles.muted, { marginTop: 16 }]}>
        Astuce : appuie sur ☆ quand tu ajoutes un aliment pour le mettre en favori. Tes favoris et tes aliments récents
        apparaîtront ici.
      </Text>
    );
  }

  return (
    <ScrollView style={{ marginTop: 12 }} keyboardShouldPersistTaps="handled">
      {favorites.length > 0 && <Label>★ Favoris</Label>}
      {favorites.map((f) => (
        <FoodRow key={'fav' + f.id} food={f} onPress={() => onPick(f)} />
      ))}
      {recents.length > 0 && <Label>Récents</Label>}
      {recents.map((f) => (
        <FoodRow key={'rec' + f.id} food={f} onPress={() => onPick(f)} />
      ))}
    </ScrollView>
  );
}

/** Repas enregistrés : un clic ajoute tous les aliments au repas choisi */
function SavedMeals({ onDone, date }: { onDone: () => void; date: string }) {
  const { data, addEntries, removeSavedMeal } = useStore();

  const addMeal = (m: SavedMeal) => {
    const add = (meal: Meal) => {
      addEntries(m.items.map((it) => ({ id: uid(), date, meal, food: it.food, grams: it.grams })));
      onDone();
    };
    Alert.alert(`Ajouter « ${m.name} »`, 'À quel repas ?', [
      ...(Object.keys(MEAL_LABELS) as Meal[]).map((meal) => ({ text: MEAL_LABELS[meal], onPress: () => add(meal) })),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  if (data.savedMeals.length === 0) {
    return (
      <Text style={[styles.muted, { marginTop: 8 }]}>
        Aucun repas enregistré. Sur l'écran Nutrition, appuie sur « Enregistrer » à côté d'un repas pour le retrouver ici
        et l'ajouter en un clic.
      </Text>
    );
  }

  return (
    <ScrollView>
      {data.savedMeals.map((m) => {
        const kcal = Math.round(m.items.reduce((t, it) => t + forGrams(it.food.per100g, it.grams).kcal, 0));
        return (
          <Pressable
            key={m.id}
            onPress={() => addMeal(m)}
            onLongPress={() =>
              Alert.alert('Supprimer ce repas enregistré ?', m.name, [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => removeSavedMeal(m.id) },
              ])
            }
            style={({ pressed }) => [styles.card, { padding: 12, opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.row}>
              <Text style={[styles.text, { fontWeight: '700' }]}>{m.name}</Text>
              <Text style={styles.muted}>{kcal} kcal</Text>
            </View>
            <Text style={[styles.muted, { marginTop: 4 }]} numberOfLines={2}>
              {m.items.map((it) => `${it.food.name} (${it.grams} g)`).join(', ')}
            </Text>
          </Pressable>
        );
      })}
      <Text style={[styles.muted, { textAlign: 'center', marginTop: 4 }]}>Appui long pour supprimer</Text>
    </ScrollView>
  );
}

function ScanFood({ onPick }: { onPick: (f: Food) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState('Vise le code-barres du produit');
  const busy = useRef(false); // évite de scanner 30 fois le même code

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <Card>
        <Text style={styles.text}>L'appli a besoin de la caméra pour scanner les codes-barres.</Text>
        <Button title="Autoriser la caméra" onPress={requestPermission} />
      </Card>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={async ({ data }) => {
          if (busy.current) return;
          busy.current = true;
          setStatus(`Code ${data} : recherche…`);
          try {
            const food = await getByBarcode(data);
            if (food) return onPick(food);
            setStatus(`Produit ${data} introuvable dans Open Food Facts. Utilise la saisie manuelle.`);
          } catch {
            setStatus('Erreur réseau, réessaie.');
          }
          setTimeout(() => (busy.current = false), 2000);
        }}
      />
      <Text style={[styles.muted, { marginTop: 12, textAlign: 'center' }]}>{status}</Text>
    </View>
  );
}

function ManualFood({ onPick }: { onPick: (f: Food) => void }) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const num = (s: string) => Number(s.replace(',', '.')) || 0;

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Text style={styles.muted}>Valeurs pour 100 g (sur l'étiquette)</Text>
      <Label>Nom</Label>
      <Input value={name} onChangeText={setName} placeholder="ex : Riz basmati cuit" />
      <Label>Calories (kcal)</Label>
      <Input value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" />
      <Label>Protéines (g)</Label>
      <Input value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
      <Label>Glucides (g)</Label>
      <Input value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
      <Label>Lipides (g)</Label>
      <Input value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
      <Button
        title="Continuer"
        disabled={!name.trim() || !kcal}
        onPress={() =>
          onPick({
            id: uid(),
            name: name.trim(),
            per100g: { kcal: num(kcal), protein: num(protein), carbs: num(carbs), fat: num(fat) },
          })
        }
      />
    </ScrollView>
  );
}

function ConfirmFood({
  food,
  onBack,
  onSave,
}: {
  food: Food;
  onBack: () => void;
  onSave: (grams: number, meal: Meal) => void;
}) {
  const { data, toggleFavorite } = useStore();
  const isFav = data.favorites.some((f) => f.id === food.id);
  const [grams, setGrams] = useState('100');
  const [meal, setMeal] = useState<Meal>(guessMeal());
  const g = Number(grams.replace(',', '.')) || 0;
  const v = forGrams(food.per100g, g);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack}>
        <Text style={styles.muted}>‹ Retour</Text>
      </Pressable>
      <View style={[styles.row, { alignItems: 'flex-start' }]}>
        <View style={{ flex: 1 }}>
          <Title>{food.name}</Title>
        </View>
        <Pressable onPress={() => toggleFavorite(food)} hitSlop={12} style={{ paddingTop: 4, paddingLeft: 8 }}>
          <Text style={{ fontSize: 26, color: isFav ? colors.carbs : colors.muted }}>{isFav ? '★' : '☆'}</Text>
        </Pressable>
      </View>
      {food.brand && <Text style={[styles.muted, { marginTop: -8, marginBottom: 12 }]}>{food.brand}</Text>}

      <Card>
        <Label>Quantité (g)</Label>
        <Input value={grams} onChangeText={setGrams} keyboardType="decimal-pad" />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {[50, 100, 150, 200, 250].map((n) => (
            <Pressable key={n} onPress={() => setGrams(String(n))} style={styles.chip}>
              <Text style={styles.chipText}>{n}</Text>
            </Pressable>
          ))}
        </View>
        <Label>Repas</Label>
        <Chips
          options={(Object.keys(MEAL_LABELS) as Meal[]).map((m) => ({ value: m, label: MEAL_LABELS[m] }))}
          value={meal}
          onChange={setMeal}
        />
      </Card>

      <Card>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>{Math.round(v.kcal)} kcal</Text>
        <Text style={[styles.text, { marginTop: 8 }]}>
          <Text style={{ color: colors.protein }}>P {v.protein.toFixed(1)} g</Text>
          {'   '}
          <Text style={{ color: colors.carbs }}>G {v.carbs.toFixed(1)} g</Text>
          {'   '}
          <Text style={{ color: colors.fat }}>L {v.fat.toFixed(1)} g</Text>
        </Text>
        <Text style={[styles.muted, { marginTop: 6 }]}>Pour 100 g : {Math.round(food.per100g.kcal)} kcal</Text>
      </Card>

      <Button title="Ajouter au journal" disabled={g <= 0} onPress={() => onSave(g, meal)} />
    </ScrollView>
  );
}

function FoodRow({ food, onPress }: { food: Food; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { padding: 12, opacity: pressed ? 0.7 : 1 }]}>
      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.text} numberOfLines={1}>{food.name}</Text>
          {food.brand && <Text style={styles.muted}>{food.brand}</Text>}
        </View>
        <Text style={styles.muted}>{Math.round(food.per100g.kcal)} kcal/100 g</Text>
      </View>
    </Pressable>
  );
}
