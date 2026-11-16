import { describe, expect, it } from '@jest/globals';
import {
  addDays,
  bmr,
  dailyTargets,
  forGrams,
  sessionKcal,
  sportKcalFor,
  sumEntries,
  tdee,
} from '../nutrition';
import { FoodEntry, Profile, Session } from '../types';

const homme: Profile = { sex: 'homme', age: 21, weightKg: 75, heightCm: 178, activity: 'sedentaire', goal: 'maintien' };
const femme: Profile = { ...homme, sex: 'femme', weightKg: 60, heightCm: 165 };

describe('bmr (Mifflin-St Jeor)', () => {
  it('calcule le métabolisme de base d’un homme', () => {
    // 10×75 + 6.25×178 − 5×21 + 5 = 1762.5
    expect(bmr(homme)).toBeCloseTo(1762.5);
  });

  it('calcule le métabolisme de base d’une femme', () => {
    // 10×60 + 6.25×165 − 5×21 − 161 = 1365.25
    expect(bmr(femme)).toBeCloseTo(1365.25);
  });
});

describe('tdee', () => {
  it('applique le facteur d’activité', () => {
    expect(tdee(homme)).toBeCloseTo(1762.5 * 1.2);
    expect(tdee({ ...homme, activity: 'actif' })).toBeCloseTo(1762.5 * 1.5);
  });
});

describe('dailyTargets', () => {
  it('ajuste les calories selon l’objectif', () => {
    const maintien = dailyTargets(homme).kcal;
    expect(dailyTargets({ ...homme, goal: 'perte' }).kcal).toBe(maintien - 400);
    expect(dailyTargets({ ...homme, goal: 'prise' }).kcal).toBe(maintien + 300);
  });

  it('ajoute les calories de sport', () => {
    expect(dailyTargets(homme, 300).kcal).toBe(dailyTargets(homme).kcal + 300);
  });

  it('fixe les protéines à 2 g/kg', () => {
    expect(dailyTargets(homme).protein).toBe(150);
  });

  it('a des macros cohérentes avec le total de calories (à 10 kcal près, arrondis)', () => {
    const t = dailyTargets(homme);
    const fromMacros = t.protein * 4 + t.carbs * 4 + t.fat * 9;
    expect(Math.abs(fromMacros - t.kcal)).toBeLessThanOrEqual(10);
  });

  it('ne renvoie jamais de glucides négatifs', () => {
    const extreme: Profile = { ...homme, weightKg: 150, heightCm: 150, age: 80, goal: 'perte' };
    expect(dailyTargets(extreme).carbs).toBeGreaterThanOrEqual(0);
  });
});

describe('sessionKcal (METs)', () => {
  it('ne compte que la dépense au-dessus du repos : (MET − 1) × kg × h', () => {
    // course : MET 9 → (9 − 1) × 75 × 1 h = 600
    expect(sessionKcal('course', 75, 60)).toBe(600);
    // muscu : MET 3.5 → 2.5 × 75 × 0.5 h = 93.75 → 94
    expect(sessionKcal('muscu', 75, 30)).toBe(94);
  });

  it('renvoie 0 pour une durée nulle', () => {
    expect(sessionKcal('velo', 75, 0)).toBe(0);
  });
});

describe('sportKcalFor', () => {
  it('additionne uniquement les séances du jour demandé', () => {
    const sessions: Session[] = [
      { id: '1', date: '2026-11-16', type: 'muscu', durationMin: 60, kcal: 200 },
      { id: '2', date: '2026-11-16', type: 'course', durationMin: 30, kcal: 300 },
      { id: '3', date: '2026-11-15', type: 'velo', durationMin: 60, kcal: 450 },
    ];
    expect(sportKcalFor(sessions, '2026-11-16')).toBe(500);
    expect(sportKcalFor(sessions, '2026-11-14')).toBe(0);
  });
});

describe('forGrams / sumEntries', () => {
  const skyr = { id: 'skyr', name: 'Skyr', per100g: { kcal: 60, protein: 10, carbs: 4, fat: 0.2 } };

  it('convertit les valeurs pour 100 g en valeurs pour une portion', () => {
    const v = forGrams(skyr.per100g, 150);
    expect(v.kcal).toBeCloseTo(90);
    expect(v.protein).toBeCloseTo(15);
  });

  it('additionne plusieurs entrées du journal', () => {
    const entries: FoodEntry[] = [
      { id: 'a', date: '2026-11-16', meal: 'petit-dej', food: skyr, grams: 100 },
      { id: 'b', date: '2026-11-16', meal: 'collation', food: skyr, grams: 200 },
    ];
    const total = sumEntries(entries);
    expect(total.kcal).toBeCloseTo(180);
    expect(total.protein).toBeCloseTo(30);
  });

  it('renvoie zéro pour un journal vide', () => {
    expect(sumEntries([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('addDays', () => {
  it('change de mois et d’année correctement', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('gère les années bissextiles', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});
