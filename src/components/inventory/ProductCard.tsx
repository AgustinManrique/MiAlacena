import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Product } from '../../types';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { PressableScale } from '../ui/PressableScale';
import { QuantityStepper } from '../ui/QuantityStepper';
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
            <Animated.View style={{ transform: [{ scale: qtyScale }] }}>
              <QuantityStepper
                value={product.quantity}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
            </Animated.View>
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
});
