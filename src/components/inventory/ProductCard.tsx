import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Product } from '../../types';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { PressableScale } from '../ui/PressableScale';
import { colors, fontSize, spacing } from '../../theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function ProductCard({ product, onPress, onIncrement, onDecrement }: ProductCardProps) {
  // Animación de entrada (fade + slide).
  const enter = useRef(new Animated.Value(0)).current;
  // Rebote del número de cantidad.
  const qtyScale = useRef(new Animated.Value(1)).current;
  const prevQty = useRef(product.quantity);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (prevQty.current !== product.quantity) {
      Animated.sequence([
        Animated.timing(qtyScale, { toValue: 1.25, duration: 110, useNativeDriver: true }),
        Animated.spring(qtyScale, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }),
      ]).start();
      prevQty.current = product.quantity;
    }
  }, [product.quantity]);

  const enterStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  return (
    <Animated.View style={enterStyle}>
      <PressableScale onPress={onPress} scaleTo={0.98}>
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
              <PressableScale style={[styles.controlBtn, styles.decrementBtn]} onPress={onDecrement}>
                <Text style={styles.controlText}>−</Text>
              </PressableScale>
              <Animated.Text style={[styles.quantityText, { transform: [{ scale: qtyScale }] }]}>
                {product.quantity}
              </Animated.Text>
              <PressableScale style={[styles.controlBtn, styles.incrementBtn]} onPress={onIncrement}>
                <Text style={[styles.controlText, { color: colors.white }]}>+</Text>
              </PressableScale>
            </View>
          </View>
        </Card>
      </PressableScale>
    </Animated.View>
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
  emoji: { fontSize: 20 },
  info: { flex: 1, marginRight: spacing.sm },
  name: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  category: { fontSize: fontSize.sm, color: colors.textSecondary },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  stockLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrementBtn: { backgroundColor: colors.surfaceVariant },
  incrementBtn: { backgroundColor: colors.primary },
  controlText: { fontSize: 18, fontWeight: '700', color: colors.text },
  quantityText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
});
