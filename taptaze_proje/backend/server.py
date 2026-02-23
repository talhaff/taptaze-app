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

def send_verification_email(user_email, code):
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")
    
    msg = MIMEText(f"Taptaze'ye Hoş Geldin! Hesabını doğrulamak için kodun: {code}")
    msg['Subject'] = 'Taptaze - E-posta Doğrulama'
    msg['From'] = f"Taptaze <{sender_email}>"
    msg['To'] = user_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, user_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Mail hatası: {e}")
        return False

# ============ KULLANICI (AUTH) ENDPOINTS ============

@api_router.post("/register")
async def register(user: UserRegister):
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
    send_verification_email(user.email, v_code)
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