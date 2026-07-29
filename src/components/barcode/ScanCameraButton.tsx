import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '../ui/PressableScale';
import { shadows, colors } from '../../theme';

interface ScanCameraButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ScanCameraButton({ onPress, style }: ScanCameraButtonProps) {
  return (
    <View style={style}>
      <PressableScale style={[styles.fab, shadows.lg]} onPress={onPress}>
        <View style={styles.iconContainer}>
          <Ionicons name="camera" size={24} color={colors.white} />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
