import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseStore } from '../../stores/house.store';
import { Button, Card, Input } from '../../components/ui';
import { INVITE_CODE_LENGTH } from '../../config/constants';
import { colors, fontSize, spacing } from '../../theme';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface SettingsField {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  isVisible: boolean;
  isDisabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secondaryAction?: {
    label: string;
    onPress: () => void;
    isDisabled?: boolean;
  };
}

interface SettingsSection {
  id: string;
  title: string;
  fields: SettingsField[];
  onSave: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isVisible: boolean;
  isDisabled?: boolean;
}

function SettingsSectionView({ section }: { section: SettingsSection }) {
  if (!section.isVisible) return null;

  const isSaveDisabled =
    section.isDisabled ||
    section.isLoading ||
    section.fields.some((field) => field.isVisible && !field.value.trim());

  return (
    <Card style={styles.settingsSection}>
      <Text style={styles.settingsSectionTitle}>{section.title}</Text>
      {section.fields.map((field) =>
        field.isVisible ? (
          <View key={field.id} style={styles.settingsField}>
            <Input
              label={field.label}
              value={field.value}
              onChangeText={field.onChangeText}
              placeholder={field.placeholder}
              editable={!field.isDisabled && !section.isDisabled}
              autoCapitalize={field.autoCapitalize}
            />
            {field.secondaryAction && (
              <Button
                title={field.secondaryAction.label}
                variant="outline"
                size="sm"
                onPress={field.secondaryAction.onPress}
                disabled={
                  field.secondaryAction.isDisabled ||
                  field.isDisabled ||
                  section.isDisabled ||
                  section.isLoading
                }
                style={styles.secondaryActionButton}
              />
            )}
          </View>
        ) : null
      )}
      {section.error && <Text style={styles.fieldError}>{section.error}</Text>}
      <Button
        title="Guardar"
        size="sm"
        onPress={section.onSave}
        loading={section.isLoading}
        disabled={isSaveDisabled}
      />
    </Card>
  );
}

export function SettingsScreen() {
  const {
    profile,
    updateProfile,
    isUpdatingProfile,
    updateProfileError,
    clearUpdateProfileError,
  } = useAuthStore();
  const session = useAuthStore((s) => s.session);
  const currentUserId = session?.user?.id;
  const {
    currentHouse,
    members,
    updateHouse,
    isUpdatingHouse,
    updateHouseError,
    clearUpdateHouseError,
  } = useHouseStore();

  const [profileName, setProfileName] = useState(profile?.full_name || '');
  const [houseName, setHouseName] = useState(currentHouse?.name || '');
  const [inviteCode, setInviteCode] = useState(currentHouse?.invite_code || '');

  const isCurrentUserAdmin = members.some(
    (m) => m.user_id === currentUserId && m.role === 'admin'
  );

  useEffect(() => {
    setProfileName(profile?.full_name || '');
    setHouseName(currentHouse?.name || '');
    setInviteCode(currentHouse?.invite_code || '');
    clearUpdateProfileError();
    clearUpdateHouseError();
  }, [profile?.full_name, currentHouse?.name, currentHouse?.invite_code]);

  const handleSaveProfile = async () => {
    const trimmed = profileName.trim();
    if (!trimmed) return;
    try {
      await updateProfile({ full_name: trimmed });
    } catch {
      // El error queda en updateProfileError.
    }
  };

  const handleRegenerateInviteCode = () => {
    setInviteCode(generateInviteCode());
  };

  const handleSaveHouse = async () => {
    if (!currentHouse) return;

    const trimmedName = houseName.trim();
    const trimmedCode = inviteCode.trim().toUpperCase();

    if (!trimmedName) return;
    if (trimmedCode.length !== INVITE_CODE_LENGTH) {
      Alert.alert('Error', `El código debe tener ${INVITE_CODE_LENGTH} caracteres`);
      return;
    }

    const updates: { name?: string; invite_code?: string } = {};
    if (trimmedName !== currentHouse.name) updates.name = trimmedName;
    if (trimmedCode !== currentHouse.invite_code) updates.invite_code = trimmedCode;

    if (Object.keys(updates).length === 0) return;

    try {
      await updateHouse(updates);
    } catch (err: any) {
      const errorMessage = err.message?.toLowerCase() || '';
      const isDuplicate = err.code === '23505' || errorMessage.includes('duplicate');
      const isRlsError =
        errorMessage.includes('row-level') ||
        errorMessage.includes('violates') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('not authorized');
      Alert.alert(
        'No se pudo actualizar',
        isDuplicate
          ? 'Ese código ya está en uso. Elegí otro.'
          : isRlsError
          ? 'Solo los administradores de la casa pueden cambiar los datos'
          : err.message || 'No se pudo actualizar la casa'
      );
    }
  };

  const settingsSections: SettingsSection[] = useMemo(
    () => [
      {
        id: 'profile',
        title: 'Editar perfil',
        fields: [
          {
            id: 'full_name',
            label: 'Nombre',
            value: profileName,
            placeholder: 'Tu nombre',
            onChangeText: setProfileName,
            isVisible: true,
            isDisabled: isUpdatingProfile,
          },
        ],
        onSave: handleSaveProfile,
        isLoading: isUpdatingProfile,
        error: updateProfileError,
        isVisible: true,
        isDisabled: isUpdatingProfile,
      },
      {
        id: 'house',
        title: 'Editar casa',
        fields: [
          {
            id: 'house_name',
            label: 'Nombre de la casa',
            value: houseName,
            placeholder: 'Nombre de la casa',
            onChangeText: setHouseName,
            isVisible: isCurrentUserAdmin,
            isDisabled: isUpdatingHouse,
          },
          {
            id: 'invite_code',
            label: 'Código de invitación',
            value: inviteCode,
            placeholder: 'Código de invitación',
            onChangeText: (value) => setInviteCode(value.toUpperCase()),
            isVisible: isCurrentUserAdmin,
            isDisabled: isUpdatingHouse,
            autoCapitalize: 'characters',
            secondaryAction: {
              label: 'Regenerar',
              onPress: handleRegenerateInviteCode,
              isDisabled: isUpdatingHouse,
            },
          },
        ],
        onSave: handleSaveHouse,
        isLoading: isUpdatingHouse,
        error: updateHouseError,
        isVisible: isCurrentUserAdmin,
        isDisabled: isUpdatingHouse,
      },
    ],
    [
      profileName,
      houseName,
      inviteCode,
      isUpdatingProfile,
      isUpdatingHouse,
      updateProfileError,
      updateHouseError,
      isCurrentUserAdmin,
    ]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {settingsSections.map((section) => (
        <SettingsSectionView key={section.id} section={section} />
      ))}
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
    alignItems: 'center',
  },
  settingsSection: {
    width: '100%',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  settingsSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingsField: {
    marginBottom: spacing.md,
  },
  secondaryActionButton: {
    marginTop: spacing.sm,
  },
  fieldError: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
