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
    presentation_url: Optional[str] = None
    documentation_url: Optional[str] = None
    prototype_url: Optional[str] = None
    impact_report: Optional[str] = None

class TeamMemberCreate(BaseModel):
    name: str
    role: Optional[str] = "member"
    apaar_id: Optional[str] = None

class ProjectReleaseRequest(BaseModel):
    reason: Optional[str] = None

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
            p = tm.team.project
            rep = p.report
            techs = []
            if rep and rep.suggested_technologies:
                try:
                    techs = json.loads(rep.suggested_technologies)
                except Exception:
                    techs = [rep.suggested_technologies]
            departments = []
            if rep and rep.relevant_departments:
                try:
                    departments = json.loads(rep.relevant_departments)
                except Exception:
                    departments = [rep.relevant_departments]

            team_members_list = []
            is_leader = False
            if p.team:
                for m in p.team.members:
                    m_name = m.member_name or (m.user.name if m.user else "Innovator")
                    m_apaar = m.apaar_id or (m.user.institution_id if m.user else None)
                    is_curr = (m.user_id == user.id) if m.user_id else False
                    if is_curr and m.role == "leader":
                        is_leader = True
                    team_members_list.append({
                        "id": m.id,
                        "user_id": m.user_id,
                        "name": m_name,
                        "role": m.role or "member",
                        "apaar_id": m_apaar,
                        "joined_at": m.joined_at.isoformat() if m.joined_at else None,
                        "is_current_user": is_curr,
                        "is_leader": m.role == "leader"
                    })

            projects.append({
                "id": p.id,
                "report_id": p.report_id,
                "title": p.title,
                "description": p.description,
                "status": p.status,
                "mentor_name": p.mentor_name,
                "deadline": p.deadline.isoformat() if p.deadline else None,
                "progress_pct": p.progress_pct or 0.0,
                "presentation_url": p.presentation_url,
                "documentation_url": p.documentation_url,
                "prototype_url": p.prototype_url,
                "impact_report": p.impact_report,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "category": rep.category if rep else "General",
                "team_id": p.team_id,
                "team_members": team_members_list,
                "is_leader": is_leader,
                "report": {
                    "id": rep.id,
                    "title": getattr(rep, 'title', None) or rep.challenge_summary or (rep.description[:40] if rep.description else 'Civic Grievance'),
                    "category": rep.category,
                    "description": rep.description,
                    "challenge_summary": rep.challenge_summary,
                    "suggested_technologies": techs if isinstance(techs, list) else [],
                    "relevant_departments": departments if isinstance(departments, list) else [],
                    "gps_lat": rep.gps_lat,
                    "gps_lon": rep.gps_lon,
                    "photo_url": rep.photo_url,
                    "assigned_department": rep.assigned_department,
                    "student_suitability_reason": getattr(rep, 'student_suitability_reason', None)
                } if rep else None
            })
            
    active_projects = [p for p in projects if p.get('status') not in ['completed', 'cancelled']]
    can_adopt = len(active_projects) < 1

    # skill count
    skill_count = len(user.skill_profiles)
    
    # Fast indexed query for available student problems
    problems_count = db.query(models.Report).filter(
        models.Report.status.in_(['reported', 'validated', 'assigned']),
        models.Report.status != 'flagged_spam',
        models.Report.ai_spam_score < 0.6,
        models.Report.is_duplicate.is_(False),
        models.Report.is_student_eligible.is_(True)
    ).count()
    
    return {
        "user": user_info,
        "projects": projects,
        "active_projects_count": len(active_projects),
        "max_active_projects": 1,
        "can_adopt": can_adopt,
        "skill_count": skill_count,
        "available_problems_count": problems_count
    }

@router.get("/problems")
def get_problems(user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    reports = db.query(models.Report).filter(
        models.Report.status.in_(['reported', 'validated', 'assigned']),
        models.Report.status != 'flagged_spam',
        models.Report.ai_spam_score < 0.6,
        models.Report.is_duplicate.is_(False),
        models.Report.is_student_eligible.is_(True)
    ).all()

    # Track reports already adopted by this student or team
    adopted_report_ids = set()
    for tm in user.team_memberships:
        if tm.team and tm.team.project and tm.team.project.report_id:
            adopted_report_ids.add(tm.team.project.report_id)
    
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
            "is_already_adopted": r.id in adopted_report_ids,
            "created_at": r.created_at
        })
        
    return results

