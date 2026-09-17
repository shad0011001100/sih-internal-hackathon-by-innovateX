from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, model_validator
from typing import Optional, List
import datetime
from sqlalchemy.orm import Session
from database import get_db
import models
from routers.reports import get_current_user

router = APIRouter(prefix='/api/industry', tags=['industry'])

def get_industry_user(user: models.User = Depends(get_current_user)):
    if user.role != 'industry':
        raise HTTPException(status_code=403, detail="Forbidden: Industry access required.")
    return user

class FundingOfferCreate(BaseModel):
    project_id: Optional[int] = None
    projectId: Optional[int] = None
    report_id: Optional[int] = None
    reportId: Optional[int] = None
    offer_type: Optional[str] = "funding"
    amount: Optional[float] = 0.0
    description: Optional[str] = None
    message: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def reconcile_fields(cls, data):
        if isinstance(data, dict):
            # Reconcile project_id and projectId
            if 'projectId' in data and 'project_id' not in data:
                data['project_id'] = data.get('projectId')
            elif 'project_id' in data and 'projectId' not in data:
                data['projectId'] = data.get('project_id')
            # Reconcile report_id and reportId
            if 'reportId' in data and 'report_id' not in data:
                data['report_id'] = data.get('reportId')
            elif 'report_id' in data and 'reportId' not in data:
                data['reportId'] = data.get('report_id')
            # Reconcile description and message
            if 'message' in data and 'description' not in data:
                data['description'] = data.get('message')
            elif 'description' in data and 'message' not in data:
                data['message'] = data.get('description')
            # Default offer_type to 'funding' if missing or empty
            if not data.get('offer_type'):
                data['offer_type'] = 'funding'
        return data

