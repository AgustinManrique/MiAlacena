import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingItem } from '../../types';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../theme';

interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggle: () => void;
  onRemove: () => void;
}

export function ShoppingItemCard({ item, onToggle, onRemove }: ShoppingItemCardProps) {
  return (
    <View style={[styles.card, shadows.sm, item.is_purchased && styles.purchased]}>
      <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
        <View style={[styles.check, item.is_purchased && styles.checked]}>
          {item.is_purchased && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={[styles.name, item.is_purchased && styles.nameCompleted]}>
          {item.name}
        </Text>
        <Text style={styles.detail}>
          {item.quantity} {item.unit}
          {item.source === 'auto' ? ' · Automático' : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
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
  purchased: {
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
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
