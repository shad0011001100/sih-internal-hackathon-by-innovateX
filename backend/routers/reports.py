from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
import jwt
from routers.auth_institutional import JWT_SECRET, JWT_ALGORITHM
from services.ai_engine import verify_image_authenticity, analyze_and_route_problem
import json

router = APIRouter(prefix="/api/reports", tags=["reports"])

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = None
    # Check Authorization header (Bearer token)
    auth_header = request.headers.get("Authorization")
    if auth_header:
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        else:
            token = auth_header.strip()

    # Fall back to access_token cookie
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Decode custom PyJWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user:
                return user
    except Exception:
        pass

    raise HTTPException(status_code=401, detail="Authentication failed")


class ReportCreate(BaseModel):
    title: Optional[str] = None
    category: str
    description: str
    gps_lat: float | None = None
    gps_lon: float | None = None
    photo_base64: str | None = None

@router.post("")
def create_report(req: ReportCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Run AI Triage if photo provided
    spam_score = 0.0
    if req.photo_base64 and req.photo_base64 != "dummy":
        ai_eval = verify_image_authenticity(req.photo_base64)
        if not ai_eval.get("is_genuine", True):
            raise HTTPException(status_code=400, detail=f"AI Triage Rejected: {ai_eval.get('reason', 'Image flagged as spam/irrelevant.')}")
        spam_score = ai_eval.get("confidence", 0.5)

    # Analyze and route problem (including student suitability & text spam detection)
    routing_data = analyze_and_route_problem(req.description, req.category, req.photo_base64)
    if routing_data.get("is_spam", False):
        spam_score = max(spam_score, 0.95)

    photo_url = "https://via.placeholder.com/400" # MOCK for MVP
    challenge_summary = req.title or routing_data.get("challenge_summary")
    
    report = models.Report(
        citizen_id=user.id,
        category=req.category,
        description=req.description,
        gps_lat=req.gps_lat,
        gps_lon=req.gps_lon,
        photo_url=photo_url,
        is_verified=False,
        ai_spam_score=spam_score,
        status="flagged_spam" if spam_score > 0.8 else "reported",
        priority_score=routing_data.get("priority_score", 0.0),
        challenge_summary=challenge_summary,
        suggested_technologies=json.dumps(routing_data.get("possible_technologies", [])),
        relevant_departments=json.dumps(routing_data.get("relevant_departments", [])),
        potential_industry=json.dumps(routing_data.get("potential_industry", [])),
        is_duplicate=routing_data.get("is_duplicate_likely", False),
        duplicate_reason=routing_data.get("duplicate_reason"),
        is_student_eligible=routing_data.get("is_student_suitable", True),
        student_suitability_reason=routing_data.get("student_suitability_reason")
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"status": "ok", "report_id": report.id, "routing": routing_data}

@router.get("/my")
def get_my_reports(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(models.Report).filter(models.Report.citizen_id == user.id).order_by(models.Report.created_at.desc()).all()
    return reports

@router.get("")
@router.get("/")
def get_public_reports(
    limit: int = 50,
    category: Optional[str] = None,
    status: Optional[str] = None,
    verified_only: bool = True,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    """
    Public community feed endpoint to return approved/verified civic reports.
    Accessible without requiring authentication tokens for public community browsing.
    Supports optional category, status, and limit filters.
    """
    query = db.query(models.Report)
    
    # Filter by specific status if requested; otherwise default to approved/verified reports
    if status:
        query = query.filter(models.Report.status == status)
    elif verified_only:
        query = query.filter(
            (models.Report.is_verified == True) | 
            (models.Report.status.in_(["validated", "assigned", "in_progress", "under_review", "implemented", "resolved"]))
        )
    
    # Optional category filter (case-insensitive substring or exact match)
    if category:
        cat_clean = category.strip()
        query = query.filter(
            (models.Report.category == cat_clean) |
            (models.Report.category.ilike(f"%{cat_clean}%"))
        )
        
    reports = query.order_by(models.Report.created_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for r in reports:
        first_line = (r.description or "").split("\n")[0].strip()
        title = r.challenge_summary or (first_line[:60] if first_line else f"{r.category or 'Civic'} Issue #{r.id}")
        
        results.append({
            "id": r.id,
            "title": title,
            "description": r.description,
            "category": r.category,
            "status": r.status,
            "department": r.assigned_department,
            "assigned_department": r.assigned_department,
            "assigned_university_id": r.assigned_university_id,
            "location": {"lat": r.gps_lat, "lon": r.gps_lon} if (r.gps_lat is not None and r.gps_lon is not None) else None,
            "gps_lat": r.gps_lat,
            "gps_lon": r.gps_lon,
            "photo_url": r.photo_url,
            "is_verified": bool(r.is_verified),
            "ai_spam_score": r.ai_spam_score,
            "priority_score": r.priority_score,
            "challenge_summary": r.challenge_summary,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
        
    return results

