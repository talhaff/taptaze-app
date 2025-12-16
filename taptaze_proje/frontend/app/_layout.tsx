import { Stack } from 'expo-router';
import { CartProvider } from '../contexts/CartContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    // Bütün uygulamayı Sepet Sağlayıcısı (CartProvider) ile sarıyoruz
    // Böylece her yerden sepete erişebiliyoruz.
    <CartProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="product/[id]" 
          options={{ 
            headerShown: true, 
            title: 'Ürün Detayı',
            headerBackTitle: 'Geri',
            headerTintColor: '#4CAF50'
          }} 
        />
        <Stack.Screen 
          name="category/[id]" 
          options={{ 
            headerShown: true, 
            title: 'Kategori',
            headerBackTitle: 'Geri',
            headerTintColor: '#4CAF50'
          }} 
        />
      </Stack>
    </CartProvider>
  );
}