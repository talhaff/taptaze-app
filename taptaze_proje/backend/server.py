from fastapi import FastAPI, APIRouter, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import bcrypt
from fastapi.staticfiles import StaticFiles
import bcrypt
import random
import smtplib
from email.mime.text import MIMEText
import os
import smtplib
from email.mime.text import MIMEText
from flask import Flask, request, jsonify, send_from_directory
import bcrypt
import random

# Diğer importların (os, dotenv vs.) altında kalsın
# .env dosyasını yükle
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- GÜNCELLENEN GÜVENLİ KISIM ---
# Şifreli linki direkt buraya yazmıyoruz, .env içindeki MONGO_URL'den çekiyoruz
uri = os.environ.get('MONGO_URL') 

if not uri:
    raise ValueError("HATA: MONGO_URL bulunamadı! .env dosyasını kontrol et.")

client = AsyncIOMotorClient(uri)
# .env içindeki DB_NAME'i (TaptazeDB) kullanır
db = client[os.environ.get('DB_NAME', 'TaptazeDB')] 
# --------------------------------

app = FastAPI()

# Resim klasörünü dışa aç
app.mount("/static", StaticFiles(directory="static"), name="static")

api_router = APIRouter(prefix="/api")

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    
    # E-posta daha önce kayıtlı mı kontrolü
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "Bu e-posta adresi zaten kullanımda."}), 400
        
    # Şifreyi şifrele
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    
    # 6 haneli rastgele kod üret
    verification_code = str(random.randint(100000, 999999))
    
    # Yeni kullanıcı objesi
    new_user = {
        "name": data.get('name'),
        "surname": data.get('surname'),
        "email": email,
        "password": hashed_password.decode('utf-8'), # DB'ye string olarak kaydet
        "phone": data.get('phone'),
        "address": data.get('address'),
        "is_verified": False,
        "verification_code": verification_code
    }
    
    # Veritabanına kaydet
    db.users.insert_one(new_user)
    
    # Mail gönder
    send_verification_email(email, verification_code)
    
    return jsonify({"message": "Kayıt başarılı! Doğrulama kodu e-postanıza gönderildi."}), 201

def send_verification_email(user_email, code):
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")
    
    msg = MIMEText(f"Taptaze'ye Hoş Geldin!\n\nHesabını doğrulamak için kodun: {code}\n\nBu kodu kimseyle paylaşma.")
    msg['Subject'] = 'Taptaze - E-posta Doğrulama Kodu'
    msg['From'] = f"Taptaze <{sender_email}>"
    msg['To'] = user_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, user_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Mail gönderme hatası: {e}")
        return False

# E-posta gönderme ayarları (Gmail Uygulama Şifresi kullanman gerekecek)
def send_verification_email(user_email, code):
    sender_email = "SENIN_EMAILIN@gmail.com"
    sender_password = "SENIN_UYGULAMA_SIFREN" # Gmail'den alınan 16 haneli kod
    
    msg = MIMEText(f"Taptaze'ye Hoş Geldin! Doğrulama kodun: {code}")
    msg['Subject'] = 'Taptaze Giriş Doğrulama'
    msg['From'] = sender_email
    msg['To'] = user_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, user_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Mail hatası: {e}")
        return False

# Kayıt Endpoint'i (Örnek Taslak)
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    # Şifreyi şifrele
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    
    verification_code = str(random.randint(100000, 999999))
    
    new_user = {
        "name": data['name'],
        "surname": data['surname'],
        "email": data['email'],
        "password": hashed_password,
        "phone": data['phone'],
        "address": data['address'],
        "is_verified": False,
        "verification_code": verification_code
    }
    
    # MongoDB'ye kaydet (Burada senin koleksiyon ismin gelecek)
    db.users.insert_one(new_user)
    
    # Mail gönder
    send_verification_email(data['email'], verification_code)
    
    return {"message": "Doğrulama kodu gönderildi!"}, 200

