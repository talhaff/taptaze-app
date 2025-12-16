import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert // Alert uyarısı için ekledik
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { Product } from '../../types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Satış Modu: 'normal' veya 'crate' (kasa)
  const [buyingMode, setBuyingMode] = useState<'normal' | 'crate'>('normal');
  
  // Miktar
  const [quantity, setQuantity] = useState(1);
  const [inputValue, setInputValue] = useState("1"); 

  // PREMIUM MODAL İÇİN STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', quantity: '' });

  const { addItem } = useCart();

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    // Mod değişince miktarı sıfırla, ama stok kontrolüne dikkat et
    if (product) {
       const startQty = product.unit_type === 'KG' && buyingMode === 'normal' ? 0.5 : 1;
       setQuantity(startQty);
       setInputValue(startQty.toString());
    }
  }, [buyingMode]);

  const loadProduct = async () => {
    try {
      const data = await productService.getById(id as string);
      setProduct(data);
      const startQty = data.unit_type === 'KG' ? 0.5 : 1;
      setQuantity(startQty);
      setInputValue(startQty.toString());
    } catch (error) {
      console.error('Ürün yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCrateSize = () => {
    if (!product) return 20;
    return 20; 
  };

  // --- STOK KONTROLLÜ MİKTAR DEĞİŞİMİ (GÜNCELLENDİ) ---
  const handleQuantityChange = (change: number) => {
    if (!product) return;

    let newQty;
    const crateSize = getCrateSize();
    const currentStock = product.stock;

    if (buyingMode === 'crate') {
      newQty = Math.max(1, quantity + change);
      
      // Kasa ile alımda stok kontrolü (Örn: 2 Kasa * 20 = 40 birim stok lazım)
      if (change > 0 && (newQty * crateSize) > currentStock) {
        Alert.alert("Stok Sınırı", `Elimizde o kadar yok. Kalan stok: ${currentStock} ${product.unit_type}`);
        return;
      }

    } else {
      const step = product.unit_type === 'KG' ? 0.5 : 1;
      newQty = Math.max(step, quantity + change * step);
      newQty = Number(newQty.toFixed(2));

      // Normal alımda stok kontrolü
      if (change > 0 && newQty > currentStock) {
        Alert.alert("Stok Sınırı", `Elimizde o kadar yok. Kalan stok: ${currentStock} ${product.unit_type}`);
        return;
      }
    }
    
    setQuantity(newQty);
    setInputValue(newQty.toString());
  };

  // --- STOK KONTROLLÜ ELLE GİRİŞ (GÜNCELLENDİ) ---
  const handleInputChange = (text: string) => {
    setInputValue(text);
    const val = parseFloat(text.replace(',', '.'));
    
    if (!product) return;

    if (!isNaN(val) && val > 0) {
      // Girilen değerin stoğu aşıp aşmadığını kontrol et
      const totalRequested = buyingMode === 'crate' ? val * getCrateSize() : val;
      
      if (totalRequested <= product.stock) {
        setQuantity(val);
      } 
      // Eğer aşıyorsa quantity state'ini güncelleme (eski değerde kalsın)
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    Keyboard.dismiss(); 

    let finalQuantity = quantity;
    const crateSize = getCrateSize();

    if (buyingMode === 'crate') {
      finalQuantity = quantity * crateSize; 
    }

    // --- SON GÜVENLİK KONTROLÜ ---
    if (finalQuantity > product.stock) {
        Alert.alert("Hata", "Stok yetersiz!");
        return;
    }
    // -----------------------------

    const productToAdd = {
      ...product,
      quantity: finalQuantity
    };
    
    addItem(productToAdd);

    // Alert yerine Modalı Açıyoruz
    let title = "";
    let qtyMsg = "";

    if (buyingMode === 'crate') {
      title = `${quantity} Kasa ${product.name}`;
      qtyMsg = `Toplam ${finalQuantity} ${product.unit_type} eklendi.`;
    } else {
      title = `${product.name}`;
      qtyMsg = `${quantity} ${product.unit_type} eklendi.`;
    }

    setModalMessage({ title, quantity: qtyMsg });
    setModalVisible(true);
  };

  const calculateTotal = () => {
    if (!product) return 0;
    if (buyingMode === 'crate') {
      return product.price * getCrateSize() * quantity;
    }
    return product.price * quantity;
  };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#4CAF50" /></View>;
  if (!product) return <View style={styles.centerContainer}><Text>Ürün bulunamadı</Text></View>;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} 
      >
        <ScrollView style={styles.content}>
          
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image || 'https://via.placeholder.com/300' }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag" size={14} color="#4CAF50" />
              <Text style={styles.categoryText}>{product.category_name}</Text>
            </View>

            <Text style={styles.productName}>{product.name}</Text>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>₺{product.price.toFixed(2)}</Text>
              <Text style={styles.unit}>/ {product.unit_type}</Text>
            </View>

            <View style={styles.deliveryInfo}>
              <Ionicons name="time-outline" size={20} color="#FF9800" />
              <Text style={styles.deliveryText}>Siparişini şimdi ver, <Text style={{fontWeight: 'bold'}}>yarın kapında!</Text></Text>
            </View>

            {product.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Açıklama</Text>
                <Text style={styles.descriptionText}>{product.description}</Text>
              </View>
            )}
            
             <View style={styles.stockContainer}>
                <Ionicons
                  name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={product.stock > 0 ? '#4CAF50' : '#F44336'}
                />
                <Text style={[styles.stockText, !product.stock && styles.outOfStock]}>
                  {product.stock > 0 ? `Stokta var (${product.stock} ${product.unit_type})` : 'Stok Tükendi'}
                </Text>
              </View>
          </View>
        </ScrollView>

        {/* ALT MENÜ */}
        <View style={styles.footer}>
          
          <View style={styles.modeSelector}>
            <TouchableOpacity 
              style={[styles.modeButton, buyingMode === 'normal' && styles.activeMode]} 
              onPress={() => setBuyingMode('normal')}
            >
              <Text style={[styles.modeText, buyingMode === 'normal' && styles.activeModeText]}>
                Normal ({product.unit_type})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modeButton, buyingMode === 'crate' && styles.activeMode]} 
              onPress={() => setBuyingMode('crate')}
            >
              <Text style={[styles.modeText, buyingMode === 'crate' && styles.activeModeText]}>
                Kasa ({getCrateSize()} {product.unit_type})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controlsRow}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantityChange(-1)}>
                <Ionicons name="remove" size={20} color="#333" />
              </TouchableOpacity>

              <TextInput
                style={styles.qtyInput}
                value={inputValue}
                onChangeText={handleInputChange}
                keyboardType="numeric"
                selectTextOnFocus
              />
              
              <Text style={styles.qtyUnitLabel}>
                {buyingMode === 'crate' ? 'Kasa' : product.unit_type}
              </Text>

              <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantityChange(1)}>
                <Ionicons name="add" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.addButton, product.stock <= 0 && styles.addButtonDisabled]} // Stok 0 ise butonu pasif yap
              onPress={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <Text style={styles.addButtonText}>
                {product.stock > 0 ? 'Sepete Ekle' : 'Tükendi'}
              </Text>
              <Text style={styles.totalPrice}>₺{calculateTotal().toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- PREMIUM MODAL (Açılır Pencere) --- */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              {/* Başarılı İkonu */}
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </View>

              <Text style={styles.modalTitle}>Harika Seçim! 🍅</Text>
              
              <View style={styles.modalBody}>
                <Text style={styles.modalProductName}>{modalMessage.title}</Text>
                <Text style={styles.modalQuantity}>{modalMessage.quantity}</Text>
                <Text style={styles.modalSuccessText}>başarıyla sepete eklendi.</Text>
              </View>

              {/* Butonlar */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSecondary]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Alışverişe Dön</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    setModalVisible(false);
                    router.push('/(tabs)/cart');
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>Sepete Git</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" style={{marginLeft: 5}} />
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
        {/* --- MODAL BİTİŞ --- */}

      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  
  imageContainer: { width: '100%', height: 300, backgroundColor: 'white' },
  productImage: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, elevation: 5 },

  infoContainer: { backgroundColor: 'white', padding: 20, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 500 },
  
  categoryBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  categoryText: { fontSize: 14, color: '#4CAF50', fontWeight: '600', marginLeft: 4 },
  productName: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50' },
  unit: { fontSize: 18, color: '#666', marginLeft: 4 },
  deliveryInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginBottom: 20 },
  deliveryText: { marginLeft: 10, color: '#E65100', fontSize: 14 },
  descriptionContainer: { marginBottom: 20 },
  descriptionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  descriptionText: { fontSize: 16, color: '#666', lineHeight: 24 },
  stockContainer: { flexDirection: 'row', alignItems: 'center' },
  stockText: { fontSize: 16, color: '#4CAF50', fontWeight: '600', marginLeft: 8 },
  outOfStock: { color: '#F44336' },
  
  footer: { backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 30 },
  
  modeSelector: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4, marginBottom: 16 },
  modeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  activeMode: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  modeText: { fontWeight: '600', color: '#666' },
  activeModeText: { color: '#4CAF50', fontWeight: 'bold' },

  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },

  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 5, flex: 1 },
  qtyBtn: { width: 35, height: 35, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  qtyInput: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#333', paddingVertical: 0 },
  qtyUnitLabel: { fontSize: 12, color: '#666', marginRight: 5 },

  addButton: { flex: 1.5, backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  addButtonDisabled: { backgroundColor: '#ccc' },
  addButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  totalPrice: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  // --- PREMIUM MODAL STİLLERİ ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '85%', borderRadius: 24, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  successIconContainer: { marginBottom: 15, backgroundColor: '#E8F5E9', borderRadius: 50, padding: 0 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  modalBody: { alignItems: 'center', marginBottom: 25 },
  modalProductName: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  modalQuantity: { fontSize: 16, color: '#666', marginTop: 5, fontWeight: '600' },
  modalSuccessText: { fontSize: 14, color: '#888', marginTop: 5 },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalButtonSecondary: { backgroundColor: '#f5f5f5', marginRight: 10 },
  modalButtonPrimary: { backgroundColor: '#4CAF50', flexDirection: 'row', marginLeft: 10 },
  modalButtonTextSecondary: { color: '#666', fontWeight: 'bold', fontSize: 15 },
  modalButtonTextPrimary: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});