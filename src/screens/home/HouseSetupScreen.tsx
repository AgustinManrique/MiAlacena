import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Input, Button, Card } from '../../components/ui';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseStore } from '../../stores/house.store';
import { categoryService } from '../../services/category.service';
import { colors, fontSize, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HouseSetup'>;

export function HouseSetupScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [houseName, setHouseName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const session = useAuthStore((s) => s.session);
  const { createHouse, joinHouse } = useHouseStore();

  const handleCreate = async () => {
    if (!houseName.trim()) {
      Alert.alert('Error', 'Ingresá un nombre para la casa');
      return;
    }
    setLoading(true);
    try {
      const house = await createHouse(houseName.trim(), session!.user.id);
      await categoryService.createDefaultCategories(house.id);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Ingresá el código de invitación');
      return;
    }
    setLoading(true);
    try {
      await joinHouse(inviteCode.trim(), session!.user.id);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🏠</Text>
          <Text style={styles.title}>Configurá tu hogar</Text>
          <Text style={styles.subtitle}>
            Creá una nueva casa o unite a una existente
          </Text>
        </View>
        <Card style={styles.optionCard}>
          <Text style={styles.optionTitle}>🆕 Crear nueva casa</Text>
          <Text style={styles.optionDesc}>
            Sé el admin y empezá a organizar tu hogar
          </Text>
          <Button title="Crear Casa" onPress={() => setMode('create')} />
        </Card>
        <Card style={styles.optionCard}>
          <Text style={styles.optionTitle}>🔗 Unirme a una casa</Text>
          <Text style={styles.optionDesc}>
            Ingresá el código de invitación que te compartieron
          </Text>
          <Button
            title="Unirme"
            variant="outline"
            onPress={() => setMode('join')}
          />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === 'create' ? 'Crear Casa' : 'Unirme a una Casa'}
        </Text>
      </View>
      <View style={styles.form}>
        {mode === 'create' ? (
          <Input
            label="Nombre de la casa"
            placeholder="Ej: Casa de la familia Pérez"
            value={houseName}
            onChangeText={setHouseName}
          />
        ) : (
          <Input
            label="Código de invitación"
            placeholder="Ej: ABC12345"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
          />
        )}
        <Button
          title={mode === 'create' ? 'Crear' : 'Unirme'}
          onPress={mode === 'create' ? handleCreate : handleJoin}
          loading={loading}
          size="lg"
        />
        <Button
          title="Volver"
          variant="ghost"
          onPress={() => setMode('choose')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  optionCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.sm,
  },
});
