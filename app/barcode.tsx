import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';

import { useFood } from '@/context/FoodContext';
import { lookupBarcode } from '@/services/openFoodFacts';
import { inferMealType } from '@/utils/meal';
import { formatFullNutrition } from '@/utils/nutrition';

interface ScannedProductPreview {
  label: string;
}

function closeBarcodeScreen() {
  if (router.canDismiss()) {
    router.dismiss();
    return;
  }

  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace('/(tabs)');
}

export default function BarcodeScreen() {
  const { addEntry, logDate } = useFood();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [lastScan, setLastScan] = useState<ScannedProductPreview | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const resetScanner = () => {
    setLastScan(null);
    setScanning(true);
    setProcessing(false);
  };

  const handleBarcode = async ({ data }: { data: string }) => {
    if (!scanning || processing) return;
    setScanning(false);
    setProcessing(true);

    try {
      const product = await lookupBarcode(data);
      await addEntry({
        mealType: inferMealType(''),
        name: product.name,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        caloriesMin: product.caloriesMin,
        caloriesMax: product.caloriesMax,
        proteinMin: product.proteinMin,
        proteinMax: product.proteinMax,
        carbsMin: product.carbsMin,
        carbsMax: product.carbsMax,
        fatMin: product.fatMin,
        fatMax: product.fatMax,
        source: 'barcode',
        barcode: data,
      });
      setLastScan({
        label: `${product.name}\n${formatFullNutrition(product)}`,
      });
    } catch (error) {
      Alert.alert(
        'Barcode lookup failed',
        error instanceof Error ? error.message : 'Unknown error',
        [{ text: 'Try again', onPress: resetScanner }],
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera access is required to scan barcodes.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanning ? handleBarcode : undefined}
      />
      <View style={styles.overlay}>
        {lastScan ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Logged</Text>
            <Text style={styles.successBody}>{lastScan.label}</Text>
            <Text style={styles.successMeta}>Saved to {logDate}</Text>
            <View style={styles.successActions}>
              <Pressable style={styles.secondaryAction} onPress={resetScanner}>
                <Text style={styles.secondaryActionText}>Scan another</Text>
              </Pressable>
              <Pressable style={styles.primaryAction} onPress={closeBarcodeScreen}>
                <Text style={styles.primaryActionText}>Done</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Scan a barcode</Text>
            <Text style={styles.subtitle}>Point your camera at a product barcode.</Text>
            {processing ? <ActivityIndicator color="#FFFFFF" style={{ marginTop: 16 }} /> : null}
          </>
        )}
        {!lastScan ? (
          <Pressable style={styles.cancelButton} onPress={closeBarcodeScreen}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#E5E7EB',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  successBody: {
    color: '#374151',
    lineHeight: 22,
  },
  successMeta: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
  },
  successActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryActionText: {
    color: '#111827',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    color: '#111827',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    gap: 16,
  },
  message: {
    textAlign: 'center',
    color: '#374151',
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
