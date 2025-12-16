import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { categoryService } from '../../services/api';
import { Category } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 50) / 2;

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* --- PREMIUM HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kategoriler</Text>
        <Ionicons name="grid-outline" size={24} color="rgba(255,255,255,0.8)" />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.9}
            onPress={() => router.push(`/category/${item.id}`)}
          >
            {/* Resim Alanı */}
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
                style={styles.image} 
                resizeMode="cover"
              />
            </View>

            {/* İsim ve İkon Alanı */}
            <View style={styles.cardContent}>
              {/* DÜZELTME BURADA: numberOfLines={1} kaldırıldı. Artık alt satıra geçebilir. */}
              <Text style={styles.categoryName}>{item.name}</Text>
              <View style={styles.iconCircle}>
                <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // --- HEADER ---
  header: { 
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
    zIndex: 10
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },

  // --- LİSTE ---
  listContent: { padding: 20, paddingTop: 25 },
  columnWrapper: { justifyContent: 'space-between' },

  // --- KART TASARIMI ---
  card: { 
    width: CARD_WIDTH,
    backgroundColor: 'white', 
    borderRadius: 20, 
    marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    overflow: 'hidden'
  },
  imageContainer: {
    height: 110,
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60 // İki satır olduğunda kartın çok sıkışmaması için minimum yükseklik
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1, 
    marginRight: 5,
    flexWrap: 'wrap' // Yazının taşmasını önler, alt satıra atar
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center' // İkonu dikeyde ortalar
  }
});