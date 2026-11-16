// Types partagés dans toute l'application

export type Meal = 'petit-dej' | 'dejeuner' | 'diner' | 'collation';

export const MEAL_LABELS: Record<Meal, string> = {
  'petit-dej': 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
};

/** Valeurs nutritionnelles pour 100 g */
export interface Per100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Un aliment trouvé (Open Food Facts) ou saisi à la main */
export interface Food {
  id: string; // code-barres ou id local
  name: string;
  brand?: string;
  per100g: Per100g;
}

/** Une ligne du journal alimentaire */
export interface FoodEntry {
  id: string;
  date: string; // AAAA-MM-JJ
  meal: Meal;
  food: Food;
  grams: number;
}

export interface WorkoutSet {
  id: string;
  date: string; // AAAA-MM-JJ
  exercise: string;
  reps: number;
  weightKg: number;
}

export type Sex = 'homme' | 'femme';
export type Activity = 'sedentaire' | 'leger' | 'modere' | 'actif' | 'tres-actif';
export type Goal = 'perte' | 'maintien' | 'prise';

export interface Profile {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
  dragonName?: string;
}

/** Type d'activité sportive, utilisé pour le calcul des calories (METs) */
export type SessionType =
  | 'muscu'
  | 'muscu-intense'
  | 'course'
  | 'velo'
  | 'natation'
  | 'hiit'
  | 'sport-co'
  | 'marche';

/** Séance chronométrée terminée */
export interface Session {
  id: string;
  date: string; // AAAA-MM-JJ
  type: SessionType;
  durationMin: number;
  kcal: number; // calories dépensées EN PLUS du repos
}

/** Séance en cours (chrono lancé) */
export interface ActiveSession {
  type: SessionType;
  startedAt: number; // timestamp en ms
}

/** Repas enregistré, à rajouter en un clic */
export interface SavedMeal {
  id: string;
  name: string;
  items: { food: Food; grams: number }[];
}

export interface AppData {
  profile: Profile;
  entries: FoodEntry[];
  sets: WorkoutSet[];
  sessions: Session[];
  activeSession: ActiveSession | null;
  favorites: Food[];
  savedMeals: SavedMeal[];
}