@app.route('/api/verify', methods=['POST'])
def verify_email():
    data = request.json
    email = data.get('email')
    code = data.get('code')

    # Kullanıcıyı veritabanında bul
    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı."}), 404

    if user.get("is_verified"):
        return jsonify({"message": "Hesabınız zaten doğrulanmış."}), 400

    # Kod eşleşiyor mu kontrol et
    if user.get("verification_code") == str(code):
        # Eşleşiyorsa hesabı onayla ve güvenlik için kodu veritabanından sil
        db.users.update_one(
            {"email": email},
            {"$set": {"is_verified": True}, "$unset": {"verification_code": ""}}
        )
        return jsonify({"message": "E-posta başarıyla doğrulandı! Artık giriş yapabilirsiniz."}), 200
    else:
        return jsonify({"error": "Doğrulama kodu hatalı."}), 400
    
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email') 
    password = data.get('password')

    # Veritabanında kullanıcıyı ara
    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "Bu e-posta ile kayıtlı kullanıcı bulunamadı."}), 404

    # Kullanıcı mailini doğrulamış mı? (Güvenlik kilidi)
    if not user.get("is_verified"):
        return jsonify({"error": "Lütfen giriş yapmadan önce e-posta adresinizi doğrulayın."}), 403

    # Şifre kontrolü (Frontend'den gelen şifre ile DB'deki şifrelenmiş (hash) şifreyi karşılaştır)
    if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        
        # Giriş başarılıysa frontend'e kullanıcı bilgilerini gönder (Şifre HARİÇ!)
        user_data = {
            "id": str(user['_id']),
            "name": user.get('name'),
            "surname": user.get('surname'),
            "email": user.get('email'),
            "phone": user.get('phone'),
            "address": user.get('address')
        }
        return jsonify({"message": "Giriş başarılı!", "user": user_data}), 200
    else:
        return jsonify({"error": "Şifre hatalı."}), 401


# ============ PYDANTIC MODELLER ============

class Category(BaseModel):
    id: Optional[str] = None
    name: str
    image: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    category_id: str
    price: float
    unit_type: str
    stock: int
    image: Optional[str] = None
    description: Optional[str] = None

class Product(BaseModel):
    id: str
    name: str
    category_id: str
    category_name: Optional[str] = None
    price: float
    unit_type: str
    stock: int
    image: Optional[str] = None
    description: Optional[str] = None

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    product_image: Optional[str] = None
    quantity: float
    price: float
    unit_type: str

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    delivery_address: str
    customer_note: Optional[str] = None
    items: List[OrderItem]
    total_amount: float

