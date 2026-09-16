import os
import jwt
import hashlib
import secrets
import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/auth", tags=["auth-institutional"])

# JWT secret for signing our own tokens (non-Supabase users)
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_jwt(user_id: int, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,   # Set True in production (HTTPS)
        samesite="lax",
        max_age=3600 * 24 * JWT_EXPIRY_DAYS,
    )


# ─────────────────────────────────────────────
# STUDENT / INSTITUTION LOGIN
# ─────────────────────────────────────────────

class StudentLoginRequest(BaseModel):
    apaar_id: str
    password: str

@router.post("/student/login")
def student_login(req: StudentLoginRequest, response: Response, db: Session = Depends(get_db)):
    apaar_id = req.apaar_id.strip()
    password = req.password.strip() if req.password else ""
    if not apaar_id:
        raise HTTPException(status_code=400, detail="APAAR ID is required")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    pw_hash = hash_password(password)
    demo_passwords = {"sanjha@2025", "student123", "admin123", "password", "password123"}
    user = db.query(models.User).filter(models.User.apaar_id == apaar_id).first()
    if not user:
        # Auto-register on first login with password
        user = models.User(
            apaar_id=apaar_id,
            password_hash=pw_hash,
            role="student",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # If user has a password set, verify it or allow demo credentials
        if user.password_hash and user.password_hash != pw_hash and req.password not in demo_passwords:
            raise HTTPException(status_code=401, detail="Invalid APAAR ID or password")
        elif not user.password_hash:
            # Set password on first login after update
            user.password_hash = pw_hash
            db.commit()

    token = create_jwt(user.id, user.role)
    set_auth_cookie(response, token)
    return {"status": "ok", "role": user.role, "user_id": user.id}


# ─────────────────────────────────────────────
# UNIVERSITY LOGIN
# ─────────────────────────────────────────────

class UniversityLoginRequest(BaseModel):
    email: str
    password: str

@router.post("/university/login")
def university_login(req: UniversityLoginRequest, response: Response, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if not email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    if not (email.endswith(".edu") or email.endswith(".ac.in") or email.endswith("@gmail.com") or "@" in email):
         raise HTTPException(status_code=400, detail="Invalid institutional email domain")

    user = db.query(models.User).filter(models.User.email == email).first()
    pw_hash = hash_password(req.password)
    demo_passwords = {"sanjha@2025", "admin123", "mypassword123", "password"}
    
    if not user:
        uni_name = email.split('@')[0].replace('.', ' ').title() + " University"
        user = models.User(
            email=email,
            password_hash=pw_hash,
            role="university",
            name=uni_name,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Ensure University Profile is created and linked
        uni = models.University(
            name=uni_name,
            department="Department of Innovation & Rural Tech",
            user_id=user.id,
            ranking_score=91.5
        )
        db.add(uni)
        db.commit()
    else:
        # Allow if password matches hash OR is recognized demo password
        if user.password_hash != pw_hash and req.password not in demo_passwords:
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again or use demo credentials.")
        
        # Ensure user has a linked university profile
        if not user.university_profile:
            existing_uni = db.query(models.University).first()
            if existing_uni and not existing_uni.user_id:
                existing_uni.user_id = user.id
                db.commit()
            else:
                uni_name = email.split('@')[0].replace('.', ' ').title() + " University"
                uni = models.University(
                    name=uni_name,
                    department="Department of Engineering & Tech",
                    user_id=user.id,
                    ranking_score=92.0
                )
                db.add(uni)
                db.commit()
            
    token = create_jwt(user.id, user.role)
    set_auth_cookie(response, token)
    return {"status": "ok", "role": user.role, "user_id": user.id}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", httponly=True, samesite="lax")
    return {"status": "ok"}


# ─────────────────────────────────────────────
# GOVERNMENT OFFICIAL LOGIN
# ─────────────────────────────────────────────

class OfficialLoginRequest(BaseModel):
    employee_id: str
    password: str

@router.post("/official/login")
def official_login(req: OfficialLoginRequest, response: Response, db: Session = Depends(get_db)):
    employee_id = req.employee_id.strip()
    if not employee_id or not req.password:
        raise HTTPException(status_code=400, detail="Employee ID and password are required")

    pw_hash = hash_password(req.password)
    demo_passwords = {"sanjha@2025", "admin123", "official123", "mypassword123", "password"}

    user = db.query(models.User).filter(models.User.employee_id == employee_id).first()
    if not user:
        # Auto-provision official if using demo credentials
        if req.password in demo_passwords or employee_id.upper().startswith("GOV"):
            user = models.User(
                employee_id=employee_id,
                password_hash=pw_hash,
                role="official",
                name=f"Govt Official ({employee_id})",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(status_code=401, detail="No account found with this Employee ID. Use demo ID GOV-001 with password sanjha@2025")

    if user.password_hash != pw_hash and req.password not in demo_passwords:
        raise HTTPException(status_code=401, detail="Incorrect password. Use sanjha@2025 for demo access.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated. Contact admin.")

    token = create_jwt(user.id, user.role)
    set_auth_cookie(response, token)
    return {"status": "ok", "role": user.role, "user_id": user.id}


# ─────────────────────────────────────────────
# INDUSTRY PARTNER LOGIN
# ─────────────────────────────────────────────

class IndustryLoginRequest(BaseModel):
    partner_id: str
    password: str

@router.post("/industry/login")
def industry_login(req: IndustryLoginRequest, response: Response, db: Session = Depends(get_db)):
    partner_id = req.partner_id.strip()
    if not partner_id or not req.password:
        raise HTTPException(status_code=400, detail="Partner ID and password are required")

    pw_hash = hash_password(req.password)
    demo_passwords = {"sanjha@2025", "admin123", "industry123", "mypassword123", "password"}

    user = db.query(models.User).filter(models.User.employee_id == partner_id).first()
    if not user:
        # Auto-provision industry partner if using demo credentials
        if req.password in demo_passwords or partner_id.upper().startswith("IND"):
            user = models.User(
                employee_id=partner_id,
                password_hash=pw_hash,
                role="industry",
                name=f"Industry Partner ({partner_id})",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Auto-provision Industry Profile
            ind_profile = models.IndustryProfile(
                user_id=user.id,
                company_name=f"Jharkhand CSR Partner ({partner_id})",
                sector="Sustainable Infrastructure & CSR",
                csr_budget=2000000.0,
                total_invested=850000.0,
                issues_funded=3,
                success_rate=0.88
            )
            db.add(ind_profile)
            db.commit()
        else:
            raise HTTPException(status_code=401, detail="No account found with this Partner ID. Use demo ID IND-001 with password sanjha@2025")

    if user.password_hash != pw_hash and req.password not in demo_passwords:
        raise HTTPException(status_code=401, detail="Incorrect password. Use sanjha@2025 for demo access.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been deactivated. Contact admin.")

    # Ensure user has an industry profile
    if not user.industry_profile:
        ind_profile = models.IndustryProfile(
            user_id=user.id,
            company_name="Tata Steel Foundation",
            sector="Manufacturing & CSR",
            csr_budget=2500000.0,
            total_invested=1450000.0,
            issues_funded=6,
            success_rate=0.92
        )
        db.add(ind_profile)
        db.commit()

    token = create_jwt(user.id, user.role)
    set_auth_cookie(response, token)
    return {"status": "ok", "role": user.role, "user_id": user.id}


# ─────────────────────────────────────────────
# ADMIN HELPER: Create official/industry user
# ─────────────────────────────────────────────

class CreateOfficialRequest(BaseModel):
    employee_id: str
    password: str
    role: str   # official, industry, verifier

@router.post("/admin/create-user")
def create_official_user(req: CreateOfficialRequest, db: Session = Depends(get_db)):
    """
    Admin-only endpoint to pre-register government/industry accounts.
    In production this would be protected by an admin JWT.
    """
    existing = db.query(models.User).filter(models.User.employee_id == req.employee_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this ID already exists.")

    if req.role not in ["official", "industry", "verifier", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = models.User(
        employee_id=req.employee_id,
        password_hash=hash_password(req.password),
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"status": "ok", "user_id": user.id, "role": user.role}
