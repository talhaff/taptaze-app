import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Uyarı", "Lütfen e-posta ve şifrenizi girin.");
      return;
    }

    try {
      const response = await fetch('https://taptaze-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Hoş Geldin!", `Giriş başarılı, iyi alışverişler ${data.user.name}!`);
        // Giriş başarılıysa uygulamanın ana sayfasına (Home) yönlendir
        router.replace('/(tabs)/home'); 
      } else {
        Alert.alert("Hata", data.error || "Giriş başarısız oldu.");
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı.");
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Taptaze'ye Giriş Yap 🛒</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="E-posta" 
        keyboardType="email-address" 
        autoCapitalize="none"
        onChangeText={setEmail} 
        value={email}
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Şifre" 
        secureTextEntry
        onChangeText={setPassword} 
        value={password}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Hesabın yok mu? Hemen Kayıt Ol</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor: '#f9f9f9', fontSize: 16 },
  button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { textAlign: 'center', color: '#4CAF50', fontSize: 16, fontWeight: '600' }
});