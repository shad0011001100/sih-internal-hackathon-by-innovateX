import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
from routers.auth_institutional import create_jwt

client = TestClient(app)
db = SessionLocal()

print("--- Starting Worker M3 Verification Suite ---")

# -------------------------------------------------------------
# 1. Verify GET /api/reports (Public Community Feed)
# -------------------------------------------------------------
print("\n[Test 1] Verifying GET /api/reports (Public Community Feed)")

# Ensure clean test state for reports
test_citizen = db.query(models.User).filter(models.User.phone_number == "9999900001").first()
if not test_citizen:
    test_citizen = models.User(phone_number="9999900001", role="citizen", name="Test Citizen")
    db.add(test_citizen)
    db.commit()
    db.refresh(test_citizen)

# Create 3 reports: 1 reported (unverified), 1 validated (verified), 1 in_progress
r1 = models.Report(
    citizen_id=test_citizen.id,
    category="Water & Sanitation",
    description="Broken pipe near Main Road",
    status="reported",
    is_verified=False
)
r2 = models.Report(
    citizen_id=test_citizen.id,
    category="Water & Sanitation",
    description="Community well needs filtration",
    status="validated",
    is_verified=True,
    challenge_summary="Community Well Filtration",
    assigned_department="Water Resources",
    gps_lat=23.34,
    gps_lon=85.30
)
r3 = models.Report(
    citizen_id=test_citizen.id,
    category="Road & Infrastructure",
    description="Dangerous pothole on highway",
    status="in_progress",
    is_verified=True,
    challenge_summary="Highway Pothole Patching",
    assigned_department="Public Works",
    gps_lat=23.35,
    gps_lon=85.32
)
db.add_all([r1, r2, r3])
db.commit()

# Test public access without any auth
res = client.get("/api/reports")
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
reports = res.json()
print(f"  Public GET /api/reports returned {len(reports)} reports (verified only)")
assert isinstance(reports, list), "Expected list response"
assert len(reports) >= 2, f"Expected at least 2 verified reports, got {len(reports)}"

# Verify reported (unverified) report r1 is excluded by default
returned_ids = [r["id"] for r in reports]
assert r1.id not in returned_ids, "Unverified 'reported' issue should not be in default public feed"
assert r2.id in returned_ids, "Validated report r2 must be in public feed"
assert r3.id in returned_ids, "In-progress report r3 must be in public feed"

# Verify response fields contract (PROJECT.md and frontend expectations)
sample = next(r for r in reports if r["id"] == r2.id)
assert "id" in sample
assert "title" in sample and sample["title"] == "Community Well Filtration"
assert "description" in sample
assert "category" in sample and sample["category"] == "Water & Sanitation"
assert "status" in sample and sample["status"] == "validated"
assert "department" in sample and sample["department"] == "Water Resources"
assert "location" in sample and sample["location"] == {"lat": 23.34, "lon": 85.30}
assert "photo_url" in sample
assert "is_verified" in sample and sample["is_verified"] is True
print("  Contract fields validated: id, title, description, category, status, department, location, is_verified")

# Test category filter
res_cat = client.get("/api/reports?category=Road")
assert res_cat.status_code == 200
cat_reports = res_cat.json()
assert all("Road" in r["category"] for r in cat_reports), "Category filter failed"
assert any(r["id"] == r3.id for r in cat_reports), "r3 should match Road category"
print("  Category filter '?category=Road' successfully isolated road issues")

# Test limit filter
res_lim = client.get("/api/reports?limit=1")
assert res_lim.status_code == 200
assert len(res_lim.json()) == 1, f"Limit 1 returned {len(res_lim.json())}"
print("  Limit parameter '?limit=1' successfully respected")

# Test trailing slash tolerance
res_slash = client.get("/api/reports/")
assert res_slash.status_code == 200
print("  Trailing slash /api/reports/ succeeded without redirection error")

