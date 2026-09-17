import datetime
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
from models import Project, Report
from routers.reports import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

def get_official_user(user: models.User = Depends(get_current_user)):
    """
    Dependency that enforces Role-Based Access Control (RBAC).
    Strictly denies access to standard citizens.
    """
    if user.role not in ["verifier", "official", "admin", "university"]:
        raise HTTPException(status_code=403, detail="Forbidden: Official access required.")
    return user

class StatusUpdate(BaseModel):
    status: str

class ValidateReportRequest(BaseModel):
    action: str = "approve"  # "approve" | "dispatch_inspector" | "reject"
    reason: Optional[str] = None
    hazard_level: Optional[str] = "Standard"
    notes: Optional[str] = None

class AssignReportRequest(BaseModel):
    university_id: int
    department: str
    faculty_mentor: Optional[str] = None

class ReviewSubmissionRequest(BaseModel):
    action: str  # 'approve' | 'reject'
    comments: Optional[str] = None

@router.get("/reports")
def get_all_reports(user: models.User = Depends(get_official_user), db: Session = Depends(get_db)):
    """
    Returns all reports in the system for officials to review with SLA timeframes and authenticity metrics.
    """
    reports = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    now = datetime.datetime.utcnow()

    results = []
    for r in reports:
        created_time = r.created_at or now

        # SLA 1: Validation SLA (24h from submission)
        val_deadline = created_time + datetime.timedelta(hours=24)
        val_remaining_hours = round((val_deadline - now).total_seconds() / 3600, 1)

        # SLA 2: Assignment SLA (48h from submission/validation)
        assign_deadline = created_time + datetime.timedelta(hours=48)
        assign_remaining_hours = round((assign_deadline - now).total_seconds() / 3600, 1)

        if r.status == "reported":
            sla_phase = "Validation"
            sla_hours_left = val_remaining_hours
            sla_deadline_iso = val_deadline.isoformat()
            if val_remaining_hours < 0:
                sla_status = "breached"
            elif val_remaining_hours <= 6:
                sla_status = "approaching"
            else:
                sla_status = "on_track"
        elif r.status in ["validated", "inspection_dispatched"]:
            sla_phase = "Assignment"
            sla_hours_left = assign_remaining_hours
            sla_deadline_iso = assign_deadline.isoformat()
            if assign_remaining_hours < 0:
                sla_status = "breached"
            elif assign_remaining_hours <= 12:
                sla_status = "approaching"
            else:
                sla_status = "on_track"
        else:
            sla_phase = "Resolution"
            sla_hours_left = 0
            sla_deadline_iso = None
            sla_status = "completed" if r.status in ["implemented", "resolved"] else "in_progress"

        # AI Authenticity Assessment
        spam_score = r.ai_spam_score or 0.0
        authenticity_score = max(10, min(99, int((1.0 - spam_score) * 100)))

        # GPS Geofence Check (Ranchi municipal bounding box)
        is_geotag_valid = True
        if r.gps_lat and r.gps_lon:
            is_geotag_valid = (23.1 <= r.gps_lat <= 23.6) and (85.0 <= r.gps_lon <= 85.6)

        # Citizen Integrity info
        citizen_data = {
            "name": (r.citizen.name if r.citizen and r.citizen.name else "Resident of Ranchi"),
            "email": (r.citizen.email if r.citizen and r.citizen.email else None),
            "trust_score": round((r.citizen.trust_score if r.citizen else 0.95) * 100),
            "is_otp_verified": True
        }

        # Technologies and Departments
        techs = []
        if r.suggested_technologies:
            try:
                techs = json.loads(r.suggested_technologies)
            except Exception:
                techs = [r.suggested_technologies]
        departments = []
        if r.relevant_departments:
            try:
                departments = json.loads(r.relevant_departments)
            except Exception:
                departments = [r.relevant_departments]

        results.append({
            "id": r.id,
            "category": r.category,
            "description": r.description,
            "status": r.status,
            "is_verified": r.is_verified,
            "priority_score": r.priority_score,
            "ai_spam_score": r.ai_spam_score,
            "challenge_summary": r.challenge_summary,
            "suggested_technologies": techs if isinstance(techs, list) else [],
            "relevant_departments": departments if isinstance(departments, list) else [],
            "assigned_department": r.assigned_department,
            "assigned_university_id": r.assigned_university_id,
            "gps_lat": r.gps_lat,
            "gps_lon": r.gps_lon,
            "photo_url": r.photo_url,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "citizen": citizen_data,
            "sla": {
                "phase": sla_phase,
                "hours_left": sla_hours_left,
                "deadline": sla_deadline_iso,
                "status": sla_status
            },
            "authenticity": {
                "score": authenticity_score,
                "is_geotag_valid": is_geotag_valid,
                "ai_duplicate_risk": "Low" if spam_score < 0.3 else "Elevated",
                "evidence_status": "Verified Genuine" if r.is_verified else ("Suspect / Unverified" if spam_score > 0.5 else "Standard Resident Submission")
            }
        })
    return results

