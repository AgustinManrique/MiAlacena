import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useHouseStore } from '../../stores/house.store';
import { useShoppingStore } from '../../stores/shopping.store';
import { useAuthStore } from '../../stores/auth.store';
import { ShoppingItemCard } from '../../components/shopping/ShoppingItemCard';
import { Button, EmptyState, Input } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { UnitOfMeasure } from '../../types';

export function ShoppingScreen() {
  const currentHouse = useHouseStore((s) => s.currentHouse);
  const session = useAuthStore((s) => s.session);
  const {
    items,
    isLoading,
    loadItems,
    addItem,
    togglePurchased,
    removeItem,
    clearPurchased,
  } = useShoppingStore();

  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);

  const pendingItems = items.filter((i) => !i.is_purchased);
  const purchasedItems = items.filter((i) => i.is_purchased);

  useEffect(() => {
    if (currentHouse) loadItems(currentHouse.id);
  }, [currentHouse?.id]);

  const onRefresh = useCallback(async () => {
    if (currentHouse) await loadItems(currentHouse.id);
  }, [currentHouse?.id]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || !currentHouse || !session) return;
    setAdding(true);
    try {
      await addItem({
        house_id: currentHouse.id,
        name: newItemName.trim(),
        quantity: 1,
        unit: 'unidad' as UnitOfMeasure,
        added_by: session.user.id,
        source: 'manual',
      });
      setNewItemName('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleClearPurchased = () => {
    if (!currentHouse || purchasedItems.length === 0) return;
    Alert.alert(
      'Limpiar comprados',
      '¿Eliminar todos los productos ya comprados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: () => clearPurchased(currentHouse.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <Input
          placeholder="Agregar producto..."
          value={newItemName}
          onChangeText={setNewItemName}
          containerStyle={styles.addInput}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <Button
          title="+"
          onPress={handleAddItem}
          loading={adding}
          size="md"
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={[...pendingItems, ...purchasedItems]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShoppingItemCard
            item={item}
            onToggle={() => togglePurchased(item.id, session!.user.id)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title="Lista vacía"
            description="Agregá productos manualmente o esperá que se agreguen automáticamente cuando el stock baje"
          />
        }
      />

      {purchasedItems.length > 0 && (
        <View style={styles.clearBar}>
          <Button
            title={`Limpiar ${purchasedItems.length} comprado${purchasedItems.length > 1 ? 's' : ''}`}
            variant="outline"
            size="sm"
            onPress={handleClearPurchased}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  addInput: {
    flex: 1,
    marginBottom: 0,
  },
  addBtn: {
    marginTop: 0,
    height: 48,
    width: 48,
    paddingHorizontal: 0,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  clearBar: {
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});
