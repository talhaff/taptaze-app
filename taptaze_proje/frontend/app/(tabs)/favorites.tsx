import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { productService } from '../../services/api';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const jsonValue = await AsyncStorage.getItem('@favorites');
      const savedIds = jsonValue != null ? JSON.parse(jsonValue) : [];

      if (savedIds.length === 0) {
        setFavorites([]);
        return;
      }

      const allProducts = await productService.getAll();
      const favProducts = allProducts.filter((p: Product) => savedIds.includes(p.id));
      setFavorites(favProducts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const jsonValue = await AsyncStorage.getItem('@favorites');
      let savedIds = jsonValue != null ? JSON.parse(jsonValue) : [];
      savedIds = savedIds.filter((savedId: string) => savedId !== id);
      await AsyncStorage.setItem('@favorites', JSON.stringify(savedIds));
      setFavorites(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      Alert.alert('Hata', 'İşlem başarısız');
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    Alert.alert('Harika', `${product.name} sepete eklendi! 🛒`);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      {/* SİLME BUTONU */}
      <TouchableOpacity 
        style={styles.removeButton} 
        onPress={() => removeFavorite(item.id)}
      >
        <Ionicons name="close" size={16} color="#FF5252" />
      </TouchableOpacity>

      {/* ÜRÜN RESMİ */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
          style={styles.image} 
          resizeMode="cover"
        />
      </View>

      {/* BİLGİLER */}
      <View style={styles.content}>
        <Text style={styles.category}>{item.category_name}</Text>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.price}>
            ₺{item.price} <Text style={styles.unit}>/ {item.unit_type}</Text>
          </Text>
        </View>

        {/* SEPETE EKLE */}
        <TouchableOpacity 
          style={styles.addToCartButton} 
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addToCartText}>Sepete Ekle</Text>
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={16} color="#4CAF50" />
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* --- YEŞİL HEADER (GÜNCELLENDİ) --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Favorilerim </Text>
          <Text style={styles.headerSubtitle}>
            {favorites.length > 0 ? `${favorites.length} ürün kayıtlı` : 'Listeniz boş'}
          </Text>
        </View>
        {/* İkon Kutusu */}
        <View style={styles.headerIconContainer}>
          <Ionicons name="bookmark" size={24} color="white" />
        </View>
      </View>
      {/* ---------------------------------- */}

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 50 }} />
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-circle" size={80} color="#E0E0E0" />
          </View>
          <Text style={styles.emptyText}>Listeniz Henüz Boş</Text>
          <Text style={styles.emptySubText}>Beğendiğiniz ürünlerin üzerindeki{'\n'}kalp ikonuna dokunun.</Text>
          
          <TouchableOpacity style={styles.goHomeButton} onPress={() => router.push('/(tabs)/home')}>
            <Text style={styles.goHomeText}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  
  // --- YEŞİL HEADER STİLLERİ ---
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4CAF50', // YEŞİL RENK
    paddingTop: 60, 
    paddingBottom: 25, 
    paddingHorizontal: 25, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    shadowColor: '#4CAF50', 
    shadowOpacity: 0.2, 
    shadowRadius: 10,
    elevation: 8, 
    zIndex: 10
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' }, // BEYAZ YAZI
  headerSubtitle: { fontSize: 14, color: '#E8F5E9', marginTop: 4, fontWeight: '500' }, // AÇIK YEŞİL ALTYAZI
  headerIconContainer: { 
    width: 50, 
    height: 50, 
    backgroundColor: 'rgba(255,255,255,0.2)', // YARI SAYDAM BEYAZ KUTU
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  // -----------------------------

  listContent: { padding: 15, paddingBottom: 100, paddingTop: 20 },
  row: { justifyContent: 'space-between' },

  card: { 
    width: (width - 45) / 2, 
    backgroundColor: 'white', 
    borderRadius: 20, 
    marginBottom: 15, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 3,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  imageContainer: { padding: 8 },
  image: { width: '100%', height: 120, borderRadius: 16, backgroundColor: '#f9f9f9' },
  
  removeButton: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    zIndex: 10, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    elevation: 2
  },

  content: { paddingHorizontal: 10, paddingBottom: 12 },
  category: { fontSize: 10, color: '#999', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 2, marginBottom: 4 },
  
  footer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  unit: { fontSize: 11, color: '#999', fontWeight: 'normal' },
  
  addToCartButton: { 
    flexDirection: 'row', 
    backgroundColor: '#333', 
    paddingVertical: 6, 
    paddingHorizontal: 4,
    borderRadius: 12, 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6
  },
  addToCartText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  iconCircle: { width: 22, height: 22, backgroundColor: 'white', borderRadius: 11, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyIconCircle: { marginBottom: 20, opacity: 0.5 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptySubText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 20 },
  goHomeButton: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, shadowColor: '#4CAF50', shadowOpacity: 0.3, elevation: 5 },
  goHomeText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});