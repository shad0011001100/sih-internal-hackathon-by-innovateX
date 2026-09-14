from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from routers import auth, reports, admin, auth_institutional
from routers import feedback, students, university, industry

app = FastAPI(title="Sanjha API", version="1.0.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.31.241:5173",
    "*",  # Allow all for hackathon demo
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(auth_institutional.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(feedback.router)
app.include_router(students.router)
app.include_router(university.router)
app.include_router(industry.router)

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    return {"status": "ok", "db": db_status}
