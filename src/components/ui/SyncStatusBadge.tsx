import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { useSyncStore, SyncStatus } from '../../stores/sync.store';
import { processQueue } from '../../lib/syncEngine';
import { colors, borderRadius, fontSize, spacing } from '../../theme';
import { PressableScale } from './PressableScale';

const CONFIG: Record<SyncStatus, { label: string; color: string; bg: string }> = {
  synced: { label: 'Sincronizado', color: colors.success, bg: colors.successLight },
  syncing: { label: 'Sincronizando…', color: colors.info, bg: colors.infoLight },
  offline: { label: 'Sin conexión', color: colors.secondaryDark, bg: colors.secondaryLight },
  error: { label: 'Reintentando…', color: colors.error, bg: colors.errorLight },
};

interface Props {
  style?: ViewStyle;
}

/**
 * Pill que muestra el estado de sync. El puntito pulsa mientras sincroniza
 * y muestra cuántos cambios quedan en cola. Tocala para forzar el sync.
 * Hace VISIBLE la persistencia offline (conecta las dos partes del trabajo).
 */
export function SyncStatusBadge({ style }: Props) {
  const status = useSyncStore((s) => s.status);
  const pending = useSyncStore((s) => s.queue.length);
  const cfg = CONFIG[status];

  const pulse = useRef(new Animated.Value(1)).current;
  const mount = useRef(new Animated.Value(0)).current;

  // Fade in al aparecer.
  useEffect(() => {
    Animated.timing(mount, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulso del puntito mientras está sincronizando.
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    if (status === 'syncing') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      pulse.setValue(1);
    }
    return () => loop?.stop();
  }, [status]);

  return (
    <Animated.View style={[style, { opacity: mount }]}>
      <PressableScale onPress={() => processQueue()}>
        <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
          <Animated.View
            style={[styles.dot, { backgroundColor: cfg.color, opacity: pulse }]}
          />
          <Text style={[styles.label, { color: cfg.color }]}>
            {cfg.label}
            {pending > 0 ? ` (${pending})` : ''}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
