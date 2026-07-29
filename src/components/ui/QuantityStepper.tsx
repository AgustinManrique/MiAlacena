import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
import { colors, fontSize, spacing } from '../../theme';

interface QuantityStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  min = 0,
  max,
  size = 'md',
}: QuantityStepperProps) {
  const canDecrement = value > min;
  const canIncrement = max === undefined || value < max;

  const buttonSize = size === 'sm' ? 28 : 36;
  const textSize = size === 'sm' ? 16 : 20;
  const valueSize = size === 'sm' ? fontSize.md : fontSize.lg;
  const minValueWidth = size === 'sm' ? 28 : 36;

  return (
    <View style={styles.container}>
      <PressableScale
        style={[
          styles.button,
          styles.decrement,
          { width: buttonSize, height: buttonSize },
          !canDecrement && styles.disabled,
        ]}
        onPress={onDecrement}
        disabled={!canDecrement}
      >
        <Text style={[styles.buttonText, { fontSize: textSize }]}>−</Text>
      </PressableScale>
      <Text style={[styles.value, { fontSize: valueSize, minWidth: minValueWidth }]}>
        {value}
      </Text>
      <PressableScale
        style={[
          styles.button,
          styles.increment,
          { width: buttonSize, height: buttonSize },
          !canIncrement && styles.disabled,
        ]}
        onPress={onIncrement}
        disabled={!canIncrement}
      >
        <Text style={[styles.buttonText, styles.incrementText, { fontSize: textSize }]}>+</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrement: {
    backgroundColor: colors.surfaceVariant,
  },
  increment: {
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontWeight: '700',
    color: colors.text,
  },
  incrementText: {
    color: colors.white,
  },
  value: {
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
