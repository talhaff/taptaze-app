import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService, orderService, productService, categoryService } from '../../services/api';
import { Order, Product, Category } from '../../types';

export default function AdminScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // İSTATİSTİK STATE'İ (YENİ)
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_orders: 0,
    pending_orders: 0,
    total_products: 0
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Aşağı çekip yenileme için

  // Düzenleme & Ürün Ekleme State'leri
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', unit_type: 'KG', stock: '', category_id: '', description: '', image: '' 
  });

  const handleLogin = async () => {
    try {
      setLoading(true);
      await adminService.login(username, password);
      setIsLoggedIn(true);
      loadData();
    } catch (error) {
      Alert.alert('Hata', 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const [ordersData, productsData, categoriesData, statsData] = await Promise.all([
        orderService.getAll(),
        productService.getAll(),
        categoryService.getAll(),
        adminService.getStats() // İstatistikleri de çekiyoruz
      ]);
      
      setOrders(ordersData);
      setProducts(productsData);
      setCategories(categoriesData);
      setStats(statsData); // İstatistikleri kaydet

      if (categoriesData.length > 0 && !newProduct.category_id) {
        setNewProduct(prev => ({ ...prev, category_id: categoriesData[0].id }));
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Aşağı çekince yenileme fonksiyonu
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  // --- İŞLEM FONKSİYONLARI (Silme, Güncelleme vb.) ---
  const handleDeleteOrder = async (id: string) => {
    Alert.alert("Siparişi Gizle", "Listeden kaldırmak istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Gizle", style: 'destructive', onPress: async () => { try { await orderService.delete(id); loadData(); } catch (e) { Alert.alert('Hata', 'Silinemedi'); } } }
    ]);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try { await orderService.updateStatus(id, status); loadData(); } catch (e) { Alert.alert('Hata', 'Güncellenemedi'); }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.category_id) { Alert.alert('Eksik', 'Kategori seçin'); return; }
    try {
      setLoading(true);
      await adminService.createProduct({ ...newProduct, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock) });
      Alert.alert('Başarılı', 'Ürün eklendi ✅');
      setNewProduct(prev => ({ name: '', price: '', unit_type: 'KG', stock: '', description: '', image: '', category_id: prev.category_id }));
      loadData(); 
    } catch (e) { Alert.alert('Hata', 'Hata oluştu'); } finally { setLoading(false); }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      setLoading(true);
      await adminService.updateProduct(editingProduct.id, { ...editingProduct, price: parseFloat(editingProduct.price), stock: parseInt(editingProduct.stock) });
      Alert.alert('Harika', 'Güncellendi ✨');
      setEditModalVisible(false);
      loadData();
    } catch (e) { Alert.alert('Hata', 'Güncellenemedi'); } finally { setLoading(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert("Sil", "Emin misin?", [{ text: "Vazgeç", style: "cancel" }, { text: "Sil", style: 'destructive', onPress: async () => { try { await adminService.deleteProduct(id); loadData(); } catch (e) { Alert.alert('Hata', 'Silinemedi'); } } }]);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct({ ...product, price: product.price.toString(), stock: product.stock.toString() });
    setEditModalVisible(true);
  };

  // --- GİRİŞ EKRANI ---
  if (!isLoggedIn) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.logoCircle}><Ionicons name="shield-checkmark" size={50} color="#4CAF50" /></View>
          <Text style={styles.loginTitle}>Yönetici Paneli</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.loginInput} placeholder="Kullanıcı Adı" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput style={styles.loginInput} placeholder="Şifre" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>Giriş Yap</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- PANEL BİLEŞENİ (Dashboard Kartları Buraya Eklendi) ---
  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      {/* 1. Satır */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <View style={[styles.statIcon, { backgroundColor: '#C8E6C9' }]}>
            <Ionicons name="wallet-outline" size={24} color="#2E7D32" />
          </View>
          <View>
            <Text style={styles.statLabel}>Toplam Ciro</Text>
            <Text style={[styles.statValue, { color: '#2E7D32' }]}>₺{stats.total_revenue.toFixed(2)}</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE0B2' }]}>
            <Ionicons name="time-outline" size={24} color="#E65100" />
          </View>
          <View>
            <Text style={styles.statLabel}>Bekleyen</Text>
            <Text style={[styles.statValue, { color: '#E65100' }]}>{stats.pending_orders} Sipariş</Text>
          </View>
        </View>
      </View>

      {/* 2. Satır */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <View style={[styles.statIcon, { backgroundColor: '#BBDEFB' }]}>
            <Ionicons name="cart-outline" size={24} color="#1565C0" />
          </View>
          <View>
            <Text style={styles.statLabel}>Toplam Sipariş</Text>
            <Text style={[styles.statValue, { color: '#1565C0' }]}>{stats.total_orders}</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
          <View style={[styles.statIcon, { backgroundColor: '#E1BEE7' }]}>
            <Ionicons name="cube-outline" size={24} color="#6A1B9A" />
          </View>
          <View>
            <Text style={styles.statLabel}>Ürün Çeşidi</Text>
            <Text style={[styles.statValue, { color: '#6A1B9A' }]}>{stats.total_products}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yönetim Paneli</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* DASHBOARD KARTLARI (HEADER'IN HEMEN ALTINDA) */}
      {renderDashboard()}

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'orders' && styles.activeTab]} onPress={() => setActiveTab('orders')}>
          <Ionicons name="list" size={18} color={activeTab === 'orders' ? 'white' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Siparişler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'products' && styles.activeTab]} onPress={() => setActiveTab('products')}>
          <Ionicons name="cube" size={18} color={activeTab === 'products' ? 'white' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Ürünler</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing && <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />}

      {activeTab === 'orders' ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Henüz sipariş yok.</Text>}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderIdContainer}>
                  <Ionicons name="receipt-outline" size={16} color="#4CAF50" />
                  <Text style={styles.orderId}> Sipariş #{item.id.slice(-4)}</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'Beklemede' ? '#FFF3E0' : '#E8F5E9', marginRight: 10 }]}>
                    <Text style={[styles.statusText, { color: item.status === 'Beklemede' ? '#F57C00' : '#2E7D32' }]}>{item.status}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteOrder(item.id)} style={styles.deleteOrderButton}>
                     <Ionicons name="trash-outline" size={18} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{item.customer_name}</Text>
                <Text style={styles.customerPhone}>{item.customer_phone}</Text>
                <Text style={styles.customerAddress}>{item.delivery_address}</Text>
              </View>
              <View style={styles.itemList}>
                {item.items.map((prod, index) => (
                  <Text key={index} style={styles.orderItem}>• {prod.product_name} <Text style={{color: '#888'}}>x{prod.quantity} {prod.unit_type}</Text></Text>
                ))}
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.totalAmount}>Toplam: ₺{item.total_amount.toFixed(2)}</Text>
                {item.status === 'Beklemede' && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => updateOrderStatus(item.id, 'Teslim Edildi')}>
                    <Text style={styles.actionButtonText}>Teslim Et</Text>
                    <Ionicons name="checkmark-circle" size={18} color="white" style={{marginLeft: 5}} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.addProductCard}>
            <Text style={styles.cardTitle}>Yeni Ürün Ekle</Text>
            <TextInput style={styles.input} placeholder="Ürün Adı" value={newProduct.name} onChangeText={(t) => setNewProduct({...newProduct, name: t})} />
            <View style={styles.rowInputs}>
              <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Fiyat (₺)" keyboardType="numeric" value={newProduct.price} onChangeText={(t) => setNewProduct({...newProduct, price: t})} />
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Stok" keyboardType="numeric" value={newProduct.stock} onChangeText={(t) => setNewProduct({...newProduct, stock: t})} />
            </View>
            <Text style={styles.label}>Kategori Seç:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity key={cat.id} style={[styles.categoryChip, newProduct.category_id === cat.id && styles.categoryChipActive]} onPress={() => setNewProduct({...newProduct, category_id: cat.id})}>
                  <Text style={[styles.categoryChipText, newProduct.category_id === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={styles.input} placeholder="Resim Linki (URL)" value={newProduct.image} onChangeText={(t) => setNewProduct({...newProduct, image: t})} />
            <TextInput style={styles.input} placeholder="Açıklama" value={newProduct.description} onChangeText={(t) => setNewProduct({...newProduct, description: t})} />
            <TouchableOpacity style={styles.saveProductButton} onPress={handleCreateProduct}>
              <Text style={styles.saveProductText}>Ürünü Kaydet</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>Mevcut Ürünler ({products.length})</Text>
          {products.map((item) => (
            <View key={item.id} style={styles.productRow}>
              <Image source={{ uri: item.image || 'https://via.placeholder.com/40' }} style={styles.productRowImage} />
              <View style={{flex: 1, marginLeft: 10}}>
                <Text style={styles.productRowName}>{item.name}</Text>
                <Text style={styles.productRowPrice}>₺{item.price}</Text>
              </View>
              <View style={{flexDirection: 'row'}}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={[styles.iconButton, {backgroundColor: '#E3F2FD', marginRight: 8}]}>
                  <Ionicons name="pencil" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteProduct(item.id)} style={[styles.iconButton, {backgroundColor: '#FFEBEE'}]}>
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODAL */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ürünü Düzenle</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {editingProduct && (
                <>
                  <Text style={styles.label}>Ürün Adı</Text>
                  <TextInput style={styles.input} value={editingProduct.name} onChangeText={(t) => setEditingProduct({...editingProduct, name: t})} />
                  <View style={styles.rowInputs}>
                    <View style={{flex: 1, marginRight: 10}}><Text style={styles.label}>Fiyat</Text><TextInput style={styles.input} keyboardType="numeric" value={editingProduct.price} onChangeText={(t) => setEditingProduct({...editingProduct, price: t})} /></View>
                    <View style={{flex: 1}}><Text style={styles.label}>Stok</Text><TextInput style={styles.input} keyboardType="numeric" value={editingProduct.stock} onChangeText={(t) => setEditingProduct({...editingProduct, stock: t})} /></View>
                  </View>
                  <Text style={styles.label}>Kategori</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map((cat) => (
                      <TouchableOpacity key={cat.id} style={[styles.categoryChip, editingProduct.category_id === cat.id && styles.categoryChipActive]} onPress={() => setEditingProduct({...editingProduct, category_id: cat.id})}>
                        <Text style={[styles.categoryChipText, editingProduct.category_id === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={styles.label}>Resim URL</Text>
                  <TextInput style={styles.input} value={editingProduct.image} onChangeText={(t) => setEditingProduct({...editingProduct, image: t})} />
                  <Text style={styles.label}>Açıklama</Text>
                  <TextInput style={styles.input} value={editingProduct.description} onChangeText={(t) => setEditingProduct({...editingProduct, description: t})} />
                  <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProduct}><Text style={styles.updateButtonText}>Güncelle</Text></TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  // DASHBOARD STİLLERİ (YENİ)
  dashboardContainer: { paddingHorizontal: 15, marginTop: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statCard: { flex: 0.48, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  statIcon: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statLabel: { fontSize: 12, color: '#666', marginBottom: 2, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: 'bold' },

  // DİĞER STİLLER AYNI...
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 20 },
  loginCard: { backgroundColor: 'white', width: '100%', padding: 30, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 5 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, width: '100%', height: 50, borderWidth: 1, borderColor: '#eee' },
  inputIcon: { marginRight: 10 },
  loginInput: { flex: 1, color: '#333' },
  loginButton: { backgroundColor: '#4CAF50', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  header: { backgroundColor: '#4CAF50', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, elevation: 5, zIndex: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  refreshButton: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 10, marginBottom: 20, backgroundColor: 'white', borderRadius: 12, padding: 5, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  tabButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#4CAF50' },
  tabText: { fontWeight: '600', color: '#666', marginLeft: 8 },
  activeTabText: { color: 'white' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  orderCard: { backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderIdContainer: { flexDirection: 'row', alignItems: 'center' },
  orderId: { fontWeight: 'bold', color: '#333' },
  deleteOrderButton: { padding: 8, backgroundColor: '#FFEBEE', borderRadius: 8, marginLeft: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  customerInfo: { marginBottom: 10 },
  customerName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  customerPhone: { color: '#666', fontSize: 14 },
  customerAddress: { color: '#666', fontSize: 13, marginTop: 2 },
  itemList: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, marginBottom: 10 },
  orderItem: { fontSize: 14, color: '#333', marginBottom: 2 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  actionButton: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center' },
  actionButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  addProductCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  input: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  rowInputs: { flexDirection: 'row' },
  saveProductButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveProductText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10 },
  productRow: { flexDirection: 'row', backgroundColor: 'white', padding: 10, borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  productRowImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#eee' },
  productRowName: { fontWeight: '600', color: '#333' },
  productRowPrice: { color: '#4CAF50', fontWeight: 'bold' },
  iconButton: { padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  label: { fontWeight: '600', color: '#666', marginBottom: 8, marginLeft: 2 },
  categoryScroll: { flexDirection: 'row', marginBottom: 15 },
  categoryChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F0F0F0', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#eee' },
  categoryChipActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  categoryChipText: { color: '#666', fontWeight: '600', fontSize: 13 },
  categoryChipTextActive: { color: '#4CAF50', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  updateButton: { backgroundColor: '#2196F3', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  updateButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});