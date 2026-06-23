import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useHouseStore } from '../../stores/house.store';
import { useProductStore } from '../../stores/product.store';
import { ProductCard } from '../../components/inventory/ProductCard';
import { CategoryFilter } from '../../components/inventory/CategoryFilter';
import { EmptyState, SearchBar } from '../../components/ui';
import { colors, spacing, shadows, borderRadius } from '../../theme';

const normalize = (str: string): string =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function InventoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentHouse = useHouseStore((s) => s.currentHouse);
  const {
    products,
    categories,
    filter,
    isLoading,
    loadProducts,
    loadCategories,
    updateQuantity,
    setFilter,
  } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentHouse) {
      loadProducts(currentHouse.id);
      loadCategories(currentHouse.id);
    }
  }, [currentHouse?.id]);

  const onRefresh = useCallback(async () => {
    if (currentHouse) {
      await loadProducts(currentHouse.id);
    }
  }, [currentHouse?.id]);

  const filteredProducts = useMemo(() => {
    const categoryFiltered = filter
      ? products.filter((p) => p.category_id === filter)
      : products;

    if (!searchQuery.trim()) return categoryFiltered;

    const q = normalize(searchQuery);
    return categoryFiltered.filter((p) => normalize(p.name).includes(q));
  }, [products, filter, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  if (!currentHouse) return null;

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar en mi alacena..."
      />
      <CategoryFilter
        categories={categories}
        selectedId={filter}
        onSelect={setFilter}
      />
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
            onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={filteredProducts.length === 0 ? styles.emptyContainer : styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isSearching ? (
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              description={`No se encontraron productos que coincidan con "${searchQuery}"`}
              actionLabel="Limpiar búsqueda"
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <EmptyState
              icon="📦"
              title="Sin productos"
              description="Agregá tu primer producto para empezar a organizar tu alacena"
              actionLabel="Agregar Producto"
              onAction={() => navigation.navigate('AddProduct', {})}
            />
          )
        }
      />
      <TouchableOpacity
        style={[styles.fab, shadows.lg]}
        onPress={() => navigation.navigate('AddProduct', {})}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300',
    marginTop: -2,
  },
});
