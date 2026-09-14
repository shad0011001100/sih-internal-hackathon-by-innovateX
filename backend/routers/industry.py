from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, model_validator
from typing import Optional, List
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
        project = None
        if offer.project_id:
            project_db = db.query(models.Project).filter(models.Project.id == offer.project_id).first()
            if project_db:
                project = {"id": project_db.id, "title": project_db.title, "status": project_db.status}
                funded_projects.append({
                    "id": project_db.id,
                    "title": project_db.title,
                    "category": project_db.report.category if project_db.report else "Infrastructure",
                    "amount": offer.amount or 0.0,
                    "status": "Completed" if project_db.status in ["completed", "implemented"] else "In Progress",
                    "location": f"Lat {project_db.report.gps_lat:.2f}, Lon {project_db.report.gps_lon:.2f}" if (project_db.report and project_db.report.gps_lat) else "Jharkhand",
                    "progress": int(project_db.progress_pct or 0)
                })
        elif offer.report_id:
            report_db = db.query(models.Report).filter(models.Report.id == offer.report_id).first()
            if report_db:
                funded_projects.append({
                    "id": report_db.id,
                    "title": f"Report #{report_db.id}: {report_db.category}",
                    "category": report_db.category or "Grievance",
                    "amount": offer.amount or 0.0,
                    "status": "Completed" if report_db.status == "implemented" else "In Progress",
                    "location": f"Lat {report_db.gps_lat:.2f}, Lon {report_db.gps_lon:.2f}" if report_db.gps_lat else "Jharkhand",
                    "progress": 100 if report_db.status == "implemented" else 50
                })
                
        offers_list.append({
            "id": offer.id,
            "offer_type": offer.offer_type,
            "amount": offer.amount,
            "description": offer.description,
            "status": offer.status,
            "project": project
        })
        
    tot_inv = (profile.total_invested if profile else 0.0) or 0.0
    issues_fnd = (profile.issues_funded if profile else 0) or len(offers_list)
    succ_rate = int(((profile.success_rate if profile else 0.85) or 0.85) * 100) if (profile and profile.success_rate and profile.success_rate <= 1.0) else int((profile.success_rate if profile else 85) or 85)

    return {
        "profile": profile,
        "offers": offers_list,
        # Aligned properties for frontend IndustryDashboard
        "companyName": (profile.company_name if profile else None) or user.name or "Industry Partner",
        "metrics": {
            "totalInvestment": tot_inv,
            "issuesFunded": issues_fnd,
            "successRate": succ_rate,
            "csrBudget": (profile.csr_budget if profile else 0.0) or 0.0
        },
        "fundedProjects": funded_projects
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
