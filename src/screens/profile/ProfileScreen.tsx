import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { HouseMember } from '../../types';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseStore } from '../../stores/house.store';
import { useProductStore } from '../../stores/product.store';
import { useShoppingStore } from '../../stores/shopping.store';
import { Button, Card } from '../../components/ui';
import { colors, fontSize, spacing, borderRadius } from '../../theme';

export function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const session = useAuthStore((s) => s.session);
  const currentUserId = session?.user?.id;
  const {
    currentHouse,
    members,
    loadMembers,
    removeMember,
    updateMemberRole,
    reset: resetHouse,
  } = useHouseStore();
  const resetProducts = useProductStore((s) => s.reset);
  const resetShopping = useShoppingStore((s) => s.reset);

  const isCurrentUserAdmin = members.some(
    (m) => m.user_id === currentUserId && m.role === 'admin'
  );
  const adminCount = members.filter((m) => m.role === 'admin').length;

  useEffect(() => {
    if (!currentHouse?.id) return;

    void loadMembers(currentHouse.id);
  }, [currentHouse?.id]);

  const handleLoadMembers = async () => {
    if (!currentHouse) {
      Alert.alert('Casa no encontrada');
      return;
    }

    try {
      await loadMembers(currentHouse.id);
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los integrantes'
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          resetHouse();
          resetProducts();
          resetShopping();
          await signOut();
        },
      },
    ]);
  };

  const handleShareCode = async () => {
    if (!currentHouse) return;
    try {
      await Share.share({
        message: `Unite a mi casa "${currentHouse.name}" en MiAlacena con el código: ${currentHouse.invite_code}`,
      });
    } catch {}
  };

  const handlePromote = async (userId: string) => {
    if (!currentHouse) return;
    try {
      await updateMemberRole(currentHouse.id, userId, 'admin');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el rol');
    }
  };

  const handleDemote = async (userId: string) => {
    if (!currentHouse) return;
    try {
      await updateMemberRole(currentHouse.id, userId, 'member');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el rol');
    }
  };

  const handleRemove = (member: HouseMember) => {
    if (!currentHouse) return;
    Alert.alert(
      'Quitar miembro',
      `¿Seguro que querés quitar a ${member.profile?.full_name || 'este miembro'} de la casa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(currentHouse.id, member.user_id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo quitar al miembro');
            }
          },
        },
      ]
    );
  };

  const renderMemberActions = (member: HouseMember) => {
    // El usuario actual nunca tiene acciones sobre sí mismo
    if (member.user_id === currentUserId) {
      return (
        <View style={styles.youChip}>
          <Text style={styles.youChipText}>Vos</Text>
        </View>
      );
    }

    // Solo los admins ven acciones sobre otros miembros
    if (!isCurrentUserAdmin) return null;

    if (member.role === 'member') {
      return (
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionPositive]}
            onPress={() => handlePromote(member.user_id)}
          >
            <Text style={styles.actionPositiveText}>👑 Hacer admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDanger]}
            onPress={() => handleRemove(member)}
          >
            <Text style={styles.actionDangerText}>✕ Quitar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // member.role === 'admin': solo "Bajar a miembro", y nunca si es el único admin
    if (adminCount > 1) {
      return (
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionNeutral]}
            onPress={() => handleDemote(member.user_id)}
          >
            <Text style={styles.actionNeutralText}>Bajar a miembro</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <Text style={styles.name}>{profile?.full_name || 'Usuario'}</Text>
      <Text style={styles.email}>{profile?.email || ''}</Text>

      {currentHouse && (
        <Card style={styles.houseCard}>
          <Text style={styles.sectionTitle}>🏠 {currentHouse.name}</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>Código de invitación:</Text>
            <Text style={styles.codeValue}>{currentHouse.invite_code}</Text>
          </View>
          <Button
            title="Compartir código"
            variant="outline"
            size="sm"
            onPress={handleShareCode}
          />
        </Card>
      )}
      
      <Card style={styles.membersCard}>
        <Text style={styles.sectionTitle}>Miembros</Text>
        
        {members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {(member.profile?.full_name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.profile?.full_name || 'Usuario'}
              </Text>
              <Text style={styles.memberRole}>
                {member.role === 'admin'
                  ? '👑 Admin'
                  : 'Miembro'}
              </Text>
            </View>
            {renderMemberActions(member)}
          </View>
        ))}
      </Card>

      <Button
        title="Cerrar Sesión"
        variant="ghost"
        textStyle={{ color: colors.error }}
        onPress={handleLogout}
        style={styles.logoutBtn}
      />
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  houseCard: {
    width: '100%',
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  codeLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  codeValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  membersCard: {
    width: '100%',
    padding: spacing.lg,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  memberRole: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  youChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
  },
  youChipText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  memberActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  actionPositive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  actionPositiveText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  actionDanger: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  actionDangerText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.error,
  },
  actionNeutral: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
  },
  actionNeutralText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  logoutBtn: {
    marginTop: spacing.xl,
    width: '100%',
  },
});
