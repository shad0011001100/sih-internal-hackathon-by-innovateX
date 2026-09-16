from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
import models
from routers.reports import get_current_user
from services.ai_engine import evaluate_student_suitability, is_spam_content
import json

router = APIRouter(prefix='/api/student', tags=['student'])

def get_student_user(user: models.User = Depends(get_current_user)):
    if user.role != 'student':
        raise HTTPException(status_code=403, detail="Forbidden: Student access required.")
    return user

class ProjectCreate(BaseModel):
    report_id: int
    title: str
    description: Optional[str] = None
    mentor_name: Optional[str] = None

class SkillItem(BaseModel):
    skill_name: str
    proficiency_level: Optional[str] = "beginner"
    projects_demonstrated: Optional[int] = 0
    challenges_participated: Optional[int] = 0
    is_soft_skill: Optional[bool] = False

class SkillProfileUpdate(BaseModel):
    skills: List[SkillItem]

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    progress_pct: Optional[float] = None
    documentation_url: Optional[str] = None
    prototype_url: Optional[str] = None
    impact_report: Optional[str] = None

@router.get("/dashboard")
def get_dashboard(user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    # user info
    user_info = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "github_url": user.github_url,
        "linkedin_url": user.linkedin_url
    }
    
    # list of user's projects (via TeamMember->Team->Project)
    projects = []
    for tm in user.team_memberships:
        if tm.team and tm.team.project:
            projects.append(tm.team.project)
            
    # skill count
    skill_count = len(user.skill_profiles)
    
    # Filter available problems for students: exclude spam and physical manual labor
    raw_reports = db.query(models.Report).filter(
        models.Report.status.in_(['reported', 'validated', 'assigned']),
        models.Report.status != 'flagged_spam',
        models.Report.ai_spam_score < 0.6,
        models.Report.is_duplicate.is_(False)
    ).all()
    
    student_reports = []
    for r in raw_reports:
        # Check DB flag or run on-the-fly suitability & spam evaluator
        is_spam, _, _ = is_spam_content(r.description or "")
        if is_spam:
            continue
            
        suitable, reason = evaluate_student_suitability(r.description or "", r.category or "")
        if not suitable or getattr(r, 'is_student_eligible', True) is False:
            continue
            
        student_reports.append(r)
        
    problems_count = len(student_reports)
    
    return {
        "user": user_info,
        "projects": projects,
        "skill_count": skill_count,
        "available_problems_count": problems_count
    }

@router.get("/problems")
def get_problems(user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    reports = db.query(models.Report).filter(
        models.Report.status.in_(['reported', 'validated', 'assigned']),
        models.Report.status != 'flagged_spam',
        models.Report.ai_spam_score < 0.6,
        models.Report.is_duplicate.is_(False)
    ).all()
    
    results = []
    for r in reports:
        # AI Spam Filter
        is_spam, _, _ = is_spam_content(r.description or "")
        if is_spam:
            continue
            
        # AI Student Relevancy Filter (filters out potholes, manual asphalt repair, physical construction)
        suitable, reason = evaluate_student_suitability(r.description or "", r.category or "")
        if not suitable or getattr(r, 'is_student_eligible', True) is False:
            continue

        # Parse suggested technologies if stored as JSON string
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
            "priority_score": r.priority_score, 
            "challenge_summary": r.challenge_summary, 
            "suggested_technologies": techs if isinstance(techs, list) else [], 
            "relevant_departments": departments if isinstance(departments, list) else [],
            "student_suitability_reason": getattr(r, 'student_suitability_reason', None) or reason,
            "gps_lat": r.gps_lat,
            "gps_lon": r.gps_lon,
            "photo_url": r.photo_url,
            "created_at": r.created_at
        })
        
    return results

@router.post("/projects")
def create_project(req: ProjectCreate, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    # create Team
    team = models.Team(
        name=f"Team for {req.title}",
        report_id=req.report_id
    )
    db.add(team)
    db.flush()
    
    # add user as leader
    tm = models.TeamMember(
        team_id=team.id,
        user_id=user.id,
        role="leader"
    )
    db.add(tm)
    db.flush()
    
    # create project
    project = models.Project(
        report_id=req.report_id,
        title=req.title,
        description=req.description,
        mentor_name=req.mentor_name,
        team_id=team.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.post("/teams/{team_id}/join")
def join_team(team_id: int, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    # check if team exists
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    tm = models.TeamMember(
        team_id=team.id,
        user_id=user.id,
        role="member"
    )
    db.add(tm)
    db.commit()
    return {"status": "joined"}

@router.get("/skill-profile")
def get_skill_profile(user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    return user.skill_profiles

@router.put("/skill-profile")
def upsert_skill_profile(req: SkillProfileUpdate, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    # delete existing
    db.query(models.SkillProfile).filter(models.SkillProfile.user_id == user.id).delete()
    
    # bulk insert
    for skill in req.skills:
        sp = models.SkillProfile(
            user_id=user.id,
            skill_name=skill.skill_name,
            proficiency_level=skill.proficiency_level,
            projects_demonstrated=skill.projects_demonstrated,
            challenges_participated=skill.challenges_participated,
            is_soft_skill=skill.is_soft_skill
        )
        db.add(sp)
    db.commit()
    return {"status": "ok"}

@router.put("/profile")
def update_profile(req: ProfileUpdate, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    if req.name is not None:
        user.name = req.name
    if req.linkedin_url is not None:
        user.linkedin_url = req.linkedin_url
    if req.github_url is not None:
        user.github_url = req.github_url
    db.commit()
    return {"status": "ok"}

@router.put("/projects/{project_id}")
def update_project(project_id: int, req: ProjectUpdate, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if req.title is not None:
        project.title = req.title
    if req.description is not None:
        project.description = req.description
    if req.progress_pct is not None:
        project.progress_pct = req.progress_pct
    if req.documentation_url is not None:
        project.documentation_url = req.documentation_url
    if req.prototype_url is not None:
        project.prototype_url = req.prototype_url
    if req.impact_report is not None:
        project.impact_report = req.impact_report
        
    db.commit()
    return {"status": "ok"}

@router.post("/projects/{project_id}/submit")
def submit_project(project_id: int, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if (project.progress_pct or 0) < 100:
        raise HTTPException(
            status_code=400, 
            detail=f"Project must reach 100% milestone progress before submitting for review (current: {project.progress_pct or 0}%)."
        )
    project.status = 'submitted'
    db.commit()
    return {"status": "ok", "message": "Project submitted for mentor review."}
