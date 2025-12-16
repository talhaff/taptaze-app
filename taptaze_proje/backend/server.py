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

# .env dosyasını yükle
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB bağlantısı
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()

# Resim klasörünü dışa aç
app.mount("/static", StaticFiles(directory="static"), name="static")

api_router = APIRouter(prefix="/api")

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
    admin = await db.admins.find_one({"username": credentials.username})
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