class Order(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    customer_note: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    status: str
    created_at: datetime

class AdminLogin(BaseModel):
    username: str
    password: str

class OrderStatusUpdate(BaseModel):
    status: str

# ============ YARDIMCI FONKSİYONLAR ============

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

async def get_category_name(category_id: str):
    try:
        if not category_id: return "Genel"
        category = await db.categories.find_one({"_id": ObjectId(category_id)})
        return category["name"] if category else "Bilinmeyen"
    except:
        return "Bilinmeyen"

# ============ KATEGORİ ENDPOINTS ============

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find().to_list(100)
    return [Category(**serialize_doc(cat)) for cat in categories]

# ============ ÜRÜN ENDPOINTS ============

@api_router.get("/products", response_model=List[Product])
async def get_products(category_id: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category_id: query["category_id"] = category_id
    if search: query["name"] = {"$regex": search, "$options": "i"}
    
    products = await db.products.find(query).to_list(1000)
    result = []
    for prod in products:
        prod_dict = serialize_doc(prod)
        prod_dict["category_name"] = await get_category_name(prod_dict.get("category_id", ""))
        result.append(Product(**prod_dict))
    return result

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product: raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        prod_dict = serialize_doc(product)
        prod_dict["category_name"] = await get_category_name(prod_dict.get("category_id", ""))
        return Product(**prod_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ SİPARİŞ ENDPOINTS ============

# --- GÜNCELLENMİŞ SİPARİŞ OLUŞTURMA (STOK KONTROLLÜ) ---
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    # 1. Önce stokları kontrol et (Yeterli ürün var mı?)
    for item in order.items:
        product = await db.products.find_one({"_id": ObjectId(item.product_id)})
        if not product:
            raise HTTPException(status_code=404, detail=f"{item.product_name} bulunamadı.")
        
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stok yetersiz: {item.product_name} (Kalan: {product['stock']} {product['unit_type']})")

    # 2. Stok yeterliyse siparişi oluştur
    order_dict = order.dict()
    order_dict["status"] = "Beklemede"
    order_dict["created_at"] = datetime.utcnow()
    
    result = await db.orders.insert_one(order_dict)
    order_dict["id"] = str(result.inserted_id)

    # 3. VERİTABANINDAN STOKLARI DÜŞ
    for item in order.items:
        await db.products.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock": -item.quantity}} # Mevcut stoktan sipariş miktarını çıkar
        )
    
    return Order(**order_dict)
# -------------------------------------------------------

@api_router.get("/orders", response_model=List[Order])
async def get_all_orders():
    # SADECE GİZLİ OLMAYANLARI GETİR (SOFT DELETE DESTEĞİ)
    orders = await db.orders.find({"is_hidden": {"$ne": True}}).sort("created_at", -1).to_list(1000)
    return [Order(**serialize_doc(order)) for order in orders]

# ============ ADMİN ENDPOINTS ============

# --- DASHBOARD İSTATİSTİKLERİ ---
@api_router.get("/admin/stats")
async def get_admin_stats():
    """Admin paneli için özet istatistikleri hesaplar"""
    try:
        # 1. Toplam Ciro (SADECE 'Teslim Edildi' olanları topla)
        pipeline = [
            {"$match": {"status": "Teslim Edildi"}}, # <--- KRİTİK NOKTA BURASI
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ]
        revenue_result = await db.orders.aggregate(pipeline).to_list(1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0

        # 2. Toplam Sipariş Sayısı (Hepsini say)
        total_orders = await db.orders.count_documents({})

        # 3. Bekleyen (Aktif) Siparişler
        pending_orders = await db.orders.count_documents({"status": "Beklemede"})

        # 4. Toplam Ürün Çeşidi
        total_products = await db.products.count_documents({})

        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "total_products": total_products
        }
    except Exception as e:
        print(f"Stats Error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    admin = await db.users.find_one({"username": credentials.username})
    print(f"Admin Login Attempt: {credentials.username} , {credentials.password}" )
    if not admin or not bcrypt.checkpw(credentials.password.encode('utf-8'), admin["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Hatalı giriş")
    return {"success": True, "message": "Giriş başarılı", "username": admin["username"]}

@api_router.post("/admin/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    result = await db.products.insert_one(product_dict)
    product_dict["id"] = str(result.inserted_id)
    product_dict["category_name"] = await get_category_name(product_dict.get("category_id", ""))
    return Product(**product_dict)

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate):
    try:
        update_data = product.dict()
        result = await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update_data})
        if result.matched_count == 0: raise HTTPException(status_code=404, detail="Ürün yok")
        
        updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
        prod_dict = serialize_doc(updated_product)
        prod_dict["category_name"] = await get_category_name(prod_dict.get("category_id", ""))
        return Product(**prod_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str):
    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Ürün yok")
        return {"success": True, "message": "Silindi"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/admin/orders/{order_id}")
async def delete_order(order_id: str):
    """Sipariş GİZLEME (Soft Delete)"""
    try:
        result = await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"is_hidden": True}})
        if result.matched_count == 0: raise HTTPException(status_code=404, detail="Sipariş yok")
        return {"success": True, "message": "Gizlendi"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.patch("/admin/orders/{order_id}")
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    try:
        result = await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": update.status}})
        if result.matched_count == 0: raise HTTPException(status_code=404, detail="Sipariş yok")
        return {"success": True, "message": "Güncellendi"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============ ROUTER'I DAHİL ET (BU SATIR EN SONDA OLMALI) ============
app.include_router(api_router)

# CORS ve Logging
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()