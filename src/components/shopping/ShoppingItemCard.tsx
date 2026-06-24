import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { ShoppingItem } from '../../types';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../theme';
import { PressableScale } from '../ui/PressableScale';

interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggle: () => void;
  onRemove: () => void;
}

export function ShoppingItemCard({ item, onToggle, onRemove }: ShoppingItemCardProps) {
  // Animación de entrada (fade + slide desde abajo).
  const enter = useRef(new Animated.Value(0)).current;
  // Progreso del check (0 = vacío, 1 = marcado).
  const checked = useRef(new Animated.Value(item.is_purchased ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.spring(checked, {
      toValue: item.is_purchased ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  }, [item.is_purchased]);

  const enterStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  return (
    <Animated.View style={enterStyle}>
      <View style={[styles.card, shadows.sm, item.is_purchased && styles.cardCompleted]}>
        <PressableScale onPress={onToggle} style={styles.checkbox}>
          <View style={styles.check}>
            <Animated.View
              style={[styles.checkFill, { transform: [{ scale: checked }], opacity: checked }]}
            />
            <Animated.Text style={[styles.checkmark, { opacity: checked }]}>✓</Animated.Text>
          </View>
        </PressableScale>

        <View style={styles.info}>
          <Text style={[styles.name, item.is_purchased && styles.nameCompleted]}>
            {item.name}
          </Text>
          <Text style={styles.detail}>
            {item.quantity} {item.unit}
            {item.source === 'auto' ? ' · Automático' : ''}
          </Text>
        </View>

        <PressableScale onPress={onRemove} style={styles.removeBtn}>
          <Text style={styles.removeText}>✕</Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: spacing.sm,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  detail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  removeText: {
    fontSize: 16,
    color: colors.textLight,
  },
});
