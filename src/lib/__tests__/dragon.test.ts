import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { computeStreak, computeXp, stageFor, STAGES, XP_RULES } from '../dragon';
import { AppData, FoodEntry } from '../types';

const food = { id: 'f', name: 'Riz', per100g: { kcal: 100, protein: 2, carbs: 22, fat: 0.5 } };

function entry(date: string, grams = 100): FoodEntry {
  return { id: date + grams, date, meal: 'dejeuner', food, grams };
}

function makeData(partial: Partial<AppData> = {}): AppData {
  return {
    profile: { sex: 'homme', age: 21, weightKg: 75, heightCm: 178, activity: 'sedentaire', goal: 'maintien' },
    entries: [],
    sets: [],
    sessions: [],
    activeSession: null,
    favorites: [],
    savedMeals: [],
    weights: [],
    ...partial,
  };
}

describe('stageFor', () => {
  it('commence au stade Œuf', () => {
    expect(stageFor(0).stage.name).toBe('Œuf');
  });

  it('change de stade exactement aux seuils', () => {
    expect(stageFor(STAGES[1].minXp - 1).index).toBe(0);
    expect(stageFor(STAGES[1].minXp).index).toBe(1);
  });

  it('calcule la progression vers le stade suivant', () => {
    const halfway = (STAGES[1].minXp + STAGES[2].minXp) / 2;
    expect(stageFor(halfway).progress).toBeCloseTo(0.5);
  });

  it('plafonne au stade ultime', () => {
    const r = stageFor(999999);
    expect(r.stage).toBe(STAGES[STAGES.length - 1]);
    expect(r.next).toBeNull();
    expect(r.progress).toBe(1);
  });
});

describe('computeXp', () => {
  it('vaut 0 sans aucune donnée', () => {
    expect(computeXp(makeData())).toBe(0);
  });

  it('donne de l’XP par jour noté, séance et série', () => {
    const data = makeData({
      entries: [entry('2026-11-15', 50), entry('2026-11-16', 50)], // très loin de l'objectif
      sessions: [{ id: 's', date: '2026-11-16', type: 'muscu', durationMin: 60, kcal: 200 }],
      sets: [
        { id: '1', date: '2026-11-16', exercise: 'Squat', reps: 10, weightKg: 80 },
        { id: '2', date: '2026-11-16', exercise: 'Squat', reps: 8, weightKg: 85 },
      ],
    });
    expect(computeXp(data)).toBe(2 * XP_RULES.dayLogged + XP_RULES.session + 2 * XP_RULES.set);
  });

  it('donne le bonus quand on est à ±10 % de l’objectif', () => {
    // Objectif ≈ 2115 kcal pour ce profil ; 2100 g de riz à 100 kcal/100 g = 2100 kcal
    const data = makeData({ entries: [entry('2026-11-16', 2100)] });
    expect(computeXp(data)).toBe(XP_RULES.dayLogged + XP_RULES.dayOnTarget);
  });
});

describe('computeStreak', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 16, 12, 0)); // 16 nov. 2026, midi
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    const data = makeData({ entries: [entry('2026-11-14'), entry('2026-11-15'), entry('2026-11-16')] });
    expect(computeStreak(data)).toBe(3);
  });

  it('garde la série d’hier si rien n’est encore noté aujourd’hui', () => {
    const data = makeData({ entries: [entry('2026-11-14'), entry('2026-11-15')] });
    expect(computeStreak(data)).toBe(2);
  });

  it('s’arrête au premier jour manqué', () => {
    const data = makeData({ entries: [entry('2026-11-12'), entry('2026-11-15'), entry('2026-11-16')] });
    expect(computeStreak(data)).toBe(2);
  });

  it('vaut 0 si la série est cassée depuis plus d’un jour', () => {
    const data = makeData({ entries: [entry('2026-11-13')] });
    expect(computeStreak(data)).toBe(0);
  });
});