# -------------------------------------------------------------
# 2. Verify GET /api/auth/me (Session Verification API)
# -------------------------------------------------------------
print("\n[Test 2] Verifying GET /api/auth/me (Session Verification API)")

# Unauthenticated request -> must return 401
res_unauth = client.get("/api/auth/me")
assert res_unauth.status_code == 401, f"Expected 401 for unauthenticated call, got {res_unauth.status_code}"
print("  Unauthenticated call correctly rejected with 401 Unauthorized")

# Invalid token -> must return 401
res_bad = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token_123"})
assert res_bad.status_code == 401, f"Expected 401 for bad token, got {res_bad.status_code}"
print("  Invalid token correctly rejected with 401 Unauthorized")

# Create test official user and valid token
test_official = db.query(models.User).filter(models.User.employee_id == "GOV-001").first()
if not test_official:
    test_official = models.User(employee_id="GOV-001", role="official", name="Gov Officer Demo")
    db.add(test_official)
    db.commit()
    db.refresh(test_official)

token = create_jwt(test_official.id, test_official.role)

# Test Bearer header authentication
res_auth_header = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
assert res_auth_header.status_code == 200, f"Expected 200, got {res_auth_header.status_code}: {res_auth_header.text}"
user_data = res_auth_header.json()
assert user_data["id"] == test_official.id
assert user_data["role"] == "official"
assert user_data["employee_id"] == "GOV-001"
print("  Bearer Authorization header verification passed: user_id and role verified")

# Test Cookie authentication
client.cookies.set("access_token", token)
res_cookie = client.get("/api/auth/me")
assert res_cookie.status_code == 200, f"Expected 200, got {res_cookie.status_code}: {res_cookie.text}"
assert res_cookie.json()["id"] == test_official.id
print("  access_token cookie verification passed: session verified")
client.cookies.clear()

# -------------------------------------------------------------
# 3. Verify POST /api/industry/fund & IndustryDashboard Alignment
# -------------------------------------------------------------
print("\n[Test 3] Verifying POST /api/industry/fund & Industry Dashboard Alignment")

# Setup Industry test user
test_industry = db.query(models.User).filter(models.User.employee_id == "IND-001").first()
if not test_industry:
    test_industry = models.User(employee_id="IND-001", role="industry", name="Industry Partner Demo")
    db.add(test_industry)
    db.commit()
    db.refresh(test_industry)

# Ensure industry profile exists
if not test_industry.industry_profile:
    ind_profile = models.IndustryProfile(
        user_id=test_industry.id,
        company_name="Tata Steel CSR",
        sector="Manufacturing",
        csr_budget=5000000.0,
        total_invested=1000000.0,
        issues_funded=5,
        success_rate=0.88
    )
    db.add(ind_profile)
    db.commit()
    db.refresh(test_industry)

# Create a sample project to fund
sample_project = db.query(models.Project).first()
if not sample_project:
    sample_project = models.Project(
        report_id=r2.id,
        title="Solar Water Purifier Prototype",
        description="Low cost solar water purifier unit",
        status="submitted"
    )
    db.add(sample_project)
    db.commit()
    db.refresh(sample_project)

ind_token = create_jwt(test_industry.id, "industry")
ind_headers = {"Authorization": f"Bearer {ind_token}"}

# Test 3a: Frontend payload format: { "projectId": ..., "amount": ... } (OMITS offer_type, uses camelCase)
# Previously triggered HTTP 422!
res_fund_camel = client.post(
    "/api/industry/fund",
    headers=ind_headers,
    json={"projectId": sample_project.id, "amount": 75000.0}
)
assert res_fund_camel.status_code == 200, f"Expected 200 for camelCase projectId, got {res_fund_camel.status_code}: {res_fund_camel.text}"
res_data = res_fund_camel.json()
assert res_data["status"] == "ok"
offer_id_1 = res_data["offer_id"]

offer_db_1 = db.query(models.FundingOffer).filter(models.FundingOffer.id == offer_id_1).first()
assert offer_db_1 is not None
assert offer_db_1.project_id == sample_project.id
assert offer_db_1.offer_type == "funding"
assert offer_db_1.amount == 75000.0
print("  POST /api/industry/fund with { projectId, amount } succeeded without HTTP 422!")

