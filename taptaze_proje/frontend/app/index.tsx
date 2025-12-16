import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  
  useEffect(() => {
    // Uygulama açılır açılmaz 1.5 saniye logoyu göster, sonra Ana Sayfaya at
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Ionicons name="leaf" size={100} color="#4CAF50" />
      <Text style={styles.title}>Taptaze</Text>
      <Text style={styles.subtitle}>Doğadan kapınıza...</Text>
      <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 50 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 48, fontWeight: 'bold', color: '#2E7D32', marginTop: 20 },
  subtitle: { fontSize: 18, color: '#666', marginTop: 10 },
});