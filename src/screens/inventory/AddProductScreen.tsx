import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, UnitOfMeasure } from '../../types';
import { Input, Button } from '../../components/ui';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseStore } from '../../stores/house.store';
import { useProductStore } from '../../stores/product.store';
import { UNITS_OF_MEASURE } from '../../config/constants';
import { colors, fontSize, spacing, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddProduct'>;

export function AddProductScreen({ navigation, route }: Props) {
  const session = useAuthStore((s) => s.session);
  const currentHouse = useHouseStore((s) => s.currentHouse);
  const { categories, createProduct } = useProductStore();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [minStock, setMinStock] = useState('1');
  const [unit, setUnit] = useState<UnitOfMeasure>('unidad');
  const [categoryId, setCategoryId] = useState<string | null>(
    route.params?.categoryId || null
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresá el nombre del producto');
      return;
    }
    if (!currentHouse || !session) return;

    setLoading(true);
    try {
      await createProduct({
        house_id: currentHouse.id,
        name: name.trim(),
        category_id: categoryId,
        quantity: Number(quantity) || 0,
        unit,
        min_stock: Number(minStock) || 1,
        created_by: session.user.id,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

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
        title="Guardar Producto"
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
