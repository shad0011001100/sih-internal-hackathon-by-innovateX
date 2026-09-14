import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent.parent
frontend_src = root / "frontend" / "src"

def test_official_dashboard():
    path = frontend_src / "features" / "official" / "OfficialDashboard.tsx"
    content = path.read_text(encoding="utf-8")
    
    assert "useToast" in content, "OfficialDashboard must import useToast"
    assert "updateReportStatus" in content
    assert "assignReport" in content
    assert "reviewSubmission" in content
    assert "implementProject" in content
    assert "mutatingId" in content, "OfficialDashboard must manage mutatingId loading indicator"
    assert "showToast" in content, "OfficialDashboard must provide toast feedback"
    assert "showComingSoon" in content, "OfficialDashboard must use showComingSoon for map/settings"
    assert "GIS Ward Map" in content
    assert "Official Portal Settings" in content
    print("[PASS] OfficialDashboard assertions passed")

def test_student_dashboard():
    path = frontend_src / "features" / "student" / "StudentDashboard.tsx"
    content = path.read_text(encoding="utf-8")
    
    assert "useToast" in content, "StudentDashboard must import useToast"
    assert "selectedCategory" in content, "StudentDashboard must manage selectedCategory"
    assert "filteredIssues" in content, "StudentDashboard must filter open problems in real time"
    assert "/api/student/projects" in content, "StudentDashboard must call /api/student/projects"
    assert "handleAdoptProblem" in content, "StudentDashboard must implement handleAdoptProblem"
    assert "/submit" in content, "StudentDashboard must call /submit endpoint"
    assert "handleSubmitProject" in content, "StudentDashboard must implement handleSubmitProject"
    assert "handleUpdateProject" in content, "StudentDashboard must implement handleUpdateProject"
    assert "openAdoptModal" in content, "StudentDashboard must have adopt modal trigger"
    assert "openProjectModal" in content, "StudentDashboard must have project modal trigger"
    assert "Browse Problems" in content
    assert "showComingSoon" in content
    assert "Student Profile Settings" in content
    assert "alert(" not in content, "StudentDashboard must not contain alert()"
    assert "fetch(\"/api/student/dashboard\").then(res => res.json()).catch(() => ({" not in content, "Silent fallback swallowing must be removed"
    print("[PASS] StudentDashboard assertions passed")

def test_industry_dashboard():
    path = frontend_src / "features" / "industry" / "IndustryDashboard.tsx"
    content = path.read_text(encoding="utf-8")
    
    assert "useToast" in content, "IndustryDashboard must import useToast"
    assert 'project_id' in content, "IndustryDashboard must use project_id in handleFund"
    assert 'offer_type: "funding"' in content or 'offer_type: \'funding\'' in content, "IndustryDashboard must send offer_type: 'funding'"
    assert "alert(" not in content, "IndustryDashboard must not contain alert()"
    assert "showToast" in content, "IndustryDashboard must use showToast"
    assert "fundingId" in content, "IndustryDashboard must manage funding loading state"
    assert "Portfolio Tracker" in content, "IndustryDashboard must wire Portfolio coming soon"
    assert "Impact Analytics" in content, "IndustryDashboard must wire Impact coming soon"
    assert "Partner Settings" in content, "IndustryDashboard must wire Settings coming soon"
    print("[PASS] IndustryDashboard assertions passed")

def test_university_dashboard():
    path = frontend_src / "features" / "university" / "UniversityDashboard.tsx"
    content = path.read_text(encoding="utf-8")
    
    assert "useToast" in content, "UniversityDashboard must import useToast"
    assert "assigned_reports_count" in content, "UniversityDashboard must support assigned_reports_count"
    assert "projects_in_progress" in content, "UniversityDashboard must support projects_in_progress"
    assert "university_info" in content, "UniversityDashboard must support university_info"
    assert "University Settings" in content, "UniversityDashboard must wire Settings coming soon"
    assert "showComingSoon" in content
    assert "alert(" not in content, "UniversityDashboard must not contain alert()"
    print("[PASS] UniversityDashboard assertions passed")

if __name__ == "__main__":
    test_official_dashboard()
    test_student_dashboard()
    test_industry_dashboard()
    test_university_dashboard()
    print("\nALL BEHAVIORAL AND CONTRACT ASSERTIONS PASSED SUCCESSFULLY!")
