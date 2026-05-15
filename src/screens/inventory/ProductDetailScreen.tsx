import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Button, Card, StatusBadge } from '../../components/ui';
import { useProductStore } from '../../stores/product.store';
import { useShoppingStore } from '../../stores/shopping.store';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseStore } from '../../stores/house.store';
import { colors, fontSize, spacing, shadows } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const products = useProductStore((s) => s.products);
  const { updateQuantity, deleteProduct } = useProductStore();
  const addShoppingItem = useShoppingStore((s) => s.addItem);
  const session = useAuthStore((s) => s.session);
  const currentHouse = useHouseStore((s) => s.currentHouse);

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Producto no encontrado</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddToShopping = async () => {
    if (!currentHouse || !session) return;
    try {
      await addShoppingItem({
        house_id: currentHouse.id,
        product_id: product.id,
        name: product.name,
        quantity: product.min_stock - product.quantity,
        unit: product.unit,
        added_by: session.user.id,
        source: 'manual',
      });
      Alert.alert('Listo', 'Producto agregado a la lista de compras');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{product.category?.icon || '📦'}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <StatusBadge status={product.status} />
      </View>

      <Card style={styles.quantityCard}>
        <Text style={styles.quantityLabel}>Cantidad actual</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.decrementBtn]}
            onPress={() => updateQuantity(product.id, product.quantity - 1)}
          >
            <Text style={styles.controlText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>
            {product.quantity} {product.unit}
          </Text>
          <TouchableOpacity
            style={[styles.controlBtn, styles.incrementBtn]}
            onPress={() => updateQuantity(product.id, product.quantity + 1)}
          >
            <Text style={[styles.controlText, { color: colors.white }]}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.minStock}>Stock mínimo: {product.min_stock} {product.unit}</Text>
      </Card>

      <Card>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Categoría</Text>
          <Text style={styles.detailValue}>
            {product.category?.icon} {product.category?.name || 'Sin categoría'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Unidad</Text>
          <Text style={styles.detailValue}>{product.unit}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Última actualización</Text>
          <Text style={styles.detailValue}>
            {new Date(product.updated_at).toLocaleDateString('es-AR')}
          </Text>
        </View>
      </Card>

      <View style={styles.actions}>
        {product.status !== 'ok' && (
          <Button
            title="Agregar a lista de compras"
            variant="secondary"
            onPress={handleAddToShopping}
          />
        )}
        <Button
          title="Editar producto"
          variant="outline"
          onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
        />
        <Button
          title="Eliminar producto"
          variant="ghost"
          textStyle={{ color: colors.error }}
          onPress={handleDelete}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  quantityCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  quantityLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  quantityValue: {
    fontSize: fontSize.xxxl,
    fontWeight: '700',
    color: colors.text,
  },
  minStock: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
