import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, RefreshControl, Image, TouchableOpacity, ScrollView, Dimensions, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { productService, categoryService } from '../../services/api';
import { Product, Category } from '../../types';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../contexts/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage'; // EKLENDİ

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // --- FAVORİ STATE'İ (YENİ EKLENDİ) ---
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  // ------------------------------------

  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadFavorites(); // Favorileri de yükle
    }, [])
  );

  const fetchData = async () => {
    try {
      const [prodData, catData] = await Promise.all([
        productService.getAll(undefined, search),
        categoryService.getAll()
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (error) {
      console.error('Veri hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- FAVORİ YÜKLEME VE KAYDETME FONKSİYONLARI (YENİ) ---
  const loadFavorites = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@favorites');
      setFavoriteIds(jsonValue != null ? JSON.parse(jsonValue) : []);
    } catch(e) {
      console.error(e);
    }
  };

  const toggleFavorite = async (product: Product) => {
    try {
      let newFavs = [...favoriteIds];
      if (newFavs.includes(product.id)) {
        newFavs = newFavs.filter(id => id !== product.id); // Çıkar
      } else {
        newFavs.push(product.id); // Ekle
      }
      setFavoriteIds(newFavs);
      await AsyncStorage.setItem('@favorites', JSON.stringify(newFavs));
    } catch (e) {
      console.error(e);
    }
  };
  // -------------------------------------------------------

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    loadFavorites();
  };

  // --- LİSTE BAŞLIĞI (Sadece Banner ve Kategoriler - Arama Buradan Çıktı) ---
  const renderListHeader = () => (
    <View>
      {/* Kampanya Banner'ı */}
      {!search && (
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Haftanın{'\n'}Fırsatları</Text>
            <Text style={styles.bannerSubtitle}>Taze ürünlerde %20'ye varan indirimler!</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>İncele</Text>
            </TouchableOpacity>
          </View>
          <Ionicons name="basket" size={120} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
        </View>
      )}

      {/* Kategoriler */}
      {!search && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
              <Text style={styles.seeAll}>Tümü</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryItem}
                onPress={() => router.push(`/category/${cat.id}`)}
              >
                <View style={styles.categoryImageWrapper}>
                  <Image 
                    source={{ uri: cat.image || 'https://via.placeholder.com/60' }} 
                    style={styles.categoryImage} 
                  />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ürünler Başlığı */}
      <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 20, marginBottom: 10 }]}>
        {search ? 'Arama Sonuçları' : 'Sizin İçin Seçtiklerimiz'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {/* --- SABİT ÜST KISIM (Klavye sorununu çözen yer) --- */}
      <View style={styles.fixedHeader}>
        {/* Selamlama ve Sepet */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.welcomeText}>Merhaba, Talha 👋</Text>
            <Text style={styles.locationText}>
              <Ionicons name="location-sharp" size={14} color="#4CAF50" /> Malatya, Kampüs
            </Text>
          </View>
          <TouchableOpacity style={styles.headerCartButton} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={24} color="#333" />
            {items.length > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>

        {/* Arama Çubuğu */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Canın ne çekiyor?"
            placeholderTextColor="#999"
            value={search}
            onChangeText={(t) => {
               setSearch(t);
               if(t.length > 1 || t.length === 0) fetchData();
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearch('');
              Keyboard.dismiss();
              fetchData();
            }}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* --- SABİT KISIM BİTİŞ --- */}

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          ListHeaderComponent={renderListHeader}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2} 
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              {/* ProductCard'a favori props'larını gönderiyoruz */}
              <ProductCard 
                product={item} 
                isFavorite={favoriteIds.includes(item.id)}
                onToggleFavorite={() => toggleFavorite(item)}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="nutrition-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Ürün bulunamadı.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  
  // Sabit Header Stilleri
  fixedHeader: {
    backgroundColor: 'white',
    paddingTop: 50, // Çentik payı
    paddingBottom: 15,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100, // Üstte kalsın diye
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  locationText: { fontSize: 13, color: '#666', marginTop: 2 },
  headerCartButton: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 12 },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },

  // Arama
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 15, height: 46 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 15, color: '#333' },

  // Liste İçeriği
  listContent: { paddingBottom: 100, paddingTop: 10 },
  loader: { marginTop: 100 },

  // Banner
  bannerContainer: { backgroundColor: '#4CAF50', marginHorizontal: 20, marginTop: 10, borderRadius: 20, padding: 20, height: 160, overflow: 'hidden', justifyContent: 'center' },
  bannerContent: { zIndex: 2 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  bannerSubtitle: { fontSize: 14, color: '#E8F5E9', marginBottom: 15, width: '70%' },
  bannerButton: { backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'flex-start' },
  bannerButtonText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12 },
  bannerIcon: { position: 'absolute', right: -20, bottom: -20, zIndex: 1 },

  // Kategoriler
  sectionContainer: { marginTop: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  seeAll: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  categoriesScroll: { paddingLeft: 20 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryImageWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', padding: 4, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  categoryImage: { width: '100%', height: '100%', borderRadius: 32 },
  categoryName: { fontSize: 12, color: '#555', fontWeight: '500' },

  // Ürün Grid
  row: { justifyContent: 'space-between', paddingHorizontal: 20 },
  cardWrapper: { width: (width - 50) / 2, marginBottom: 15 },
  
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#999' }
});