@router.post("/projects")
def create_project(req: ProjectCreate, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    MAX_ACTIVE_PROJECTS_PER_STUDENT = 1

    # 1. Verify that the problem exists and is open
    report = db.query(models.Report).filter(models.Report.id == req.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Civic problem report not found.")
        
    if report.status in ["implemented", "resolved"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Problem #{req.report_id} has already been {report.status} and is no longer open for adoption."
        )

    # 2. Check for duplicate adoption (has this student already adopted this report?)
    user_projects = []
    for tm in user.team_memberships:
        if tm.team and tm.team.project:
            user_projects.append(tm.team.project)
            if tm.team.project.report_id == req.report_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"You or your team has already adopted this problem statement (Project #{tm.team.project.id}: '{tm.team.project.title}')."
                )

    # 3. Check active project quota limit
    active_projects = [p for p in user_projects if getattr(p, 'status', None) not in ['completed', 'cancelled']]
    if len(active_projects) >= MAX_ACTIVE_PROJECTS_PER_STUDENT:
        current_title = active_projects[0].title or f"Project #{active_projects[0].id}"
        raise HTTPException(
            status_code=400,
            detail=(
                f"Active Capstone Limit Reached: You already have {len(active_projects)} active project in progress ('{current_title}'). "
                f"To maintain accountability and prevent problem hoarding, students can lead at most {MAX_ACTIVE_PROJECTS_PER_STUDENT} active civic capstone at a time. "
                "Please reach 100% milestone progress and complete your existing project before adopting a new challenge."
            )
        )

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
        member_name=user.name or "Team Lead",
        apaar_id=user.institution_id,
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
        member_name=user.name or "Innovator",
        apaar_id=user.institution_id,
        role="member"
    )
    db.add(tm)
    db.commit()
    return {"status": "joined"}