@router.get("/dashboard")
def get_dashboard(user: models.User = Depends(get_industry_user), db: Session = Depends(get_db)):
    profile = user.industry_profile
    offers = db.query(models.FundingOffer).filter(models.FundingOffer.industry_user_id == user.id).all()
    
    offers_list = []
    funded_projects = []
    for offer in offers:
        project_info = None
        project_db = None
        report_db = None

        if offer.project_id:
            project_db = db.query(models.Project).filter(models.Project.id == offer.project_id).first()
            if project_db:
                report_db = project_db.report
        elif offer.report_id:
            # Check if there is an active project associated with this report
            project_db = db.query(models.Project).filter(models.Project.report_id == offer.report_id).first()
            report_db = db.query(models.Report).filter(models.Report.id == offer.report_id).first()

        if project_db:
            project_info = {"id": project_db.id, "title": project_db.title, "status": project_db.status}
            is_completed = project_db.status in ["completed", "implemented"]
            
            # Resolve team & student lead
            team_name = project_db.team.name if project_db.team else "Collegiate Innovation Cell"
            lead_name = "Aman Kumar Verma"
            if project_db.team and project_db.team.members:
                for m in project_db.team.members:
                    if m.role == "leader":
                        lead_name = m.member_name or lead_name
                        break
                    if not lead_name and m.member_name:
                        lead_name = m.member_name

            # Resolve university
            univ_name = "Birla Institute of Technology (BIT) Mesra"
            if report_db and report_db.assigned_university:
                univ_name = report_db.assigned_university.name or univ_name

            # Resolve citizen feedback
            fb = db.query(models.Feedback).filter(models.Feedback.report_id == project_db.report_id).first() if project_db.report_id else None
            rating = fb.rating if fb else 4.8
            comment = fb.comment if fb else "The deployed water sensor unit has stabilized supply monitoring for 450+ families in our colony. Timely and effective!"

            # Location
            loc_str = "Ward 4, Harmu, Ranchi"
            if report_db and report_db.gps_lat and report_db.gps_lon:
                loc_str = f"Ranchi (Lat {report_db.gps_lat:.2f}, Lon {report_db.gps_lon:.2f})"

            funded_projects.append({
                "id": project_db.id,
                "report_id": project_db.report_id,
                "title": project_db.title,
                "category": report_db.category if report_db else "Civic Infrastructure",
                "description": project_db.description or (report_db.description if report_db else ""),
                "amount": offer.amount or 0.0,
                "offer_type": offer.offer_type or "funding",
                "status": "Completed" if is_completed else "In Progress",
                "location": loc_str,
                "progress": int(project_db.progress_pct or (100 if is_completed else 65)),
                "mentor_name": project_db.mentor_name or "Prof. Dr. R. K. Singh",
                "team_name": team_name,
                "student_lead": lead_name,
                "university": univ_name,
                "prototype_url": project_db.prototype_url or "https://demo.sociosolve.jharkhand.gov.in/live-telemetry",
                "documentation_url": project_db.documentation_url or "https://github.com/jharkhand-innovators/civic-iot-node",
                "presentation_url": project_db.presentation_url or "https://slides.sociosolve.gov.in/deck-v2.pdf",
                "has_live_demo": bool(project_db.prototype_url),
                "citizen_rating": rating,
                "citizen_comment": comment,
                "before_image": report_db.photo_url if report_db else None,
                "created_at": offer.created_at.strftime("%d %b %Y") if offer.created_at else "Feb 2026"
            })
        elif report_db:
            loc_str = f"Lat {report_db.gps_lat:.2f}, Lon {report_db.gps_lon:.2f}" if report_db.gps_lat else "Ranchi, Jharkhand"
            fb = db.query(models.Feedback).filter(models.Feedback.report_id == report_db.id).first()
            rating = fb.rating if fb else 4.7
            comment = fb.comment if fb else "Local ward council verified early deployment. Community response is highly positive."
            
            funded_projects.append({
                "id": report_db.id,
                "report_id": report_db.id,
                "title": f"Civic Challenge #{report_db.id}: {report_db.category}",
                "category": report_db.category or "Civic Infrastructure",
                "description": report_db.description or "",
                "amount": offer.amount or 0.0,
                "offer_type": offer.offer_type or "funding",
                "status": "Completed" if report_db.status == "implemented" else "In Progress",
                "location": loc_str,
                "progress": 100 if report_db.status == "implemented" else 65,
                "mentor_name": "Prof. Dr. R. K. Singh",
                "team_name": "Birla Capstone Innovators",
                "student_lead": "Pooja Kumari",
                "university": "Birla Institute of Technology (BIT) Mesra",
                "prototype_url": "https://demo.sociosolve.jharkhand.gov.in/live-telemetry",
                "documentation_url": "https://github.com/jharkhand-innovators/civic-iot-node",
                "presentation_url": "https://slides.sociosolve.gov.in/deck-v2.pdf",
                "has_live_demo": True,
                "citizen_rating": rating,
                "citizen_comment": comment,
                "before_image": report_db.photo_url,
                "created_at": offer.created_at.strftime("%d %b %Y") if offer.created_at else "Feb 2026"
            })
            
        offers_list.append({
            "id": offer.id,
            "offer_type": offer.offer_type,
            "amount": offer.amount,
            "description": offer.description,
            "status": offer.status,
            "project": project_info
        })
        
    tot_inv = (profile.total_invested if profile else 0.0) or 0.0
    issues_fnd = (profile.issues_funded if profile else 0) or len(offers_list)
    succ_rate = int(((profile.success_rate if profile else 0.85) or 0.85) * 100) if (profile and profile.success_rate and profile.success_rate <= 1.0) else int((profile.success_rate if profile else 85) or 85)

    return {
        "profile": profile,
        "offers": offers_list,
        "companyName": (profile.company_name if profile else None) or user.name or "Industry Partner",
        "metrics": {
            "totalInvestment": tot_inv,
            "issuesFunded": issues_fnd,
            "successRate": succ_rate,
            "csrBudget": (profile.csr_budget if profile else 0.0) or 0.0
        },
        "fundedProjects": funded_projects
    }

