import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert("Uyarı", "Lütfen ad, e-posta ve şifre alanlarını doldurun.");
      return;
    }

    try {
      const response = await fetch('https://taptaze-backend.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Başarılı!", "Doğrulama kodu e-postana gönderildi.");
        // @ts-ignore: TypeScript rota hatasını görmezden gel
        router.push({ pathname: '/verify' as any, params: { email: formData.email } });
      } else {
        Alert.alert("Hata", data.error || "Kayıt işlemi başarısız oldu.");
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "Sunucuya ulaşılamadı. İnternetini kontrol et.");
      console.log(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Taptaze'ye Katıl 🍏</Text>
      
      <TextInput style={styles.input} placeholder="Ad" onChangeText={(t) => setFormData({...formData, name: t})} />
      <TextInput style={styles.input} placeholder="Soyad" onChangeText={(t) => setFormData({...formData, surname: t})} />
      <TextInput style={styles.input} placeholder="E-posta" keyboardType="email-address" autoCapitalize="none" onChangeText={(t) => setFormData({...formData, email: t})} />
      <TextInput style={styles.input} placeholder="Telefon Numarası" keyboardType="phone-pad" onChangeText={(t) => setFormData({...formData, phone: t})} />
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Adres" multiline onChangeText={(t) => setFormData({...formData, address: t})} />
      <TextInput style={styles.input} placeholder="Şifre" secureTextEntry onChangeText={(t) => setFormData({...formData, password: t})} />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Kayıt Ol</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login' as any)} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>Zaten hesabın var mı? Giriş yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor: '#f9f9f9', fontSize: 16 },
  button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { textAlign: 'center', color: '#4CAF50', fontSize: 16, fontWeight: '600' }
});