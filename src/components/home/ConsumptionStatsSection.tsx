import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Card } from '../ui';
import { ConsumptionStatsMonth } from '../../types';
import { borderRadius, colors, fontSize, spacing } from '../../theme';

interface ConsumptionStatsSectionProps {
  months: ConsumptionStatsMonth[];
}

const DONUT_SIZE = 184;
const STROKE_WIDTH = 22;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ConsumptionStatsSection({ months }: ConsumptionStatsSectionProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    Math.max(months.length - 1, 0)
  );

  const selectedMonth = months[selectedMonthIndex];

  const segments = useMemo(() => {
    if (!selectedMonth || selectedMonth.totalAmount <= 0) return [];

    let accumulated = 0;
    return selectedMonth.categories.map((category) => {
      const length = (category.amount / selectedMonth.totalAmount) * CIRCUMFERENCE;
      const segment = {
        ...category,
        strokeDasharray: `${length} ${CIRCUMFERENCE - length}`,
        strokeDashoffset: -accumulated,
      };
      accumulated += length;
      return segment;
    });
  }, [selectedMonth]);

  if (!selectedMonth) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas de Consumo</Text>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay estadísticas disponibles</Text>
        </Card>
      </View>
    );
  }

  const canGoPrevious = selectedMonthIndex > 0;
  const canGoNext = selectedMonthIndex < months.length - 1;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Estadísticas de Consumo</Text>
          <Text style={styles.sectionSubtitle}>Resumen mensual por categoría</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={[styles.monthButton, !canGoPrevious && styles.monthButtonDisabled]}
            onPress={() => setSelectedMonthIndex((index) => Math.max(index - 1, 0))}
            disabled={!canGoPrevious}
          >
            <Text style={[styles.monthButtonText, !canGoPrevious && styles.monthButtonTextDisabled]}>
              ‹
            </Text>
          </TouchableOpacity>

          <Text style={styles.monthLabel}>{selectedMonth.monthLabel}</Text>

          <TouchableOpacity
            style={[styles.monthButton, !canGoNext && styles.monthButtonDisabled]}
            onPress={() =>
              setSelectedMonthIndex((index) => Math.min(index + 1, months.length - 1))
            }
            disabled={!canGoNext}
          >
            <Text style={[styles.monthButtonText, !canGoNext && styles.monthButtonTextDisabled]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.donutContainer}>
          <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
            <Circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={RADIUS}
              stroke={colors.surfaceVariant}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {segments.map((segment) => (
              <Circle
                key={segment.categoryName}
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={RADIUS}
                stroke={segment.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                rotation="-90"
                originX={DONUT_SIZE / 2}
                originY={DONUT_SIZE / 2}
              />
            ))}
          </Svg>
          <View style={styles.donutCenter}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(selectedMonth.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.categoryList}>
          {selectedMonth.categories.map((category) => (
            <View key={category.categoryName} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                </View>
                <View>
                  <Text style={styles.categoryName}>{category.categoryName}</Text>
                  <Text style={styles.categoryPercentage}>{category.percentage}% del total</Text>
                </View>
              </View>
              <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.md,
    paddingTop: 0,
  },
  header: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    padding: spacing.md,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonDisabled: {
    backgroundColor: colors.surfaceVariant,
  },
  monthButtonText: {
    fontSize: 26,
    lineHeight: 30,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  monthButtonTextDisabled: {
    color: colors.textLight,
  },
  monthLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  categoryList: {
    gap: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  categoryIconText: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  categoryPercentage: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  emptyCard: {
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
