import os
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
import time
from dotenv import load_dotenv
from routers.auth_institutional import create_jwt, set_auth_cookie
from routers.reports import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])


# Simple in-memory rate limiter for MVP
RATE_LIMIT_WINDOW = 60 # seconds
MAX_REQUESTS = 5
rate_limit_cache = {}

def check_rate_limit(ip: str):
    now = time.time()
    if ip not in rate_limit_cache:
        rate_limit_cache[ip] = []
    
    rate_limit_cache[ip] = [req_time for req_time in rate_limit_cache[ip] if now - req_time < RATE_LIMIT_WINDOW]
    
    if len(rate_limit_cache[ip]) >= MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    rate_limit_cache[ip].append(now)

class SendOTPRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str

@router.post("/send-otp")
def send_otp(req: SendOTPRequest, request: Request):
    client_ip = request.client.host
    check_rate_limit(client_ip)

    # For hackathon demo, bypass actual SMS gateways/Supabase 
    # to avoid the Errno 11001 (DNS resolution) errors on placeholder URLs.
    print(f"Mock OTP sent to {req.phone_number}. Use any 6-digit number to verify.")
    return {"status": "ok", "message": "OTP sent successfully (Demo mode: enter any 6 digits)"}

@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, response: Response, db: Session = Depends(get_db)):
    if len(req.otp) != 6:
        raise HTTPException(status_code=400, detail="OTP must be 6 digits")
        
    try:
        # Sync user to our SQLite DB (Auto-register citizen on first login)
        user = db.query(models.User).filter(models.User.phone_number == req.phone_number).first()
        if not user:
            user = models.User(phone_number=req.phone_number, role="citizen")
            db.add(user)
            db.commit()
            db.refresh(user)

        # Issue our own PyJWT token instead of Supabase token to keep the backend self-contained
        token = create_jwt(user.id, user.role)
        set_auth_cookie(response, token)
        
        return {"status": "ok", "role": user.role, "user_id": user.id}
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/logout")
def logout(response: Response):
    # Destroy the httpOnly cookie
    response.delete_cookie(key="access_token")
    return {"status": "ok", "message": "Logged out successfully"}

@router.get("/me")
@router.get("/me/")
def get_current_user_session(user: models.User = Depends(get_current_user)):
    """
    Verify active session token (via Bearer authorization header or access_token cookie)
    and return authenticated user profile details.
    """
    return {
        "id": user.id,
        "role": user.role,
        "phone": user.phone_number,
        "phone_number": user.phone_number,
        "email": user.email,
        "name": user.name,
        "apaar_id": user.apaar_id,
        "employee_id": user.employee_id,
        "institution_id": user.institution_id,
        "is_active": user.is_active,
        "trust_score": user.trust_score
    }

