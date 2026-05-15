import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { MainTabParamList } from '../types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { ShoppingScreen } from '../screens/shopping/ShoppingScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useShoppingStore } from '../stores/shopping.store';
import { colors, fontSize } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<string, { active: string; inactive: string }> = {
  HomeTab: { active: '🏠', inactive: '🏡' },
  InventoryTab: { active: '📦', inactive: '📦' },
  ShoppingTab: { active: '🛒', inactive: '🛒' },
  ProfileTab: { active: '👤', inactive: '👤' },
};

export function MainTabs() {
  const pendingCount = useShoppingStore((s) => s.getPendingCount());

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icon = ICONS[route.name];
          return (
            <Text style={{ fontSize: 22 }}>
              {focused ? icon.active : icon.inactive}
            </Text>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '500' },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '600', color: colors.text },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Inicio', headerShown: false }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{ title: 'Alacena' }}
      />
      <Tab.Screen
        name="ShoppingTab"
        component={ShoppingScreen}
        options={{
          title: 'Compras',
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
