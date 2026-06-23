import React from 'react';
import { useSyncEngine } from './src/hooks/useSyncEngine';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  useSyncEngine();
  return <RootNavigator />;
}