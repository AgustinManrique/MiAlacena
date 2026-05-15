import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductStatus } from '../../types';
import { colors, borderRadius, fontSize, spacing } from '../../theme';

const STATUS_CONFIG: Record<ProductStatus, { label: string; bg: string; text: string }> = {
  ok: { label: 'OK', bg: colors.successLight, text: colors.primaryDark },
  low: { label: 'Bajo', bg: colors.warningLight, text: colors.secondaryDark },
  out: { label: 'Agotado', bg: colors.errorLight, text: colors.error },
};

interface StatusBadgeProps {
  status: ProductStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
