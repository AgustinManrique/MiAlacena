import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import {
  BarcodeScanningResult,
  BarcodeType,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, Product } from '../../types';
import { useAuthStore } from '../../stores/auth.store';
import { useHouseStore } from '../../stores/house.store';
import { useProductStore } from '../../stores/product.store';
import { useShoppingStore } from '../../stores/shopping.store';
import { barcodeService } from '../../services/barcode.service';
import { EmptyState, PressableScale, QuantityStepper, Button } from '../../components/ui';
import { borderRadius, colors, fontSize, spacing } from '../../theme';

const BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e'];
const BARCODE_SCANNER_SETTINGS = { barcodeTypes: BARCODE_TYPES };

type Props = NativeStackScreenProps<RootStackParamList, 'BarcodeScanner'>;

export function BarcodeScannerScreen({ navigation, route }: Props) {
  const mode = route.params?.mode ?? 'scan';
  const productId = route.params?.productId;

  const [permission, requestPermission] = useCameraPermissions();
  const isProcessingRef = useRef(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const insets = useSafeAreaInsets();

  const session = useAuthStore((s) => s.session);
  const currentHouse = useHouseStore((s) => s.currentHouse);
  const findByBarcode = useProductStore((s) => s.findByBarcode);
  const addItem = useShoppingStore((s) => s.addItem);

  const resetScanner = useCallback(() => {
    isProcessingRef.current = false;
    setShowQuantitySelector(false);
    setScannedProduct(null);
    setQuantity(1);
  }, []);

  // ProductDetail y AddProduct se apilan SOBRE el scanner. Al volver de
  // cualquiera de ellos, la pantalla recupera el foco y se re-habilita la
  // lectura para el próximo escaneo.
  useFocusEffect(
    useCallback(() => {
      resetScanner();
    }, [resetScanner])
  );

  const confirmAddToShopping = useCallback(async () => {
    if (!scannedProduct || !currentHouse || !session) return;

    setShowQuantitySelector(false);
    await addItem({
      house_id: currentHouse.id,
      product_id: scannedProduct.id,
      name: scannedProduct.name,
      quantity,
      unit: scannedProduct.unit,
      added_by: session.user.id,
      source: 'manual',
    });

    Alert.alert(
      'Producto encontrado',
      `✅ ${scannedProduct.name} agregado a la lista de compras`,
      [
        {
          text: 'Ver detalle',
          onPress: () =>
            navigation.navigate('ProductDetail', { productId: scannedProduct.id }),
        },
        { text: 'Escanear otro', onPress: resetScanner },
        {
          text: 'Cerrar',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: true }
    );
  }, [scannedProduct, currentHouse, session, quantity, addItem, navigation, resetScanner]);

  const cancelQuantitySelector = useCallback(() => {
    resetScanner();
  }, [resetScanner]);

  const handleBarCodeScanned = useCallback(
    async ({ data: barcode }: BarcodeScanningResult) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      // Feedback físico inmediato, antes de cualquier lógica.
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (mode === 'edit') {
        // Solo devolver el barcode a la edición abierta y cerrar.
        if (productId) {
          navigation.navigate('EditProduct', { productId, scannedBarcode: barcode });
        } else {
          navigation.goBack();
        }
        return;
      }

      const product = findByBarcode(barcode);

      if (product) {
        if (!currentHouse || !session) {
          Alert.alert('Error', 'No se pudo determinar la casa o sesión activa');
          return;
        }
        setScannedProduct(product);
        setQuantity(1);
        setShowQuantitySelector(true);
        return;
      }

      const result = await barcodeService.lookupBarcode(barcode);
      if (result) {
        navigation.navigate('AddProduct', {
          barcode: result.barcode,
          name: result.name,
          categoryName: result.categoryName ?? undefined,
          imageUrl: result.imageUrl ?? undefined,
        });
      } else {
        Alert.alert(
          'Producto no encontrado',
          'No encontramos este código en tu alacena ni en nuestra base. ¿Querés cargarlo manualmente?',
          [
            {
              text: 'Cargar de cero',
              onPress: () => navigation.navigate('AddProduct', { barcode }),
            },
            {
              text: 'Escanear otro',
              onPress: resetScanner,
            },
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ],
          { cancelable: true }
        );
      }
    },
    [mode, productId, navigation, findByBarcode, currentHouse, session]
  );

  // Permiso todavía resolviéndose: evita flashear el empty state.
  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="📷"
          title="Permiso de cámara"
          description="Para escanear códigos de barras necesitamos acceso a la cámara de tu dispositivo"
          actionLabel="Habilitar cámara"
          onAction={() => void requestPermission()}
        />
        <PressableScale
          style={[styles.closeButton, { top: insets.top + spacing.md }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeText}>✕</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={BARCODE_SCANNER_SETTINGS}
        onBarcodeScanned={handleBarCodeScanned}
        pointerEvents="none"
      />
      <View style={styles.uiLayer} pointerEvents="box-none">
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.hint}>Apuntá la cámara al código de barras</Text>
        </View>
        <PressableScale
          style={[styles.closeButton, { top: insets.top + spacing.md }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeText}>✕</Text>
        </PressableScale>
      </View>

      {showQuantitySelector && scannedProduct && (
        <View style={styles.quantityBackdrop} pointerEvents="auto">
          <View style={styles.quantityCard}>
            <Text style={styles.quantityTitle} numberOfLines={2}>
              {scannedProduct.name}
            </Text>
            <Text style={styles.quantitySubtitle}>¿Cuánto querés agregar?</Text>
            <QuantityStepper
              value={quantity}
              onIncrement={() => setQuantity((q) => q + 1)}
              onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
              min={1}
            />
            <Button
              title="Agregar a compras"
              onPress={() => void confirmAddToShopping()}
              size="lg"
              style={styles.quantityButton}
            />
            <Button
              title="Cancelar"
              variant="ghost"
              onPress={cancelQuantitySelector}
              size="md"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  uiLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 280,
    height: 160,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: borderRadius.lg,
  },
  hint: {
    marginTop: spacing.lg,
    color: colors.white,
    fontSize: fontSize.md,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  closeText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  quantityBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 20,
    elevation: 20,
  },
  quantityCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  quantityTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  quantitySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  quantityButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
});
