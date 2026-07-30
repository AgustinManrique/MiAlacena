import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Recipe } from '../../types';
import { useProductStore } from '../../stores/product.store';
import { useHouseStore } from '../../stores/house.store';
import { getRecipesForPantry } from '../../services/recipe.service';
import { EmptyState } from '../../components/ui';
import { colors, fontSize, spacing, borderRadius, shadows } from '../../theme';

export function RecipesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentHouse = useHouseStore((s) => s.currentHouse);
  const products = useProductStore((s) => s.products);
  const loadProducts = useProductStore((s) => s.loadProducts);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const productNames = useMemo(() => products.map((p) => p.name), [products]);
  const namesKey = productNames.join('|');

  // Asegura que los productos estén cargados aunque no se haya visitado Alacena.
  useEffect(() => {
    if (currentHouse) loadProducts(currentHouse.id);
  }, [currentHouse?.id]);

  const fetchRecipes = useCallback(async () => {
    if (productNames.length === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getRecipesForPantry(productNames);
    setRecipes(result);
    setLoading(false);
  }, [namesKey]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipes();
    setRefreshing(false);
  }, [fetchRecipes]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Buscando recetas con tu alacena…</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon="🍽️"
        title="Tu alacena está vacía"
        description="Agregá productos a la alacena para descubrir recetas que puedas cocinar con lo que tenés."
        actionLabel="Agregar producto"
        onAction={() => navigation.navigate('AddProduct')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, shadows.sm]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RecipeDetail', { mealId: item.id })}
          >
            <Image source={{ uri: item.thumb }} style={styles.thumb} />
            <View style={styles.cardInfo}>
              <Text style={styles.recipeName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.matchText}>
                🥘 Usa {item.matchCount} de tus ingrediente
                {item.matchCount === 1 ? '' : 's'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={recipes.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title="Sin recetas por ahora"
            description="No encontramos recetas con tus ingredientes actuales. Probá agregar más productos a tu alacena."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    padding: spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  thumb: {
    width: 96,
    height: 96,
    backgroundColor: colors.surfaceVariant,
  },
  cardInfo: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  matchText: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontWeight: '500',
  },
});
