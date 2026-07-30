import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RecipeDetail } from '../../types';
import { lookupMeal } from '../../services/recipe.service';
import { Card, EmptyState } from '../../components/ui';
import { colors, fontSize, spacing, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen({ route }: Props) {
  const { mealId } = route.params;
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await lookupMeal(mealId);
      if (!cancelled) {
        setDetail(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mealId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        icon="😕"
        title="No se pudo cargar la receta"
        description="Revisá tu conexión e intentá nuevamente."
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: detail.thumb }} style={styles.hero} />

      <Text style={styles.title}>{detail.name}</Text>

      <View style={styles.chipRow}>
        {!!detail.category && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>🍽️ {detail.category}</Text>
          </View>
        )}
        {!!detail.area && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>🌍 {detail.area}</Text>
          </View>
        )}
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {detail.ingredients.map((ing, index) => (
          <View key={`${ing.name}-${index}`} style={styles.ingredientRow}>
            <Text style={styles.ingredientName}>• {ing.name}</Text>
            {!!ing.measure && <Text style={styles.ingredientMeasure}>{ing.measure}</Text>}
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Preparación</Text>
        <Text style={styles.instructions}>{detail.instructions}</Text>
      </Card>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceVariant,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  ingredientName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  ingredientMeasure: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  instructions: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
});
