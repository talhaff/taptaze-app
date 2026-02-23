import { Stack } from 'expo-router';
import { CartProvider } from '../contexts/CartContext';

export default function RootLayout() {
  return (
    <CartProvider>
      <Stack initialRouteName="login"> 
        {/* initialRouteName="login" diyerek uygulamanın login ile açılmasını zorunlu kıldık */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen name="verify" options={{ title: 'Doğrulama' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </CartProvider>
  );
}