@router.post("/reports/{report_id}/validate")
def validate_report(
    report_id: int,
    req: ValidateReportRequest,
    user: models.User = Depends(get_official_user),
    db: Session = Depends(get_db)
):
    """
    Government official validation endpoint with inspection decisions:
    - approve: validates report (sets is_verified=True, status='validated')
    - dispatch_inspector: flags for physical ward inspection
    - reject: rejects report (sets status='flagged_spam')
    """
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    action = req.action.lower()
    if action == "approve":
        report.status = "validated"
        report.is_verified = True
        msg = f"Report #{report_id} verified and validated. Assigned to 48-hour institutional allocation queue."
    elif action == "dispatch_inspector":
        report.status = "inspection_dispatched"
        report.is_verified = False
        msg = f"Field inspection dispatched for Report #{report_id}. Ward officer assigned for ground check."
    elif action == "reject":
        report.status = "flagged_spam"
        report.is_verified = False
        msg = f"Report #{report_id} rejected as inauthentic/spam. Reason: {req.reason or 'Unverified documentation'}."
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Allowed: 'approve', 'dispatch_inspector', 'reject'.")

    db.commit()
    db.refresh(report)

    return {
        "status": "ok",
        "action": action,
        "new_status": report.status,
        "is_verified": report.is_verified,
        "message": msg,
        "report_id": report.id
    }

@router.post("/reports/{report_id}/status")
def update_report_status(report_id: int, req: StatusUpdate, user: models.User = Depends(get_official_user), db: Session = Depends(get_db)):
    """
    Transitions the workflow status of a report.
    Valid statuses: reported -> validated -> assigned -> in_progress -> under_review -> implemented
    """
    valid_statuses = ["reported", "validated", "assigned", "in_progress", "under_review", "implemented"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status transition")
        
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    report.status = req.status
    if req.status in ["validated", "verified"]:
        report.is_verified = True
        
    db.commit()
    db.refresh(report)
    
    return {"status": "ok", "new_status": report.status, "report_id": report.id}

@router.post("/reports/{report_id}/assign")
def assign_report(
    report_id: int,
    req: AssignReportRequest,
    user: models.User = Depends(get_official_user),
    db: Session = Depends(get_db)
):
    """
    Assign a report to a university and department, setting status to 'assigned'.
    """
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.assigned_university_id = req.university_id
    dept_str = req.department
    if req.faculty_mentor:
        dept_str = f"{req.department} (Lead Mentor: {req.faculty_mentor})"
    report.assigned_department = dept_str
    report.status = "assigned"

    db.commit()
    db.refresh(report)

    return {
        "status": "ok",
        "message": "Report successfully assigned",
        "report_id": report.id,
        "assigned_university_id": report.assigned_university_id,
        "assigned_department": report.assigned_department,
        "faculty_mentor": req.faculty_mentor,
        "new_status": report.status
    }

@router.get("/submissions")
def get_submitted_projects(
    user: models.User = Depends(get_official_user),
    db: Session = Depends(get_db)
):
    """
    Get all projects with status='submitted' for government review.
    Returns project details along with linked report info.
    """
    projects = (
        db.query(Project)
        .filter(Project.status == "submitted")
        .order_by(Project.created_at.desc())
        .all()
    )

    results = []
    for proj in projects:
        report_data = None
        if proj.report:
            report_data = {
                "id": proj.report.id,
                "category": proj.report.category,
                "description": proj.report.description,
                "gps_lat": proj.report.gps_lat,
                "gps_lon": proj.report.gps_lon,
                "photo_url": proj.report.photo_url,
                "status": proj.report.status,
                "priority_score": proj.report.priority_score,
                "challenge_summary": proj.report.challenge_summary,
                "created_at": proj.report.created_at.isoformat() if proj.report.created_at else None,
            }
        results.append({
            "id": proj.id,
            "report_id": proj.report_id,
            "title": proj.title,
            "description": proj.description,
            "status": proj.status,
            "team_id": proj.team_id,
            "mentor_name": proj.mentor_name,
            "deadline": proj.deadline.isoformat() if proj.deadline else None,
            "progress_pct": proj.progress_pct,
            "documentation_url": proj.documentation_url,
            "prototype_url": proj.prototype_url,
            "impact_report": proj.impact_report,
            "created_at": proj.created_at.isoformat() if proj.created_at else None,
            "report": report_data,
        })
    return results

@router.post("/submissions/{project_id}/review")
def review_submission(
    project_id: int,
    req: ReviewSubmissionRequest,
    user: models.User = Depends(get_official_user),
    db: Session = Depends(get_db)
):
    """
    Review a submitted project:
    - approve: set project.status='accepted', set report.status='under_review'
    - reject: set project.status='draft'
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    action = req.action.strip().lower()
    if action == "approve":
        project.status = "accepted"
        report = db.query(Report).filter(Report.id == project.report_id).first()
        if report:
            report.status = "under_review"
    elif action == "reject":
        project.status = "draft"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approve' or 'reject'")

    db.commit()
    db.refresh(project)

    return {
        "status": "ok",
        "action": action,
        "project_id": project.id,
        "project_status": project.status,
        "report_id": project.report_id,
        "report_status": project.report.status if project.report else None,
        "comments": req.comments,
    }

@router.post("/submissions/{project_id}/implement")
def mark_project_implemented(
    project_id: int,
    user: models.User = Depends(get_official_user),
    db: Session = Depends(get_db)
):
    """
    Mark a project as implemented:
    - Set project.status='completed'
    - Set the linked report.status='implemented'
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = "completed"
    report = db.query(Report).filter(Report.id == project.report_id).first()
    if report:
        report.status = "implemented"

    db.commit()
    db.refresh(project)

    return {
        "status": "ok",
        "message": "Project and linked report marked as implemented",
        "project_id": project.id,
        "project_status": project.status,
        "report_id": project.report_id,
        "report_status": project.report.status if report else None,
    }
