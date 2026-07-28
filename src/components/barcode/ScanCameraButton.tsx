import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { PressableScale } from '../ui/PressableScale';
import { shadows, colors, fontSize } from '../../theme';

interface ScanCameraButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ScanCameraButton({ onPress, style }: ScanCameraButtonProps) {
  return (
    // El contenedor externo recibe el estilo (posición absoluta, etc.) para que
    // el PressableScale interno mantenga su área de touch de 56x56.
    <View style={style}>
      <PressableScale style={[styles.fab, shadows.lg]} onPress={onPress}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📷</Text>
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
  icon: {
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl + 4,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
