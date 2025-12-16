import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { orderService } from '../../services/api';

export default function CartScreen() {
  const { items, removeItem, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  // --- KULLANICI BİLGİLERİ (Varsayılan) ---
  const [userInfo, setUserInfo] = useState({
    name: "Talha Özcan",
    phone: "0555 123 45 67",
    address: "İnönü Üniversitesi, Mühendislik Fakültesi, Malatya"
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [tempInfo, setTempInfo] = useState({ ...userInfo });

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      setLoading(true);
      
      const orderData = {
        customer_name: userInfo.name,
        customer_phone: userInfo.phone,
        delivery_address: userInfo.address,
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_image: item.image,
          quantity: item.quantity,
          price: item.price,
          unit_type: item.unit_type
        })),
        total_amount: total
      };

      await orderService.create(orderData);
      setSuccessModalVisible(true);

    } catch (error) {
      Alert.alert('Hata', 'Sipariş oluşturulurken bir sorun çıktı.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = () => {
    setUserInfo(tempInfo);
    setEditModalVisible(false);
  };

  const closeSuccessModal = () => {
    setSuccessModalVisible(false);
    clearCart();
    router.replace('/(tabs)/home');
  };

  const handleClearCartConfirm = () => {
    Alert.alert("Sepeti Boşalt", "Sepetindeki tüm ürünleri silmek istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Evet, Sil", onPress: clearCart, style: 'destructive' }
    ]);
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBg}>
          <Ionicons name="cart-outline" size={60} color="#4CAF50" />
        </View>
        <Text style={styles.emptyTitle}>Sepetin Şu An Boş 😔</Text>
        <Text style={styles.emptyText}>Hemen taptaze ürünleri keşfetmeye başla!</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* --- YENİLENMİŞ HEADER (YEŞİL & CANLI) --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sepetim ({items.length})</Text>
        <TouchableOpacity onPress={handleClearCartConfirm} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        
        {/* --- 1. ÜRÜNLER LİSTESİ (ARTIK EN ÜSTTE) --- */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Ürünler</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image 
                source={{ uri: item.image || 'https://via.placeholder.com/100' }} 
                style={styles.itemImage} 
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                
                {/* Kasa ise farklı, normal ise farklı gösterim */}
                <Text style={styles.itemDetail}>
                   {item.unit_type === 'Kasa' 
                     ? `${item.quantity / 20} Kasa (${item.quantity} KG)` // Basit bir gösterim mantığı
                     : `${item.quantity} ${item.unit_type}`}
                </Text>
                
                <Text style={styles.itemPrice}>
                  ₺{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeButton}>
                <Ionicons name="close-circle" size={24} color="#FF5252" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* --- 2. TESLİMAT BİLGİLERİ (ÜRÜNLERİN ALTINDA) --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Teslimat Bilgileri</Text>
            <TouchableOpacity onPress={() => { setTempInfo(userInfo); setEditModalVisible(true); }}>
              <Text style={styles.editText}>Düzenle <Ionicons name="pencil" size={14} /></Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.infoText}>{userInfo.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="call" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.infoText}>{userInfo.phone}</Text>
            </View>
            <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
              <View style={[styles.iconCircle, { marginTop: 2 }]}>
                <Ionicons name="location" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.infoText}>{userInfo.address}</Text>
            </View>
          </View>
        </View>

        {/* --- 3. ÖZET --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ara Toplam</Text>
              <Text style={styles.summaryValue}>₺{total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Teslimat Ücreti</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>Ücretsiz</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Genel Toplam</Text>
              <Text style={styles.totalValue}>₺{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* --- ALT BUTON (SABİT) --- */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTotalLabel}>Ödenecek Tutar</Text>
          <Text style={styles.footerTotalValue}>₺{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutButton} 
          onPress={handleCheckout}
          disabled={loading}
        >
          <Text style={styles.checkoutButtonText}>
            {loading ? 'İşleniyor...' : 'Siparişi Tamamla'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* --- ADRES DÜZENLEME MODALI --- */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           style={styles.modalOverlay}
        >
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bilgileri Düzenle</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Ad Soyad</Text>
            <TextInput 
              style={styles.input} 
              value={tempInfo.name} 
              onChangeText={(t) => setTempInfo({...tempInfo, name: t})} 
            />

            <Text style={styles.inputLabel}>Telefon</Text>
            <TextInput 
              style={styles.input} 
              value={tempInfo.phone} 
              keyboardType="phone-pad"
              onChangeText={(t) => setTempInfo({...tempInfo, phone: t})} 
            />

            <Text style={styles.inputLabel}>Adres</Text>
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              value={tempInfo.address} 
              multiline
              onChangeText={(t) => setTempInfo({...tempInfo, address: t})} 
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- SUCCESS MODAL --- */}
      <Modal visible={successModalVisible} animationType="fade" transparent={true}>
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-done" size={60} color="white" />
            </View>
            <Text style={styles.successTitle}>Sipariş Alındı! 🎉</Text>
            <Text style={styles.successText}>
              Siparişin başarıyla oluşturuldu.{'\n'}Hazırlanmaya başlıyoruz!
            </Text>
            <TouchableOpacity style={styles.successButton} onPress={closeSuccessModal}>
              <Text style={styles.successButtonText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' }, // Arka planı hafif gri yaptık
  
  // --- HEADER STİLLERİ (YENİ) ---
  header: { 
    backgroundColor: '#4CAF50', // Yeşil Header
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
    zIndex: 10
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  clearButton: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },

  // Section Stilleri
  sectionContainer: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  editText: { color: '#4CAF50', fontWeight: '600' },
  
  // Bilgi Kartı (Teslimat)
  infoCard: { backgroundColor: 'white', padding: 15, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoText: { color: '#333', fontSize: 15, flex: 1, fontWeight: '500' },

  // Ürün Kartı
  cartItem: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  itemImage: { width: 65, height: 65, borderRadius: 12, backgroundColor: '#f5f5f5' },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemDetail: { fontSize: 14, color: '#888', marginTop: 3, fontWeight: '500' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginTop: 5 },
  removeButton: { padding: 5 },

  // Özet Kartı
  summaryCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#666', fontSize: 15 },
  summaryValue: { color: '#333', fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50' },

  // Footer (Sabit Alt)
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', padding: 20, paddingBottom: 35, borderTopWidth: 1, borderTopColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 10 },
  footerTotalLabel: { fontSize: 12, color: '#999' },
  footerTotalValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  checkoutButton: { backgroundColor: '#4CAF50', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#4CAF50', shadowOpacity: 0.4, shadowOffset: {width: 0, height: 4}, elevation: 5 },
  checkoutButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginRight: 5 },

  // Boş Sepet
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  emptyIconBg: { width: 120, height: 120, backgroundColor: '#E8F5E9', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center', paddingHorizontal: 40 },
  shopButton: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 12 },
  shopButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // Edit Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editModalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 10, fontWeight: '600' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 14, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#eee' },
  saveButton: { backgroundColor: '#4CAF50', marginTop: 30, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // Success Modal
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  successContent: { backgroundColor: 'white', width: '85%', padding: 30, borderRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, elevation: 10 },
  successIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 4, borderColor: '#E8F5E9' },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  successText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  successButton: { backgroundColor: '#333', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 20 },
  successButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});