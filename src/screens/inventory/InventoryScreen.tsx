import React, { useEffect, useCallback, useRef } from 'react';
import {
  Animated,
  View,
  FlatList,
  StyleSheet,
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
import { EmptyState, PressableScale } from '../../components/ui';
import { colors, spacing, shadows } from '../../theme';

export function InventoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentHouse = useHouseStore((s) => s.currentHouse);
  const {
    categories,
    filter,
    isLoading,
    loadProducts,
    loadCategories,
    updateQuantity,
    setFilter,
    getFilteredProducts,
  } = useProductStore();

  const products = getFilteredProducts();

  // Entrada animada del FAB.
  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentHouse) {
      loadProducts(currentHouse.id);
      loadCategories(currentHouse.id);
    }
  }, [currentHouse?.id]);

  useEffect(() => {
    Animated.spring(fabAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = useCallback(async () => {
    if (currentHouse) {
      await loadProducts(currentHouse.id);
    }
  }, [currentHouse?.id]);

  if (!currentHouse) return null;

  return (
    <View style={styles.container}>
      <CategoryFilter categories={categories} selectedId={filter} onSelect={setFilter} />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
            onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
          />
        )}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        contentContainerStyle={products.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="Sin productos"
            description="Agregá tu primer producto para empezar a organizar tu alacena"
            actionLabel="Agregar Producto"
            onAction={() => navigation.navigate('AddProduct', {})}
          />
        }
      />
      <Animated.View
        style={[
          styles.fabWrapper,
          { opacity: fabAnim, transform: [{ scale: fabAnim }] },
        ]}
      >
        <PressableScale
          style={[styles.fab, shadows.lg]}
          onPress={() => navigation.navigate('AddProduct', {})}
        >
          <Text style={styles.fabText}>+</Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  fabWrapper: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
  fab: {
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
