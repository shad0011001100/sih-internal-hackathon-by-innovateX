from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Citizen login (phone OTP via Supabase)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    # Student login (APAAR ID)
    apaar_id = Column(String, unique=True, index=True, nullable=True)
    # University login (Gmail)
    email = Column(String, unique=True, index=True, nullable=True)
    # Legacy: institutional ID (kept for backward compat)
    institution_id = Column(String, unique=True, index=True, nullable=True)
    # Government / Industry login (unique ID + hashed password)
    employee_id = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)

    role = Column(String, default="citizen")  # citizen, student, university, official, industry, admin
    is_active = Column(Boolean, default=True)
    trust_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Profile fields
    name = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)

    reports = relationship("Report", back_populates="citizen")
    university_profile = relationship("University", back_populates="user", uselist=False)
    skill_profiles = relationship("SkillProfile", back_populates="user")
    team_memberships = relationship("TeamMember", back_populates="user")
    industry_profile = relationship("IndustryProfile", back_populates="user", uselist=False)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), index=True)
    category = Column(String, index=True)
    description = Column(String)
    gps_lat = Column(Float)
    gps_lon = Column(Float)
    photo_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    ai_spam_score = Column(Float, default=0.0)

    # Extended 6-step status pipeline:
    # reported -> validated -> assigned -> in_progress -> under_review -> implemented
    status = Column(String, default="reported", index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # AI Intelligent Routing fields (Step 2)
    priority_score = Column(Float, default=0.0)
    challenge_summary = Column(Text, nullable=True)
    suggested_technologies = Column(Text, nullable=True)      # JSON string
    relevant_departments = Column(Text, nullable=True)         # JSON string
    potential_industry = Column(Text, nullable=True)            # JSON string
    is_duplicate = Column(Boolean, default=False)
    duplicate_reason = Column(String, nullable=True)
    is_student_eligible = Column(Boolean, default=True, index=True)
    student_suitability_reason = Column(Text, nullable=True)

    # Assignment fields (Step 3)
    assigned_university_id = Column(Integer, ForeignKey("universities.id"), nullable=True, index=True)
    assigned_department = Column(String, nullable=True)

    citizen = relationship("User", back_populates="reports")
    assigned_university = relationship("University", back_populates="assigned_reports")
    feedback = relationship("Feedback", back_populates="report", uselist=False)
    projects = relationship("Project", back_populates="report")


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    department = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Extended fields for matching
    specializations = Column(Text, nullable=True)   # JSON: ["Civil", "CS", "EVS"]
    faculty_expertise = Column(Text, nullable=True)  # JSON string
    research_areas = Column(Text, nullable=True)     # JSON string
    facilities = Column(Text, nullable=True)         # JSON string
    ranking_score = Column(Float, default=0.0)

    user = relationship("User", back_populates="university_profile")
    assigned_reports = relationship("Report", back_populates="assigned_university")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), unique=True)
    citizen_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer)  # 1-5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("Report", back_populates="feedback")


class Project(Base):
    """A student team's work on a civic problem."""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), index=True)
    title = Column(String)
    description = Column(Text, nullable=True)
    status = Column(String, default="draft", index=True)  # draft, submitted, under_review, accepted, completed
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True, index=True)
    mentor_name = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    progress_pct = Column(Float, default=0.0)
    presentation_url = Column(String, nullable=True)
    documentation_url = Column(String, nullable=True)
    prototype_url = Column(String, nullable=True)
    impact_report = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("Report", back_populates="projects")
    team = relationship("Team", back_populates="project")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="team", uselist=False)
    members = relationship("TeamMember", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    member_name = Column(String, nullable=True)
    apaar_id = Column(String, nullable=True)
    role = Column(String, default="member")  # leader, member
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")


class SkillProfile(Base):
    __tablename__ = "skill_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_name = Column(String)
    proficiency_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    projects_demonstrated = Column(Integer, default=0)
    challenges_participated = Column(Integer, default=0)
    is_soft_skill = Column(Boolean, default=False)

    user = relationship("User", back_populates="skill_profiles")


class FundingOffer(Base):
    __tablename__ = "funding_offers"

    id = Column(Integer, primary_key=True, index=True)
    industry_user_id = Column(Integer, ForeignKey("users.id"), index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True, index=True)
    offer_type = Column(String, default="funding")  # funding, mentorship, technology, prototyping
    amount = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending", index=True)  # pending, accepted, active, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class IndustryProfile(Base):
    __tablename__ = "industry_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    company_name = Column(String)
    sector = Column(String, nullable=True)
    csr_budget = Column(Float, default=0.0)
    total_invested = Column(Float, default=0.0)
    issues_funded = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)

    user = relationship("User", back_populates="industry_profile")
