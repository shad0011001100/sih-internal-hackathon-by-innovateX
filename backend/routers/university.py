from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
from routers.reports import get_current_user

router = APIRouter(prefix='/api/university', tags=['university'])

def get_university_user(user: models.User = Depends(get_current_user)):
    if user.role != 'university':
        raise HTTPException(status_code=403, detail="Forbidden: University access required.")
    return user

@router.get("/dashboard")
def get_dashboard(user: models.User = Depends(get_university_user), db: Session = Depends(get_db)):
    uni_profile = user.university_profile
    assigned_count = 0
    projects_in_progress = []
    if uni_profile:
        # Single query fetching report IDs
        report_ids = [
            r[0] for r in db.query(models.Report.id).filter(
                models.Report.assigned_university_id == uni_profile.id
            ).all()
        ]
        assigned_count = len(report_ids)
        if report_ids:
            projects_in_progress = db.query(models.Project).filter(
                models.Project.report_id.in_(report_ids)
            ).all()
        
    departments = []
    if uni_profile and uni_profile.department:
        departments.append({"name": uni_profile.department, "student_count": 0})
        
    return {
        "university_info": uni_profile,
        "assigned_reports_count": assigned_count,
        "departments": departments,
        "projects_in_progress": projects_in_progress
    }

@router.get("/problems")
def get_problems(user: models.User = Depends(get_university_user), db: Session = Depends(get_db)):
    if not user.university_profile:
        return []
    return user.university_profile.assigned_reports

@router.get("/ranking")
def get_ranking(user: models.User = Depends(get_university_user), db: Session = Depends(get_db)):
    universities = db.query(models.University).order_by(models.University.ranking_score.desc()).all()
    if not universities:
        return []

    # Batch query reports and completed projects to eliminate N+1 database queries
    uni_ids = [u.id for u in universities]
    reports = db.query(models.Report.id, models.Report.assigned_university_id).filter(
        models.Report.assigned_university_id.in_(uni_ids)
    ).all()

    # Map reports to university IDs
    uni_reports_map = {}
    report_ids = []
    for r_id, u_id in reports:
        uni_reports_map.setdefault(u_id, []).append(r_id)
        report_ids.append(r_id)

    completed_report_ids = set()
    if report_ids:
        completed_projects = db.query(models.Project.report_id).filter(
            models.Project.report_id.in_(report_ids),
            models.Project.status == 'completed'
        ).all()
        completed_report_ids = {p.report_id for p in completed_projects}

    results = []
    for uni in universities:
        assigned_report_ids = uni_reports_map.get(uni.id, [])
        assigned_count = len(assigned_report_ids)
        completed_count = sum(1 for r_id in assigned_report_ids if r_id in completed_report_ids)
        
        results.append({
            "name": uni.name,
            "department": uni.department,
            "ranking_score": uni.ranking_score,
            "project_count": completed_count,
            "report_count": assigned_count
        })
    return results

@router.get("/students")
def get_students(user: models.User = Depends(get_university_user), db: Session = Depends(get_db)):
    students = db.query(models.User).filter(models.User.role == 'student').all()
    results = []
    for student in students:
        project_count = len(student.team_memberships)
        skill_count = len(student.skill_profiles)
        results.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "project_count": project_count,
            "skill_count": skill_count
        })
    return results

class UniversitySettingsUpdate(BaseModel):
    aishe_code: str | None = None
    nodal_officer: str | None = None
    nodal_email: str | None = None
    capstone_credits: int | None = 4
    min_team_size: int | None = 2
    max_team_size: int | None = 4
    require_field_pilot: bool | None = True
    auto_csr_matching: bool | None = True
    notify_new_civic_issues: bool | None = True

class FacultyAssignRequest(BaseModel):
    faculty_mentor: str
    department: str | None = None
    lab_allocation: str | None = None

UNIVERSITY_SETTINGS_CACHE = {
    "aishe_code": "U-0298",
    "accreditation": "NAAC A+ (CGPA 3.48)",
    "nodal_officer": "Dr. Ramesh Chandra (Dean R&D)",
    "nodal_email": "dean.rd@bitmesra.ac.in",
    "capstone_credits": 4,
    "min_team_size": 2,
    "max_team_size": 4,
    "require_field_pilot": True,
    "auto_csr_matching": True,
    "notify_new_civic_issues": True
}

@router.get("/settings")
def get_settings(user: models.User = Depends(get_university_user)):
    return UNIVERSITY_SETTINGS_CACHE

@router.put("/settings")
def update_settings(req: UniversitySettingsUpdate, user: models.User = Depends(get_university_user)):
    data = req.model_dump(exclude_unset=True) if hasattr(req, 'model_dump') else req.dict(exclude_unset=True)
    for k, v in data.items():
        UNIVERSITY_SETTINGS_CACHE[k] = v
    return {"status": "ok", "settings": UNIVERSITY_SETTINGS_CACHE}

@router.post("/problems/{report_id}/assign-faculty")
def assign_faculty(report_id: int, req: FacultyAssignRequest, user: models.User = Depends(get_university_user), db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if req.department:
        report.assigned_department = req.department
    db.commit()
    return {
        "status": "ok", 
        "message": f"Faculty mentor {req.faculty_mentor} assigned to Problem #{report_id}",
        "faculty_mentor": req.faculty_mentor,
        "lab_allocation": req.lab_allocation
    }

@router.post("/projects/{project_id}/approve-credits")
def approve_credits(project_id: int, user: models.User = Depends(get_university_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.status = 'approved'
    db.commit()
    return {"status": "ok", "message": f"Academic capstone credits approved for Project '{project.title}'"}