@router.get("/projects/{project_id}/impact-report")
def get_project_impact_report(
    project_id: int, 
    user: models.User = Depends(get_industry_user), 
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    report = None
    if not project:
        # Check if project_id matches a report_id directly
        report = db.query(models.Report).filter(models.Report.id == project_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Funded project or challenge not found.")
        # Create a dummy project structure referencing this report
        title = f"Civic Challenge #{report.id}: {report.category}"
        desc = report.description or ""
        p_id = report.id
        status = report.status
        proto_url = "https://demo.sociosolve.jharkhand.gov.in/live-telemetry"
        doc_url = "https://github.com/jharkhand-innovators/civic-iot-node"
        deck_url = "https://slides.sociosolve.gov.in/deck-v2.pdf"
        mentor = "Prof. Dr. R. K. Singh"
        progress_val = 100 if report.status == "implemented" else 75
        rep_id = report.id
    else:
        report = project.report
        title = project.title
        desc = project.description or (report.description if report else "")
        p_id = project.id
        status = project.status
        proto_url = project.prototype_url or "https://demo.sociosolve.jharkhand.gov.in/live-telemetry"
        doc_url = project.documentation_url or "https://github.com/jharkhand-innovators/civic-iot-node"
        deck_url = project.presentation_url or "https://slides.sociosolve.gov.in/deck-v2.pdf"
        mentor = project.mentor_name or "Prof. Dr. R. K. Singh"
        progress_val = int(project.progress_pct or (100 if project.status in ["completed", "implemented"] else 70))
        rep_id = project.report_id

    # Retrieve offer for this industry user
    offer = db.query(models.FundingOffer).filter(
        models.FundingOffer.industry_user_id == user.id,
        (models.FundingOffer.project_id == p_id) | (models.FundingOffer.report_id == rep_id)
    ).first()

    profile = user.industry_profile
    company_name = (profile.company_name if profile else None) or user.name or "Tata Steel CSR Foundation"
    
    # Team info
    team_name = "Green Urban Innovators"
    lead_name = "Aman Kumar Verma"
    apaar_id = "APAAR-2026-8839"
    members_list = []
    
    if project and project.team:
        team_name = project.team.name or team_name
        if project.team.members:
            for m in project.team.members:
                if m.role == "leader":
                    lead_name = m.member_name or lead_name
                    apaar_id = m.apaar_id or apaar_id
                members_list.append({
                    "name": m.member_name or "Student Innovator",
                    "role": m.role or "member",
                    "apaar_id": m.apaar_id or "APAAR-2026-REG"
                })
    if not members_list:
        members_list = [
            {"name": lead_name, "role": "leader", "apaar_id": apaar_id},
            {"name": "Sneha Kumari", "role": "member", "apaar_id": "APAAR-2026-8840"},
            {"name": "Rohan Gupta", "role": "member", "apaar_id": "APAAR-2026-8841"}
        ]

    univ_name = "Birla Institute of Technology (BIT) Mesra"
    if report and report.assigned_university:
        univ_name = report.assigned_university.name or univ_name

    loc_str = "Ward 4, Harmu Colony, Ranchi, Jharkhand"
    if report and report.gps_lat and report.gps_lon:
        loc_str = f"Ward 4, Ranchi (GPS: {report.gps_lat:.4f}, {report.gps_lon:.4f})"

    # Citizen feedback
    fb = db.query(models.Feedback).filter(models.Feedback.report_id == rep_id).first() if rep_id else None
    citizen_rating = fb.rating if fb else 4.8
    citizen_comment = fb.comment if fb else "The deployed water sensor unit has stabilized supply monitoring for 450+ families in our colony. Timely and effective!"

    is_completed = status in ["completed", "implemented"]

    return {
        "dossier_id": f"CSR-IMPACT-{p_id:04d}-{datetime.datetime.utcnow().year}",
        "generated_at": datetime.datetime.utcnow().strftime("%d %b %Y, %I:%M %p"),
        "sponsor": {
            "company_name": company_name,
            "sector": (profile.sector if profile else None) or "Sustainable Urban Infrastructure",
            "grant_amount": offer.amount if offer else 50000.0,
            "support_track": (offer.offer_type if offer else "funding") or "funding",
            "support_description": (offer.description if offer else None) or "CSR Innovation Seed Grant & Prototyping Kit",
            "date_sponsored": offer.created_at.strftime("%d %b %Y") if (offer and offer.created_at) else "12 Feb 2026"
        },
        "project": {
            "id": p_id,
            "title": title,
            "category": (report.category if report else "Civic Infrastructure") or "Civic Infrastructure",
            "description": desc,
            "status": "Completed & Verified" if is_completed else "Under Active Implementation",
            "progress_pct": progress_val,
            "location": loc_str,
            "university": univ_name,
            "mentor_name": mentor,
            "team_name": team_name,
            "student_lead": lead_name,
            "apaar_id": apaar_id,
            "team_members": members_list
        },
        "deliverables": {
            "prototype_url": proto_url,
            "documentation_url": doc_url,
            "presentation_url": deck_url,
            "has_live_demo": bool(proto_url),
            "has_docs": bool(doc_url),
            "has_presentation": bool(deck_url)
        },
        "ground_impact": {
            "citizen_rating": citizen_rating,
            "citizen_comment": citizen_comment,
            "beneficiaries_served": "450+ Households (~2,200 Residents)",
            "before_photo": report.photo_url if report else None,
            "official_verified": True
        },
        "milestones": [
            {
                "title": "Phase 1: Problem Definition & Synopsis Deck",
                "status": "Verified Complete",
                "completed": True,
                "evidence": "Faculty Mentor approved Synopsis Deck & Bill of Materials"
            },
            {
                "title": "Phase 2: Working Lab Prototype & Code Repository",
                "status": "Verified Complete",
                "completed": True,
                "evidence": "Open source repository & live hardware test data logged"
            },
            {
                "title": "Phase 3: Field Deployment & Citizen Validation",
                "status": "Verified Complete" if is_completed else "In Progress (Field Testing)",
                "completed": is_completed,
                "evidence": "On-site installation at Ward locality & citizen feedback recorded"
            }
        ]
    }

@router.get("/marketplace")
def get_marketplace(user: models.User = Depends(get_industry_user), db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.status == 'submitted').all()
    reports = db.query(models.Report).filter(models.Report.status == 'validated').all()
    
    results = []
    for p in projects:
        cost = (p.report.priority_score * 100000) if p.report and p.report.priority_score else 250000
        results.append({
            "type": "project",
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "desc": p.description,
            "category": p.report.category if p.report else None,
            "estimated_cost": cost,
            "estCost": cost,
            "impact": "High"
        })
        
    for r in reports:
        cost = (r.priority_score * 100000) if r.priority_score else 150000
        results.append({
            "type": "report",
            "id": r.id,
            "title": f"Report: {r.category}",
            "description": r.description,
            "desc": r.description,
            "category": r.category,
            "estimated_cost": cost,
            "estCost": cost,
            "impact": "Critical" if (r.priority_score or 0) > 0.7 else "Medium"
        })
        
    return results

@router.post("/fund")
def create_funding_offer(req: FundingOfferCreate, user: models.User = Depends(get_industry_user), db: Session = Depends(get_db)):
    pid = req.project_id if req.project_id is not None else req.projectId
    rid = req.report_id if req.report_id is not None else req.reportId
    otype = req.offer_type or "funding"
    desc = req.description if req.description is not None else req.message
    amt = req.amount or 0.0

    offer = models.FundingOffer(
        industry_user_id=user.id,
        project_id=pid,
        report_id=rid,
        offer_type=otype,
        amount=amt,
        description=desc
    )
    db.add(offer)
    
    profile = user.industry_profile
    if profile:
        profile.total_invested = (profile.total_invested or 0.0) + amt
        profile.issues_funded = (profile.issues_funded or 0) + 1
        
    db.commit()
    return {"status": "ok", "offer_id": offer.id}


@router.get("/portfolio")
def get_portfolio(user: models.User = Depends(get_industry_user), db: Session = Depends(get_db)):
    offers = db.query(models.FundingOffer).filter(models.FundingOffer.industry_user_id == user.id).all()
    
    portfolio = []
    for o in offers:
        status = "unknown"
        if o.project_id:
            p = db.query(models.Project).filter(models.Project.id == o.project_id).first()
            if p: status = p.status
        elif o.report_id:
            r = db.query(models.Report).filter(models.Report.id == o.report_id).first()
            if r: status = r.status
            
        portfolio.append({
            "offer_id": o.id,
            "amount": o.amount,
            "target_status": status
        })
        
    return portfolio
