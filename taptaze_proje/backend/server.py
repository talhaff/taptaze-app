from fastapi import FastAPI, APIRouter, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pathlib import Path
from dotenv import load_dotenv
import os
import bcrypt
import random
import smtplib
from email.mime.text import MIMEText
from fastapi import BackgroundTasks
import requests

# --- AYARLAR VE BAĞLANTILAR ---
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

uri = os.environ.get('MONGO_URL')
if not uri:
    raise ValueError("HATA: MONGO_URL bulunamadı! .env dosyasını kontrol et.")

client = AsyncIOMotorClient(uri)
db = client[os.environ.get('DB_NAME', 'TaptazeDB')]

app = FastAPI()

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

api_router = APIRouter(prefix="/api")

# --- MODELLER VE YARDIMCI FONKSİYONLAR ---
class UserRegister(BaseModel):
    name: str
    surname: str
    email: str
    password: str
    phone: str
    address: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserVerify(BaseModel):
    email: str
    code: str

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# --- MAİL FONKSİYONUNU TLS (587) İLE GÜNCELLE ---
def send_verification_email(user_email, code):
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("EMAIL_USER") # Render'daki e-postanı gönderici olarak alır
    
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    
    # Mailin içeriğini ve kime gideceğini JSON olarak hazırlıyoruz
    payload = {
        "sender": {"name": "Taptaze App", "email": sender_email},
        "to": [{"email": user_email}],
        "subject": "Taptaze - E-posta Doğrulama",
        "htmlContent": f"<html><body><h3>Taptaze'ye Hoş Geldin!</h3><p>Hesabını doğrulamak için doğrulama kodun: <strong>{code}</strong></p></body></html>"
    }

    try:
        # Port engellerini aşan, doğrudan HTTPS üzerinden atılan o sihirli istek:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status() # Eğer Brevo'dan hata dönerse yakalar
        print(f"Başarılı: {user_email} adresine mail gönderildi!")
        return True
    except Exception as e:
        print(f"Brevo API Hatası: {e}")
        return False

# --- REGISTER FONKSİYONUNU GERÇEK HALİNE GETİR ---

@api_router.post("/register")
async def register(user: UserRegister, background_tasks: BackgroundTasks): # background_tasks ekledik
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    v_code = str(random.randint(100000, 999999))
    
    new_user = user.dict()
    new_user["password"] = hashed_pw.decode('utf-8')
    new_user["is_verified"] = False
    new_user["verification_code"] = v_code
    
    await db.users.insert_one(new_user)
    
    # KRİTİK DEĞİŞİKLİK: Maili arka planda gönder, kullanıcıyı bekletme!
    background_tasks.add_task(send_verification_email, user.email, v_code)
    
    return {"message": "Doğrulama kodu gönderildi!"}

@api_router.post("/verify")
async def verify(data: UserVerify):
    user = await db.users.find_one({"email": data.email})
    if user and user.get("verification_code") == data.code:
        await db.users.update_one(
            {"email": data.email}, 
            {"$set": {"is_verified": True}, "$unset": {"verification_code": ""}}
        )
        return {"message": "Hesap doğrulandı!"}
    raise HTTPException(status_code=400, detail="Kod hatalı veya kullanıcı bulunamadı.")

@api_router.post("/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    
    if not user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Lütfen önce e-posta adresinizi doğrulayın.")
        
    if bcrypt.checkpw(data.password.encode('utf-8'), user['password'].encode('utf-8')):
        return {
            "message": "Giriş başarılı!",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"]
            }
        }
    raise HTTPException(status_code=401, detail="Şifre hatalı.")

# ============ ROUTER'I DAHİL ET ============
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)