# FitApp: suivi nutrition et musculation

Application iPhone (React Native + Expo) pour suivre précisément ses calories, ses macros et ses séances de musculation.

## Fonctionnalités (V1)

- **Objectifs personnalisés** : métabolisme de base (formule de Mifflin-St Jeor), dépense totale selon l'activité, objectif perte / maintien / prise de masse, répartition des macros (protéines 2 g/kg, lipides 25 %, glucides le reste).
- **Journal alimentaire** : suivi par repas, calories restantes, barres de progression des macros.
- **Ajout d'aliments de 3 façons** :
  - recherche texte dans **Open Food Facts** (base gratuite, très fournie en produits français),
  - **scan de code-barres** avec la caméra,
  - saisie manuelle des valeurs de l'étiquette.
- **Journal de musculation** : séries / répétitions / charge, exercices récents en un clic, record personnel, volume total de la séance.
- Données stockées **sur le téléphone** (AsyncStorage) : pas de compte, pas de serveur.

## Lancer l'appli sur ton iPhone (depuis un PC Windows)

1. Installe **Node.js LTS** : https://nodejs.org
2. Sur l'iPhone, installe **Expo Go** depuis l'App Store.
3. Dézippe le projet, ouvre un terminal dans le dossier, puis :
   ```bash
   npm install
   npx expo start
   ```
4. Scanne le QR code affiché avec l'appareil photo de l'iPhone : l'appli s'ouvre dans Expo Go.
   - Le PC et l'iPhone doivent être sur le **même Wi-Fi**. Sinon (Wi-Fi d'université par exemple) : `npx expo start --tunnel`.
5. Chaque fois que tu modifies le code, l'appli se recharge toute seule sur le téléphone.

Si Expo Go signale une version de SDK incompatible, lance `npx expo install --fix`.

## Structure du code

```
App.tsx                      Barre d'onglets et navigation
src/
  ui.tsx                     Composants et couleurs réutilisables
  lib/
    types.ts                 Types (aliment, repas, série, profil)
    nutrition.ts             Calculs : BMR, TDEE, objectifs, totaux
    openfoodfacts.ts         Appels à l'API Open Food Facts
    store.tsx                État global + sauvegarde locale
  screens/
    TodayScreen.tsx          Tableau de bord du jour
    AddFoodScreen.tsx        Recherche / scan / saisie manuelle
    WorkoutScreen.tsx        Journal de musculation
    ProfileScreen.tsx        Profil et objectifs
```

## Pistes pour la V2

- Historique et graphiques (poids, calories sur 7/30 jours, progression par exercice)
- Aliments favoris et repas enregistrés
- Analyse d'une photo de repas avec l'API Claude
- Synchronisation Apple Santé (nécessite un « development build » et un compte développeur Apple)
- Tests unitaires des calculs (`nutrition.ts`)

## Stack

React Native 0.88 · Expo SDK 58 · TypeScript · expo-camera · AsyncStorage · API Open Food Facts
