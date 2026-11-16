// Gamification : ton dragon compagnon gagne de l'XP grâce à ta régularité
import { dailyTargets, sportKcalFor, sumEntries } from './nutrition';
import { AppData } from './types';

export interface DragonStage {
  minXp: number;
  name: string;
  emoji: string;
  line: string; // petite phrase du dragon
}

export const STAGES: DragonStage[] = [
  { minXp: 0, name: 'Œuf', emoji: '🥚', line: "Quelque chose bouge à l'intérieur… Nourris-le de régularité." },
  { minXp: 100, name: 'Dragonnet', emoji: '🦎', line: 'Il a éclos ! Il te suit partout et réclame son festin.' },
  { minXp: 350, name: 'Jeune dragon', emoji: '🐲', line: 'Ses ailes se renforcent à chaque entraînement.' },
  { minXp: 800, name: 'Dragon', emoji: '🐉', line: 'Il crache ses premières flammes. Rien ne vous arrête.' },
  { minXp: 1600, name: 'Dragon ancien', emoji: '🔥', line: 'Une légende. Ta discipline est devenue un mode de vie.' },
];

/** Règles d'XP, volontairement simples et transparentes */
export const XP_RULES = {
  dayLogged: 10, // au moins un aliment noté dans la journée
  dayOnTarget: 20, // calories à ±10 % de l'objectif
  session: 15, // séance chronométrée
  set: 1, // chaque série
};

export function computeXp(data: AppData): number {
  let xp = 0;
  const days = new Set(data.entries.map((e) => e.date));
  for (const day of days) {
    xp += XP_RULES.dayLogged;
    const eaten = sumEntries(data.entries.filter((e) => e.date === day)).kcal;
    const target = dailyTargets(data.profile, sportKcalFor(data.sessions, day)).kcal;
    if (Math.abs(eaten - target) <= target * 0.1) xp += XP_RULES.dayOnTarget;
  }
  xp += data.sessions.length * XP_RULES.session;
  xp += data.sets.length * XP_RULES.set;
  return xp;
}

export function stageFor(xp: number) {
  let index = 0;
  STAGES.forEach((s, i) => {
    if (xp >= s.minXp) index = i;
  });
  const stage = STAGES[index];
  const next = STAGES[index + 1] ?? null;
  const progress = next ? (xp - stage.minXp) / (next.minXp - stage.minXp) : 1;
  return { stage, next, index, progress };
}
