// Petits composants et styles réutilisables
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

// Thème « Dragon » : obsidienne, braises et or
export const colors = {
  bg: '#120C0A', // obsidienne
  card: '#1E1512', // roche volcanique
  border: '#3A2820',
  text: '#F7EDE4', // parchemin
  muted: '#A8917F',
  accent: '#FF6A1F', // braise
  gold: '#F2B544', // trésor du dragon
  protein: '#5EC8F2', // souffle de glace
  carbs: '#F2B544', // or
  fat: '#E8577A', // rubis
  danger: '#FF3B3B',
};

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'ghost' && styles.btnGhost,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.btnText, variant === 'ghost' && { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />;
}

/** Sélecteur sous forme de pastilles */
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.chip, value === o.value && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === o.value && { color: colors.bg }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Barre de progression (valeur / objectif) */
export function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: value > max ? colors.danger : color }]} />
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 12, letterSpacing: 0.3 },
  label: { color: colors.muted, fontSize: 13, marginBottom: 6, marginTop: 10 },
  text: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnText: { color: '#1A0E08', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13 },
  barBg: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
