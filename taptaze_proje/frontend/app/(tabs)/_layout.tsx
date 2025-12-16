import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';

export default function TabLayout() {
  const { items } = useCart(); // Yeni sistemde sepeti böyle çağırıyoruz

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50', // Yeşil renk
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Üstteki varsayılan başlığı gizle
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

    <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoriler',
          tabBarIcon: ({ color }) => <Ionicons name="heart" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Kategoriler',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Sepet',
          tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} />,
          // İŞTE HATAYI ÇÖZEN KISIM BURASI:
          // Eskiden getItemCount() vardı, şimdi items.length kullanıyoruz.
          tabBarBadge: items.length > 0 ? items.length : undefined,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Yönetim',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}