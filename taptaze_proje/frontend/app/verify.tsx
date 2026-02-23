import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function VerifyScreen() {
  const router = useRouter();
  // Kayıt ekranından gönderdiğimiz e-posta adresini yakalıyoruz
  const { email } = useLocalSearchParams(); 
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    if (!code) {
      Alert.alert("Uyarı", "Lütfen doğrulama kodunu girin.");
      return;
    }

    try {
      const response = await fetch('https://taptaze-backend.onrender.com/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Tebrikler!", "Hesabın doğrulandı. Şimdi giriş yapabilirsin.");
        router.push('/login'); // Doğrulama başarılıysa giriş ekranına at
      } else {
        Alert.alert("Hata", data.error || "Doğrulama başarısız oldu.");
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı.");
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>E-postanı Doğrula ✉️</Text>
      <Text style={styles.subtitle}>{email} adresine gönderilen 6 haneli kodu girin.</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Doğrulama Kodu" 
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={setCode} 
        value={code}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Doğrula</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 16, marginBottom: 30, textAlign: 'center', color: '#666' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 20, backgroundColor: '#f9f9f9', fontSize: 20, textAlign: 'center', letterSpacing: 5 },
  button: { backgroundColor: '#FF9800', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});