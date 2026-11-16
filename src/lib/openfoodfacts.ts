import { Food } from './types';

// API publique et gratuite d'Open Food Facts (base très fournie en produits français)
// Doc : https://openfoodfacts.github.io/openfoodfacts-server/api/
const BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_fr,brands,nutriments';
// Open Food Facts demande d'identifier son appli
const HEADERS = { 'User-Agent': 'FitApp/1.0 (projet perso)' };

function toFood(p: any): Food | null {
  const n = p?.nutriments ?? {};
  const kcal = Number(n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : NaN));
  const name = p?.product_name_fr || p?.product_name;
  if (!name || !Number.isFinite(kcal)) return null; // produit incomplet
  return {
    id: String(p.code ?? name),
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    per100g: {
      kcal,
      protein: Number(n.proteins_100g) || 0,
      carbs: Number(n.carbohydrates_100g) || 0,
      fat: Number(n.fat_100g) || 0,
    },
  };
}

/** Cherche un produit par code-barres (EAN-13, UPC...) */
export async function getByBarcode(barcode: string): Promise<Food | null> {
  const res = await fetch(`${BASE}/api/v2/product/${barcode}.json?fields=${FIELDS}`, {
    headers: HEADERS,
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.status !== 1) return null;
  return toFood(json.product);
}

/** Recherche texte (ex : "yaourt nature") */
export async function searchFoods(query: string): Promise<Food[]> {
  const url =
    `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Erreur réseau (${res.status})`);
  const json = await res.json();
  return (json.products ?? []).map(toFood).filter((f: Food | null): f is Food => f !== null);
}
