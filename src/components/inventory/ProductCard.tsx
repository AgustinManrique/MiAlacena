import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../../types';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { colors, fontSize, spacing } from '../../theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ProductCard({ product, onPress, onIncrement, onDecrement }: ProductCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.categoryIcon}>
            <Text style={styles.emoji}>{product.category?.icon || '📦'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.category}>{product.category?.name || 'Sin categoría'}</Text>
          </View>
          <StatusBadge status={product.status} />
        </View>
        <View style={styles.quantityRow}>
          <Text style={styles.stockLabel}>
            Stock: {product.quantity} {product.unit} (mín: {product.min_stock})
          </Text>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlBtn, styles.decrementBtn]}
              onPress={onDecrement}
            >
              <Text style={styles.controlText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{product.quantity}</Text>
            <TouchableOpacity
              style={[styles.controlBtn, styles.incrementBtn]}
              onPress={onIncrement}
            >
              <Text style={[styles.controlText, { color: colors.white }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  emoji: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  category: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  stockLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrementBtn: {
    backgroundColor: colors.surfaceVariant,
  },
  incrementBtn: {
    backgroundColor: colors.primary,
  },
  controlText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  quantityText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
});
