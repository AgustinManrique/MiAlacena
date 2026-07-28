import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSyncEngine } from './src/hooks/useSyncEngine';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  useSyncEngine();
  usePushNotifications();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <RootNavigator />
    </GestureHandlerRootView>
  );
}
