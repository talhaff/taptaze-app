import pymongo
import os
from dotenv import load_dotenv

# .env dosyasındaki MONGO_URL ve DB_NAME bilgilerini çekiyoruz
load_dotenv()

# --- AYARLAR ---
# Resimler için Render linkini kullanmalısın ki internetten çekebilsin
RENDER_URL = "https://taptaze-backend.onrender.com"
BASE_URL = f"{RENDER_URL}/static"

# --- 1. BULUT VERİTABANI BAĞLANTISI (DÜZELTİLDİ) ---
# Bilgisayarındaki localhost'u değil, .env içindeki Atlas linkini kullanıyoruz
MONGO_URI = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "TaptazeDB")

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]

# --- 6. ADMİN KULLANICISI OLUŞTURMA (BCRYPT İLE) ---
import bcrypt

admin_password_plain = "123"  # Değiştirmek istersen buradan yapabilirsin
hashed_pw = bcrypt.hashpw(admin_password_plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"🔐 Yönetici şifresi (hashlenmiş): {hashed_pw}")
admin_user = {
    "full_name": "Talha Ozcan1",
    "email": "talha1@taptaze.com",  # Buraya kendi mailini yazabilirsin
    "username": "admin1",           # server.py login için username kullanıyor
    "password": hashed_pw,
    "role": "admin"
}

# Eğer şifreleme kullanıyorsan server.py üzerinden bir kez kayıt olup 
# Atlas'tan rolünü admin yapmanı öneririm.
db.users.insert_one(admin_user)
print("👑 Yönetici hesabı oluşturuldu: talha@taptaze.com / 123")

# --- 2. TEMİZLİK ---
db.products.delete_many({})
db.categories.delete_many({})
db.orders.delete_many({}) 
print(f"🧹 {DB_NAME} veritabanı temizlendi...")

# --- 3. KATEGORİ EKLEME ---
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

# --- 4. ÜRÜN LİSTESİ ---
products = [
    {
        "name": "Domates",
        "category_id": str(cat_sebze),
        "price": 25.0,
        "unit_type": "KG",
        "stock": 100,
        "description": "Taze yerli salkım domates",
        "image": f"{BASE_URL}/domates.jpeg"
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
    }
]

# --- 5. KAYDETME İŞLEMİ ---
db.products.insert_many(products)
print(f"🚀 Başarılı! Ürünler {DB_NAME} veritabanına (Atlas) yüklendi.")
print(f"📷 Resimler {BASE_URL} üzerinden aranacak.")