from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
from routers.reports import get_current_user

router = APIRouter(prefix="/api/reports", tags=["feedback"])

class FeedbackCreate(BaseModel):
    rating: int
    comment: str | None = None

@router.post("/{report_id}/feedback")
def submit_feedback(report_id: int, req: FeedbackCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.citizen_id != user.id:
        raise HTTPException(status_code=403, detail="Only the citizen who filed the report can leave feedback")
        
    if report.status not in ["implemented", "resolved"]:
        raise HTTPException(status_code=400, detail="Feedback can only be left for implemented or resolved reports")
        
    existing = db.query(models.Feedback).filter(models.Feedback.report_id == report_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this report")

    feedback = models.Feedback(
        report_id=report_id,
        citizen_id=user.id,
        rating=req.rating,
        comment=req.comment
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {"status": "ok", "feedback_id": feedback.id}

@router.get("/{report_id}/feedback")
def get_feedback(report_id: int, db: Session = Depends(get_db)):
    feedback = db.query(models.Feedback).filter(models.Feedback.report_id == report_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="No feedback found for this report")
    
    return {
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": feedback.created_at
    }