# Test 3b: Standard snake_case payload with message
res_fund_snake = client.post(
    "/api/industry/fund",
    headers=ind_headers,
    json={
        "project_id": sample_project.id,
        "offer_type": "mentorship",
        "amount": 25000.0,
        "message": "Senior engineering mentorship for water testing"
    }
)
assert res_fund_snake.status_code == 200, f"Expected 200 for snake_case payload, got {res_fund_snake.status_code}: {res_fund_snake.text}"
offer_id_2 = res_fund_snake.json()["offer_id"]
offer_db_2 = db.query(models.FundingOffer).filter(models.FundingOffer.id == offer_id_2).first()
assert offer_db_2.description == "Senior engineering mentorship for water testing"
assert offer_db_2.offer_type == "mentorship"
print("  POST /api/industry/fund with snake_case and custom message succeeded!")

# Test 3c: Verify GET /api/industry/dashboard returns BOTH existing profile/offers AND aligned frontend keys
res_dash = client.get("/api/industry/dashboard", headers=ind_headers)
assert res_dash.status_code == 200
dash_data = res_dash.json()
assert "profile" in dash_data, "Existing profile key missing"
assert "offers" in dash_data, "Existing offers key missing"
assert "companyName" in dash_data, "Frontend companyName key missing"
assert "metrics" in dash_data, "Frontend metrics object missing"
assert "totalInvestment" in dash_data["metrics"], "metrics.totalInvestment missing"
assert "issuesFunded" in dash_data["metrics"], "metrics.issuesFunded missing"
assert "successRate" in dash_data["metrics"], "metrics.successRate missing"
assert "fundedProjects" in dash_data, "Frontend fundedProjects list missing"
print(f"  GET /api/industry/dashboard verified: companyName='{dash_data['companyName']}', totalInvestment={dash_data['metrics']['totalInvestment']}")

# Test 3d: Verify GET /api/industry/marketplace returns estCost and desc aliases
res_market = client.get("/api/industry/marketplace", headers=ind_headers)
assert res_market.status_code == 200
market_items = res_market.json()
assert len(market_items) > 0
first_item = market_items[0]
assert "estimated_cost" in first_item and "estCost" in first_item
assert "description" in first_item and "desc" in first_item
print("  GET /api/industry/marketplace verified: estCost and desc aliases present")

# -------------------------------------------------------------
# 4. Existing Endpoints Regression Suite
# -------------------------------------------------------------
print("\n[Test 4] Verifying Existing Auth & Health Endpoints for Regressions")

# Health
res_health = client.get("/api/health")
assert res_health.status_code == 200
assert res_health.json()["db"] == "connected"
print("  GET /api/health passed")


# Send OTP
res_otp = client.post("/api/auth/send-otp", json={"phone_number": "9876543210"})
assert res_otp.status_code == 200
print("  POST /api/auth/send-otp passed")

# Verify OTP
res_votp = client.post("/api/auth/verify-otp", json={"phone_number": "9876543210", "otp": "123456"})
assert res_votp.status_code == 200
assert res_votp.json()["status"] == "ok"
assert res_votp.json()["role"] == "citizen"
print("  POST /api/auth/verify-otp passed")

# Institutional logins
res_inst = client.post("/api/auth/official/login", json={"employee_id": "GOV-001", "password": "sanjha@2025"})
assert res_inst.status_code == 200
assert res_inst.json()["status"] == "ok"
print("  POST /api/auth/official/login passed")

res_ind = client.post("/api/auth/industry/login", json={"partner_id": "IND-001", "password": "sanjha@2025"})
assert res_ind.status_code == 200
assert res_ind.json()["status"] == "ok"
print("  POST /api/auth/industry/login passed")

print("\n=======================================================")
print("  ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (100%)")
print("=======================================================\n")
db.close()
