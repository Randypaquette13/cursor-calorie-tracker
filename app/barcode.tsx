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

export default function BarcodeScreen() {
  const { addEntry } = useFood();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

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
      Alert.alert('Logged', `${product.name}\n${Math.round(product.calories)} kcal`, [
        { text: 'Scan another', onPress: () => setScanning(true) },
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        'Barcode lookup failed',
        error instanceof Error ? error.message : 'Unknown error',
        [{ text: 'Try again', onPress: () => setScanning(true) }],
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
        <Text style={styles.title}>Scan a barcode</Text>
        <Text style={styles.subtitle}>Point your camera at a product barcode.</Text>
        {processing && <ActivityIndicator color="#FFFFFF" style={{ marginTop: 16 }} />}
        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
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
