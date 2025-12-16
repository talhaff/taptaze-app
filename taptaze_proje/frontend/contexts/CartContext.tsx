import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart();
  }, [items]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('@cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Sepet yüklenirken hata:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('@cart', JSON.stringify(items));
    } catch (error) {
      console.error('Sepet kaydedilirken hata:', error);
    }
  };

  // --- KRİTİK DÜZELTME BURADA ---
  const addItem = (product: Product) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      
      // Ürün detay sayfasından gelen miktar (quantity) var mı? Yoksa 1 kabul et.
      // @ts-ignore (Bazı tiplerde quantity property'si görünmeyebilir, bunu yoksayalım)
      const amountToAdd = product.quantity || 1; 

      if (existingItem) {
        // Ürün zaten varsa, üzerine gelen miktarı ekle (Eskiden burası +1 idi)
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + amountToAdd }
            : item
        );
      }
      
      // Ürün yoksa yeni ekle (Miktarı belirterek)
      return [...currentItems, { ...product, quantity: amountToAdd }];
    });
  };
  // -----------------------------

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Toplam Tutar Hesabı
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}