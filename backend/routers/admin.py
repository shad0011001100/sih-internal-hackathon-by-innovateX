from typing import Optional
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
    Returns all reports in the system for officials to review, ordered by newest.
    """
    reports = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    return reports

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
