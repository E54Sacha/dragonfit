import React from 'react';
import { Image, Text, View } from 'react-native';
import { computeXp, stageFor } from '../lib/dragon';
import { useStore } from '../lib/store';
import { Card, colors, ProgressBar, styles } from '../ui';

// Illustrations des 5 stades (require doit être statique en React Native)
const DRAGON_IMAGES = [
  require('../../assets/dragon/dragon-1.png'),
  require('../../assets/dragon/dragon-2.png'),
  require('../../assets/dragon/dragon-3.png'),
  require('../../assets/dragon/dragon-4.png'),
  require('../../assets/dragon/dragon-5.png'),
];

/** Carte du dragon compagnon, en haut de l'écran Festin */
export default function DragonCard() {
  const { data } = useStore();
  const xp = computeXp(data);
  const { stage, next, index, progress } = stageFor(xp);
  const name = data.profile.dragonName?.trim() || 'Ton dragon';

  return (
    <Card style={{ borderColor: colors.accent + '66' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Image source={DRAGON_IMAGES[index]} style={{ width: 88, height: 88 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{name}</Text>
          <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '600' }}>
            {stage.name} · niveau {index + 1}
          </Text>
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={progress} max={1} color={colors.gold} />
          </View>
          <Text style={[styles.muted, { fontSize: 11, marginTop: 4 }]}>
            {next ? `${xp} / ${next.minXp} XP avant « ${next.name} »` : `${xp} XP · stade ultime atteint`}
          </Text>
        </View>
      </View>
      <Text style={[styles.muted, { marginTop: 10, fontStyle: 'italic' }]}>« {stage.line} »</Text>
    </Card>
  );
}
