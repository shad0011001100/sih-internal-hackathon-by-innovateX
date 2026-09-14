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
    if uni_profile:
        assigned_count = db.query(models.Report).filter(models.Report.assigned_university_id == uni_profile.id).count()
        
    projects_in_progress = []
    if uni_profile:
        reports = db.query(models.Report).filter(models.Report.assigned_university_id == uni_profile.id).all()
        report_ids = [r.id for r in reports]
        projects_in_progress = db.query(models.Project).filter(models.Project.report_id.in_(report_ids)).all()
        
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
    results = []
    for uni in universities:
        assigned_count = db.query(models.Report).filter(models.Report.assigned_university_id == uni.id).count()
        
        reports = db.query(models.Report).filter(models.Report.assigned_university_id == uni.id).all()
        report_ids = [r.id for r in reports]
        completed_projects = db.query(models.Project).filter(models.Project.report_id.in_(report_ids), models.Project.status == 'completed').count()
        
        results.append({
            "name": uni.name,
            "department": uni.department,
            "ranking_score": uni.ranking_score,
            "project_count": completed_projects,
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
