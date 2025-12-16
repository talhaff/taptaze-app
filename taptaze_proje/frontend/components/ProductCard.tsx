import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
  // Yeni eklenen opsiyonel prop'lar
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function ProductCard({ product, isFavorite = false, onToggleFavorite }: ProductCardProps) {
  const { addItem } = useCart();
  const defaultImage = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

  return (
    <Link href={`/product/${product.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        
        {/* --- FAVORİ BUTONU (YENİ) --- */}
        {onToggleFavorite && (
          <TouchableOpacity 
            style={styles.favButton} 
            onPress={(e) => {
              e.preventDefault(); // Detay sayfasına gitmesini engeller
              onToggleFavorite();
            }}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={20} 
              color={isFavorite ? "#FF5252" : "#999"} 
            />
          </TouchableOpacity>
        )}
        {/* --------------------------- */}

        <Image
          source={{ uri: product.image ? product.image : defaultImage }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.content}>
          <Text style={styles.category}>{product.category_name}</Text>
          <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
          <View style={styles.footer}>
            <Text style={styles.price}>
              ₺{product.price.toFixed(2)} <Text style={styles.unit}>/ {product.unit_type}</Text>
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={(e) => {
                e.preventDefault(); // Detay sayfasına gitmesini engeller
                addItem(product);
              }}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden', position: 'relative' },
  
  // --- EKLENEN FAVORİ BUTON STİLİ ---
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10, // Resmin üzerinde dursun
    backgroundColor: 'rgba(255,255,255,0.9)', // Arkası hafif beyaz olsun ki görünsün
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 2
  },
  // ----------------------------------

  image: { width: '100%', height: 150, backgroundColor: '#f5f5f5' },
  content: { padding: 12 },
  category: { fontSize: 12, color: '#666', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
  unit: { fontSize: 12, color: '#666', fontWeight: 'normal' },
  addButton: { backgroundColor: '#4CAF50', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});