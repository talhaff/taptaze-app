import pymongo

# AYARLAR (Burası Doğru)
IP_ADRESI = "192.168.1.161"
PORT = "8000"
BASE_URL = f"http://{IP_ADRESI}:{PORT}/static"

# 1. VERİTABANI BAĞLANTISI
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["test_database"] 

# 2. TEMİZLİK
db.products.delete_many({})
db.categories.delete_many({})
db.orders.delete_many({}) 
print("🧹 Eski veriler temizlendi, dükkan boşaltıldı...")

# 3. KATEGORİ EKLEME 
# (Burada da BASE_URL kullanmalıyız. Eğer kapak foton yoksa şimdilik boş bırakabilirsin ama doğrusu budur)
cat_sebze = db.categories.insert_one({
    "name": "Sebzeler",
    "image": f"{BASE_URL}/sebze.jpeg" 
}).inserted_id

cat_meyve = db.categories.insert_one({
    "name": "Meyveler",
    "image": f"{BASE_URL}/meyve.jpeg"
}).inserted_id

cat_salata = db.categories.insert_one({
    "name": "Salata Malzemeleri",
    "image": f"{BASE_URL}/salata.jpeg"
}).inserted_id

print("✅ Kategoriler eklendi.")

# 4. ÜRÜN LİSTESİ (DÜZELTİLDİ: Artık senin bilgisayarından çekecek)
# ---------------------------------------------------------
products = [
    # --- SEBZELER ---
    {
        "name": "Domates",
        "category_id": str(cat_sebze),
        "price": 25.0,
        "unit_type": "KG",
        "stock": 100,
        "description": "Taze yerli salkım domates",
        "image": f"{BASE_URL}/domates.jpeg"  # <--- BAK BURAYI DEĞİŞTİRDİM
    },
    {
        "name": "Patates",
        "category_id": str(cat_sebze),
        "price": 15.0,
        "unit_type": "KG",
        "stock": 200,
        "description": "Kızartmalık sarı patates",
        "image": f"{BASE_URL}/patates.jpeg"
    },
    {
        "name": "Soğan",
        "category_id": str(cat_sebze),
        "price": 12.0,
        "unit_type": "KG",
        "stock": 150,
        "description": "Kuru yemeklik soğan",
        "image": f"{BASE_URL}/sogan.jpeg"
    },
    {
        "name": "Biber",
        "category_id": str(cat_sebze),
        "price": 28.0,
        "unit_type": "KG",
        "stock": 90,
        "description": "Dolmalık çarliston biber",
        "image": f"{BASE_URL}/biber.jpeg"
    },

    # --- SALATA MALZEMELERİ ---
    {
        "name": "Salatalık",
        "category_id": str(cat_salata),
        "price": 20.0,
        "unit_type": "KG",
        "stock": 80,
        "description": "Çıtır Çengelköy salatalığı",
        "image": f"{BASE_URL}/salatalik.jpeg"
    },
    {
        "name": "Marul",
        "category_id": str(cat_salata),
        "price": 10.0,
        "unit_type": "ADET",
        "stock": 70,
        "description": "Kıvırcık marul",
        "image": f"{BASE_URL}/marul.jpeg"
    },
    {
        "name": "Roka",
        "category_id": str(cat_salata),
        "price": 8.0,
        "unit_type": "DEMET",
        "stock": 50,
        "description": "Taze günlük roka",
        "image": f"{BASE_URL}/roka.jpeg"
    },
    {
        "name": "Maydanoz",
        "category_id": str(cat_salata),
        "price": 5.0,
        "unit_type": "DEMET",
        "stock": 50,
        "description": "Mis kokulu maydanoz",
        "image": f"{BASE_URL}/maydanoz.jpeg"
    },

    # --- MEYVELER ---
    {
        "name": "Kivi",
        "category_id": str(cat_meyve),
        "price": 45.0,
        "unit_type": "KG",
        "stock": 60,
        "description": "Ekşi tatlı kivi",
        "image": f"{BASE_URL}/kivi.jpeg"
    },
    {
        "name": "Elma",
        "category_id": str(cat_meyve),
        "price": 30.0,
        "unit_type": "KG",
        "stock": 50,
        "description": "Amasya elması",
        "image": f"{BASE_URL}/elma.jpeg"
    },
    {
        "name": "Muz",
        "category_id": str(cat_meyve),
        "price": 55.0,
        "unit_type": "KG",
        "stock": 120,
        "description": "İthal muz",
        "image": f"{BASE_URL}/muz.jpeg"
    },
    {
        "name": "Portakal",
        "category_id": str(cat_meyve),
        "price": 22.0,
        "unit_type": "KG",
        "stock": 100,
        "description": "Sulu Washington portakalı",
        "image": f"{BASE_URL}/portakal.jpeg"
    },
    {
        "name": "Mandalina",
        "category_id": str(cat_meyve),
        "price": 18.0,
        "unit_type": "KG",
        "stock": 110,
        "description": "Çekirdeksiz mandalina",
        "image": f"{BASE_URL}/mandalina.jpeg"
    }
]

# 5. KAYDETME İŞLEMİ
db.products.insert_many(products)
print(f"🚀 Harika! Bütün ürünler yüklendi. Resimler {BASE_URL} adresinden çekiliyor.")