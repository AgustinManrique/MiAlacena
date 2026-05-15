import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseStore } from '../../stores/house.store';
import { useProductStore } from '../../stores/product.store';
import { useShoppingStore } from '../../stores/shopping.store';
import { Card } from '../../components/ui';
import { colors, fontSize, spacing, shadows } from '../../theme';

export function HomeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const currentHouse = useHouseStore((s) => s.currentHouse);
  const products = useProductStore((s) => s.products);
  const loadProducts = useProductStore((s) => s.loadProducts);
  const shoppingItems = useShoppingStore((s) => s.items);
  const loadShoppingItems = useShoppingStore((s) => s.loadItems);
  const [refreshing, setRefreshing] = React.useState(false);

  const lowStockProducts = products.filter((p) => p.status === 'low');
  const outOfStockProducts = products.filter((p) => p.status === 'out');
  const pendingShopping = shoppingItems.filter((i) => !i.is_purchased).length;

  useEffect(() => {
    if (currentHouse) {
      loadProducts(currentHouse.id);
      loadShoppingItems(currentHouse.id);
    }
  }, [currentHouse?.id]);

  const onRefresh = async () => {
    if (!currentHouse) return;
    setRefreshing(true);
    await Promise.all([
      loadProducts(currentHouse.id),
      loadShoppingItems(currentHouse.id),
    ]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
        </Text>
        <Text style={styles.houseName}>{currentHouse?.name || 'Mi Casa'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, shadows.sm]}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.statNumber, { color: colors.secondaryDark }]}>
            {lowStockProducts.length}
          </Text>
          <Text style={styles.statLabel}>Stock bajo</Text>
        </View>
        <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.errorLight }]}>
          <Text style={[styles.statNumber, { color: colors.error }]}>
            {outOfStockProducts.length}
          </Text>
          <Text style={styles.statLabel}>Agotados</Text>
        </View>
      </View>

      <Card style={styles.shoppingCard}>
        <View style={styles.shoppingHeader}>
          <Text style={styles.sectionTitle}>🛒 Lista de Compras</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingShopping}</Text>
          </View>
        </View>
        <Text style={styles.shoppingDesc}>
          {pendingShopping === 0
            ? 'No hay productos pendientes de compra'
            : `Tenés ${pendingShopping} producto${pendingShopping > 1 ? 's' : ''} por comprar`}
        </Text>
      </Card>

      {outOfStockProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Productos agotados</Text>
          {outOfStockProducts.map((p) => (
            <Card key={p.id} style={styles.alertCard}>
              <Text style={styles.alertIcon}>{p.category?.icon || '📦'}</Text>
              <View style={styles.alertInfo}>
                <Text style={styles.alertName}>{p.name}</Text>
                <Text style={styles.alertDetail}>
                  {p.quantity} {p.unit} (mín: {p.min_stock})
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {lowStockProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📉 Stock bajo</Text>
          {lowStockProducts.slice(0, 5).map((p) => (
            <Card key={p.id} style={styles.alertCard}>
              <Text style={styles.alertIcon}>{p.category?.icon || '📦'}</Text>
              <View style={styles.alertInfo}>
                <Text style={styles.alertName}>{p.name}</Text>
                <Text style={styles.alertDetail}>
                  {p.quantity} {p.unit} (mín: {p.min_stock})
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  greeting: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: spacing.md,
  },
  greetingText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.white,
  },
  houseName: {
    fontSize: fontSize.md,
    color: colors.primaryLight,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shoppingCard: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
  },
  shoppingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  shoppingDesc: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 4,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  alertDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
