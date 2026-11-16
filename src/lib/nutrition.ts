import { Activity, FoodEntry, Goal, Per100g, Profile, Session, SessionType } from './types';

/**
 * Niveau d'activité HORS SPORT (quotidien, travail, déplacements).
 * Le sport est compté séparément, séance par séance (voir METs plus bas),
 * pour ne pas le compter deux fois.
 */
export const ACTIVITY_FACTORS: Record<Activity, { factor: number; label: string }> = {
  sedentaire: { factor: 1.2, label: 'Assis la plupart du temps (études, bureau)' },
  leger: { factor: 1.3, label: 'Un peu actif (marche, debout parfois)' },
  modere: { factor: 1.4, label: 'Actif (beaucoup de marche, debout)' },
  actif: { factor: 1.5, label: 'Travail physique' },
  'tres-actif': { factor: 1.6, label: 'Travail très physique' },
};

/**
 * Valeurs MET (Compendium of Physical Activities).
 * 1 MET = dépense au repos. kcal ≈ MET × poids (kg) × durée (h).
 */
export const SESSION_TYPES: Record<SessionType, { met: number; label: string }> = {
  muscu: { met: 3.5, label: 'Muscu (modérée)' },
  'muscu-intense': { met: 6, label: 'Muscu (intense)' },
  course: { met: 9, label: 'Course à pied' },
  velo: { met: 7, label: 'Vélo' },
  natation: { met: 6, label: 'Natation' },
  hiit: { met: 8, label: 'HIIT / circuit' },
  'sport-co': { met: 7, label: 'Sport collectif' },
  marche: { met: 4, label: 'Marche rapide' },
};

/**
 * Calories dépensées PAR LA SÉANCE, en plus du repos.
 * On retire 1 MET car la dépense au repos est déjà dans le métabolisme de base.
 */
export function sessionKcal(type: SessionType, weightKg: number, durationMin: number): number {
  const met = SESSION_TYPES[type].met;
  return Math.round((met - 1) * weightKg * (durationMin / 60));
}

export const GOAL_ADJUST: Record<Goal, { delta: number; label: string }> = {
  perte: { delta: -400, label: 'Perte de poids (-400 kcal)' },
  maintien: { delta: 0, label: 'Maintien' },
  prise: { delta: 300, label: 'Prise de masse (+300 kcal)' },
};

/** Métabolisme de base, formule de Mifflin-St Jeor (kcal/jour) */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'homme' ? base + 5 : base - 161;
}

/** Dépense énergétique totale estimée (kcal/jour) */
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity].factor;
}

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Objectifs journaliers :
 * - protéines : 2 g/kg (classique pour un sportif)
 * - lipides : 25 % des calories
 * - glucides : le reste
 */
export function dailyTargets(p: Profile, sportKcal = 0): Targets {
  const kcal = Math.round(tdee(p) + GOAL_ADJUST[p.goal].delta + sportKcal);
  const protein = Math.round(2 * p.weightKg);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}

/** Valeurs pour une quantité donnée en grammes */
export function forGrams(per100g: Per100g, grams: number): Per100g {
  const k = grams / 100;
  return {
    kcal: per100g.kcal * k,
    protein: per100g.protein * k,
    carbs: per100g.carbs * k,
    fat: per100g.fat * k,
  };
}

export function sumEntries(entries: FoodEntry[]): Per100g {
  return entries.reduce(
    (acc, e) => {
      const v = forGrams(e.food.per100g, e.grams);
      return {
        kcal: acc.kcal + v.kcal,
        protein: acc.protein + v.protein,
        carbs: acc.carbs + v.carbs,
        fat: acc.fat + v.fat,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Total des calories de sport pour une date */
export function sportKcalFor(sessions: Session[], date: string): number {
  return sessions.filter((s) => s.date === date).reduce((t, s) => t + s.kcal, 0);
}

/** Date du jour au format AAAA-MM-JJ (heure locale) */
export function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