@router.get("/teams/{team_id}/members")
def get_team_members(team_id: int, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    members = []
    for m in team.members:
        m_name = m.member_name or (m.user.name if m.user else "Innovator")
        m_apaar = m.apaar_id or (m.user.institution_id if m.user else None)
        members.append({
            "id": m.id,
            "user_id": m.user_id,
            "name": m_name,
            "role": m.role or "member",
            "apaar_id": m_apaar,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            "is_current_user": m.user_id == user.id if m.user_id else False,
            "is_leader": m.role == "leader"
        })
    return {"team_id": team.id, "team_name": team.name, "members": members}

@router.post("/teams/{team_id}/members")
def add_team_member(team_id: int, req: TeamMemberCreate, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Permissions: current user must belong to team
    if not any(tm.user_id == user.id for tm in team.members):
        raise HTTPException(status_code=403, detail="You do not have permission to manage this team.")

    # Max team limit: 5 members
    MAX_TEAM_SIZE = 5
    if len(team.members) >= MAX_TEAM_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum team size reached ({MAX_TEAM_SIZE} members max per capstone project)."
        )

    # Check if user with this APAAR ID already exists
    target_user = None
    if req.apaar_id and req.apaar_id.strip():
        apaar_clean = req.apaar_id.strip()
        target_user = db.query(models.User).filter(models.User.institution_id == apaar_clean).first()
        if target_user:
            # Check if this user is already in this team
            if any(m.user_id == target_user.id for m in team.members):
                raise HTTPException(status_code=400, detail=f"Student with APAAR ID {apaar_clean} is already a member of this team.")

            # Check 1 active project quota limit for target user
            active_target = [
                m.team.project for m in target_user.team_memberships
                if m.team and m.team.project and m.team.project.status not in ['completed', 'cancelled']
            ]
            if active_target:
                proj_title = active_target[0].title if active_target[0].title else "an active challenge"
                raise HTTPException(
                    status_code=400,
                    detail=f"Student {apaar_clean} already has an active capstone project in progress ('{proj_title}') and cannot join another team until it is completed."
                )

    new_tm = models.TeamMember(
        team_id=team.id,
        user_id=target_user.id if target_user else None,
        member_name=req.name.strip(),
        apaar_id=req.apaar_id.strip() if req.apaar_id else None,
        role=req.role.strip() if req.role else "member"
    )
    db.add(new_tm)
    db.commit()
    db.refresh(new_tm)

    return {
        "status": "ok",
        "message": f"Teammate {req.name} added successfully.",
        "member": {
            "id": new_tm.id,
            "user_id": new_tm.user_id,
            "name": new_tm.member_name,
            "role": new_tm.role,
            "apaar_id": new_tm.apaar_id,
            "joined_at": new_tm.joined_at.isoformat() if new_tm.joined_at else None,
            "is_current_user": new_tm.user_id == user.id if new_tm.user_id else False,
            "is_leader": new_tm.role == "leader"
        }
    }

@router.delete("/teams/{team_id}/members/{member_id}")
def remove_team_member(team_id: int, member_id: int, user: models.User = Depends(get_student_user), db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    target_member = db.query(models.TeamMember).filter(
        models.TeamMember.id == member_id,
        models.TeamMember.team_id == team_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Team member not found in this team.")

    caller_membership = next((m for m in team.members if m.user_id == user.id), None)
    if not caller_membership:
        raise HTTPException(status_code=403, detail="You do not belong to this team.")

    is_leader = caller_membership.role == "leader"
    is_self = target_member.user_id == user.id

    if not is_leader and not is_self:
        raise HTTPException(status_code=403, detail="Only team leaders can remove teammates, or members can remove themselves.")

    # Enforce MINIMUM team size = 1
    MIN_TEAM_SIZE = 1
    if len(team.members) <= MIN_TEAM_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Minimum team size is 1 member. The last remaining innovator cannot be removed from the team. If you want to drop this project entirely, use 'Release Problem Statement'."
        )

    # If the leader is leaving/removed and other members exist, promote the next member to leader
    if target_member.role == "leader":
        remaining = [m for m in team.members if m.id != target_member.id]
        if remaining:
            remaining[0].role = "leader"
            db.add(remaining[0])

    member_label = target_member.member_name or f"Member #{target_member.id}"
    db.delete(target_member)
    db.commit()

    return {
        "status": "ok",
        "message": f"{member_label} has been removed from the team. Their active capstone quota is now freed up."
    }

@router.post("/projects/{project_id}/release")
def release_project(
    project_id: int,
    req: ProjectReleaseRequest,
    user: models.User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify user belongs to this team
    if not project.team or not any(m.user_id == user.id for m in project.team.members):
        raise HTTPException(status_code=403, detail="You do not belong to this project team.")

    # Mark project as cancelled/released
    project.status = "cancelled"
    if req.reason:
        note = f"\n[Released by Student Team: {req.reason.strip()}]"
        project.description = (project.description or "") + note

    # Delete team memberships so that all members get their quota unlocked immediately
    if project.team:
        for m in project.team.members:
            db.delete(m)

    # Reopen civic report if not already implemented/resolved
    report = db.query(models.Report).filter(models.Report.id == project.report_id).first()
    if report and report.status not in ["implemented", "resolved"]:
        # check if any other active project exists for this report
        other_active = db.query(models.Project).filter(
            models.Project.report_id == report.id,
            models.Project.id != project.id,
            models.Project.status.in_(["draft", "in_progress", "submitted", "under_review", "accepted"])
        ).first()
        if not other_active and report.status in ["assigned", "in_progress"]:
            report.status = "assigned"

    db.commit()
    return {
        "status": "ok",
        "message": f"Problem statement #{project.report_id} released successfully. Your capstone quota slot is now open."
    }

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
    if req.presentation_url is not None:
        project.presentation_url = req.presentation_url
    if req.documentation_url is not None:
        project.documentation_url = req.documentation_url
    if req.prototype_url is not None:
        project.prototype_url = req.prototype_url
    if req.impact_report is not None:
        project.impact_report = req.impact_report
        
    db.commit()
    db.refresh(project)
    return {
        "status": "ok",
        "project": {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "progress_pct": project.progress_pct,
            "presentation_url": project.presentation_url,
            "documentation_url": project.documentation_url,
            "prototype_url": project.prototype_url,
            "impact_report": project.impact_report,
            "status": project.status
        }
    }

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
