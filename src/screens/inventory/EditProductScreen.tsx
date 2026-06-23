import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UnitOfMeasure } from '../../types';
import { Input, Button } from '../../components/ui';
import { useProductStore } from '../../stores/product.store';
import { UNITS_OF_MEASURE } from '../../config/constants';
import { colors, fontSize, spacing, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProduct'>;

export function EditProductScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const products = useProductStore((s) => s.products);
  const categories = useProductStore((s) => s.categories);
  const updateProduct = useProductStore((s) => s.updateProduct);

  const product = products.find((p) => p.id === productId);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState<UnitOfMeasure>('unidad');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setQuantity(String(product.quantity));
      setMinStock(String(product.min_stock));
      setUnit(product.unit);
      setCategoryId(product.category_id);
      setReady(true);
    }
  }, [product?.id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresá el nombre del producto');
      return;
    }

    setLoading(true);
    try {
      await updateProduct(productId, {
        name: name.trim(),
        category_id: categoryId,
        quantity: Number(quantity) || 0,
        unit,
        min_stock: Number(minStock) || 1,
      });
      Alert.alert('Listo', 'Producto actualizado', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!product && !ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Producto no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        label="Nombre del producto"
        placeholder="Ej: Leche entera"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Categoría</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                categoryId === cat.id && { backgroundColor: cat.color },
              ]}
              onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.row}>
        <Input
          label="Cantidad"
          placeholder="1"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          containerStyle={styles.halfInput}
        />
        <Input
          label="Stock mínimo"
          placeholder="1"
          value={minStock}
          onChangeText={setMinStock}
          keyboardType="numeric"
          containerStyle={styles.halfInput}
        />
      </View>

      <Text style={styles.label}>Unidad de medida</Text>
      <View style={styles.unitGrid}>
        {UNITS_OF_MEASURE.map((u) => (
          <TouchableOpacity
            key={u.value}
            style={[styles.unitChip, unit === u.value && styles.unitChipActive]}
            onPress={() => setUnit(u.value as UnitOfMeasure)}
          >
            <Text
              style={[styles.unitText, unit === u.value && styles.unitTextActive]}
            >
              {u.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Guardar Cambios"
        onPress={handleSave}
        loading={loading}
        size="lg"
        style={styles.saveBtn}
      />
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
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  categoryScroll: {
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  unitChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
  },
  unitChipActive: {
    backgroundColor: colors.primaryLight,
  },
  unitText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  unitTextActive: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: spacing.md,
  },
});
