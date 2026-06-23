import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../stores/auth.store';
import { useHouseStore } from '../stores/house.store';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { HouseSetupScreen } from '../screens/home/HouseSetupScreen';
import { AddProductScreen } from '../screens/inventory/AddProductScreen';
import { ProductDetailScreen } from '../screens/inventory/ProductDetailScreen';
import { MainTabs } from './MainTabs';
import { authService } from '../services/auth.service';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading, isAuthenticated, initialize, setSession } = useAuthStore();
  const { houses, loadHouses } = useHouseStore();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    initialize();
    const { data } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadHouses(session.user.id);
    }
  }, [session?.user?.id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const needsHouseSetup = isAuthenticated && houses.length === 0;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Transición por defecto: deslizar desde la derecha.
          animation: 'slide_from_right',
          animationDuration: 220,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: true, title: '', headerBackTitle: 'Volver' }}
            />
          </>
        ) : needsHouseSetup ? (
          <Stack.Screen
            name="HouseSetup"
            component={HouseSetupScreen}
            options={{ animation: 'fade' }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{
                headerShown: true,
                title: 'Nuevo Producto',
                headerBackTitle: 'Volver',
                // "Nuevo" entra como modal, desde abajo.
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{
                headerShown: true,
                title: 'Detalle',
                headerBackTitle: 'Volver',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
