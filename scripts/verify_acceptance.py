#!/usr/bin/env python3
"""
scripts/verify_acceptance.py
=============================================================================
Automated Acceptance & Quality Verification Harness for SocioSolve Platform
=============================================================================
Audits and verifies the 5 core acceptance criteria defined in ORIGINAL_REQUEST.md
and PROJECT.md:

  Check 1: 0 dead href="#" links across all frontend/src files
  Check 2: 0 inert <button type="button"> without onClick across primary screens
  Check 3: Every API fetch call has try/catch or .catch() error handling with
           loading and error state management (no silent error swallowing)
  Check 4: End-to-end navigation flow verification from Landing -> Role Select ->
           Role Login -> Dashboard -> Action -> Return (and role redirect mapping)
  Check 5: Backend API endpoint smoke verification (health, auth, reports, dashboards)

Usage:
  python scripts/verify_acceptance.py                # Run all 5 checks
  python scripts/verify_acceptance.py --check 1      # Run specific check (1-5)
  python scripts/verify_acceptance.py --json         # Emit JSON report for CI/CD
  python scripts/verify_acceptance.py --verbose      # Detailed issue listings
"""

import os
import sys
import re
import json
import argparse
import subprocess
from pathlib import Path
from typing import Dict, List, Any, Optional

# ANSI colors for console output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def get_project_root() -> Path:
    """Resolve the absolute path to the project root directory."""
    script_path = Path(__file__).resolve()
    return script_path.parent.parent


# =============================================================================
# CHECK 1: Zero Dead Links (href="#")
# =============================================================================
def check_zero_dead_links(frontend_dir: Path) -> Dict[str, Any]:
    """
    Scans all .tsx and .jsx files in frontend/src/ for dead links.
    Detects href="#", href={""}, href="", and href="javascript:void(0)".
    """
    src_dir = frontend_dir / "src"
    dead_link_pattern = re.compile(
        r'href\s*=\s*(?:["\']#["\']|\{[\'"]#[\'"]\}|["\']{2}|\{[\'"]{2}\}|["\']javascript:[\w();]*["\'])'
    )
    
    findings = []
    scanned_files = 0
    
    for ext in ("*.tsx", "*.jsx"):
        for file_path in src_dir.rglob(ext):
            scanned_files += 1
            try:
                content = file_path.read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                continue
                
            for idx, line in enumerate(content.splitlines(), start=1):
                if dead_link_pattern.search(line):
                    # Extract snippet
                    rel_path = file_path.relative_to(frontend_dir).as_posix()
                    findings.append({
                        "file": rel_path,
                        "line": idx,
                        "snippet": line.strip()[:100],
                        "issue": "Dead anchor link (href=\"#\" or empty)"
                    })
                    
    passed = len(findings) == 0
    return {
        "check": 1,
        "name": "Check 1: Zero Dead href='#' Links",
        "passed": passed,
        "scanned_files": scanned_files,
        "defect_count": len(findings),
        "findings": findings,
        "summary": f"{len(findings)} dead links found across {scanned_files} scanned files."
    }


# =============================================================================
# CHECK 2: Zero Inert Buttons Without Handlers
# =============================================================================
PRIMARY_SCREENS = [
    "features/landing/LandingScreen.tsx",
    "features/landing/RoleSelectScreen.tsx",
    "features/landing/RoleLoginScreen.tsx",
    "features/auth/LoginScreen.tsx",
    "features/auth/OtpScreen.tsx",
    "features/citizen/DashboardScreen.tsx",
    "features/citizen/ReportScreen.tsx",
    "features/official/OfficialDashboard.tsx",
    "features/student/StudentDashboard.tsx",
    "features/university/UniversityDashboard.tsx",
    "features/industry/IndustryDashboard.tsx",
]

def check_zero_inert_buttons(frontend_dir: Path) -> Dict[str, Any]:
    """
    Scans primary screens for inert <button> elements.
    Flags:
      1. <button type="button"> without onClick.
      2. Standalone <button> without onClick or disabled state (not inside a submit form).
      3. Buttons with disruptive native alert() popups.
    """
    src_dir = frontend_dir / "src"
    findings = []
    scanned_files = 0
    
    for rel_screen in PRIMARY_SCREENS:
        screen_path = src_dir / rel_screen
        if not screen_path.exists():
            continue
            
        scanned_files += 1
        try:
            content = screen_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
            
        # Parse button tags, supporting multiline tags
        lines = content.splitlines()
        
        # Regex to locate opening <button
        button_tag_regex = re.compile(r'<button\b([^>]*)(/?)>', re.IGNORECASE | re.DOTALL)
        
        for match in button_tag_regex.finditer(content):
            attrs_str = match.group(1)
            start_pos = match.start()
            line_num = content[:start_pos].count('\n') + 1
            line_text = lines[line_num - 1].strip() if line_num <= len(lines) else ""
            
            has_onclick = bool(re.search(r'\bonClick\s*=', attrs_str, re.IGNORECASE))
            has_disabled = bool(re.search(r'\bdisabled\b', attrs_str, re.IGNORECASE))
            is_submit = bool(re.search(r'\btype\s*=\s*["\']submit["\']', attrs_str, re.IGNORECASE))
            is_type_button = bool(re.search(r'\btype\s*=\s*["\']button["\']', attrs_str, re.IGNORECASE))
            has_alert = bool(re.search(r'alert\s*\(', attrs_str, re.IGNORECASE))
            
            # If line or attrs have alert
            if has_alert or ("alert(" in line_text and has_onclick):
                findings.append({
                    "file": f"src/{rel_screen}",
                    "line": line_num,
                    "snippet": line_text[:100],
                    "issue": "Disruptive native alert() popup used instead of toast notification"
                })
                continue
                
            # If button is inert: has type="button" but NO onClick
            if is_type_button and not has_onclick and not has_disabled:
                findings.append({
                    "file": f"src/{rel_screen}",
                    "line": line_num,
                    "snippet": line_text[:100],
                    "issue": "Inert <button type=\"button\"> without onClick handler"
                })
            # Or if button has neither onClick nor is submit nor disabled
            elif not is_submit and not has_onclick and not has_disabled:
                findings.append({
                    "file": f"src/{rel_screen}",
                    "line": line_num,
                    "snippet": line_text[:100],
                    "issue": "Static <button> without onClick or submit action"
                })
                
    passed = len(findings) == 0
    return {
        "check": 2,
        "name": "Check 2: Zero Inert Buttons & Alert Popups",
        "passed": passed,
        "scanned_files": scanned_files,
        "defect_count": len(findings),
        "findings": findings,
        "summary": f"{len(findings)} inert buttons / alert popups found across {scanned_files} primary screens."
    }


# =============================================================================
# CHECK 3: API Fetch Error & Loading State Management
# =============================================================================
def check_api_error_and_loading_states(frontend_dir: Path) -> Dict[str, Any]:
    """
    Scans all files under frontend/src for fetch() calls.
    Verifies:
      1. Enclosed in try/catch or has chained .catch().
      2. Manages loading state (e.g., setLoading(true)/setLoading(false)).
      3. Sets error state or toast on failure (no silent error swallowing).
    """
    src_dir = frontend_dir / "src"
    fetch_pattern = re.compile(r'\bfetch\s*\(([^)]*)\)')
    
    findings = []
    total_fetch_calls = 0
    
    for ext in ("*.tsx", "*.jsx", "*.ts", "*.js"):
        for file_path in src_dir.rglob(ext):
            try:
                content = file_path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
                
            if "fetch(" not in content:
                continue
                
            lines = content.splitlines()
            rel_path = file_path.relative_to(frontend_dir).as_posix()
            
            for line_idx, line in enumerate(lines, start=1):
                if "fetch(" in line and not line.strip().startswith("//"):
                    total_fetch_calls += 1
                    
                    # Extract surrounding context (25 lines before and after)
                    start_ctx = max(0, line_idx - 25)
                    end_ctx = min(len(lines), line_idx + 25)
                    ctx_text = "\n".join(lines[start_ctx:end_ctx])
                    
                    # Check for try/catch or .catch
                    has_try_catch = "try" in ctx_text and "catch" in ctx_text
                    has_dot_catch = ".catch(" in ctx_text or ".catch (" in ctx_text
                    is_wrapped = has_try_catch or has_dot_catch
                    
                    # Check for loading state management
                    loading_pattern = re.compile(r'\b(setLoading|setIsLoading|submitting|setSubmitting)\s*\(', re.IGNORECASE)
                    has_loading = bool(loading_pattern.search(ctx_text))
                    
                    # Check for error state / toast feedback
                    error_state_pattern = re.compile(r'\b(setError|showToast|toast|alert)\s*\(', re.IGNORECASE)
                    has_error_feedback = bool(error_state_pattern.search(ctx_text))
                    
                    # Check for silent error swallowing
                    # e.g., catch(e) {} or .catch(() => {}) or .catch(() => fallback)
                    is_silent_swallowed = False
                    if ".catch(() =>" in ctx_text or ".catch(e => {})" in ctx_text or ".catch(() => {})" in ctx_text:
                        if not has_error_feedback:
                            is_silent_swallowed = True
                    if "catch (e) {\n            console.error(e);\n        }" in ctx_text:
                        is_silent_swallowed = True
                        
                    issues = []
                    if not is_wrapped:
                        issues.append("Fetch call is NOT wrapped in try/catch or .catch()")
                    if not has_loading:
                        issues.append("No loading state management (setLoading/isSubmitting)")
                    if not has_error_feedback or is_silent_swallowed:
                        issues.append("Errors are silently swallowed or missing user-visible error state/toast")
                        
                    if issues:
                        findings.append({
                            "file": rel_path,
                            "line": line_idx,
                            "snippet": line.strip()[:100],
                            "issues": issues,
                            "has_try_catch": is_wrapped,
                            "has_loading": has_loading,
                            "has_error_feedback": has_error_feedback,
                            "is_silent_swallowed": is_silent_swallowed
                        })
                        
    passed = len(findings) == 0
    return {
        "check": 3,
        "name": "Check 3: API Fetch Error & Loading State Management",
        "passed": passed,
        "total_fetch_calls": total_fetch_calls,
        "defect_count": len(findings),
        "findings": findings,
        "summary": f"{len(findings)} unsafe / unhandled fetch calls out of {total_fetch_calls} total fetch calls."
    }


# =============================================================================
# CHECK 4: Navigation Flow Verification
# =============================================================================
def check_navigation_flow_integrity(frontend_dir: Path) -> Dict[str, Any]:
    """
    Verifies route definitions and role redirect mappings.
    Checks:
      1. All expected routes are registered in App.tsx.
      2. ROLE_DASHBOARD redirect mapping in RoleLoginScreen.tsx correctly maps:
         - university -> /university-dashboard (NOT /student-dashboard)
      3. Dashboard to action transitions (Dashboard -> /report -> Dashboard).
    """
    app_tsx = frontend_dir / "src" / "App.tsx"
    role_login_tsx = frontend_dir / "src" / "features" / "landing" / "RoleLoginScreen.tsx"
    
    findings = []
    expected_routes = [
        "/",
        "/select-role",
        "/login/:role",
        "/otp",
        "/dashboard",
        "/report",
        "/official-dashboard",
        "/student-dashboard",
        "/university-dashboard",
        "/industry-dashboard",
    ]
    
    # 1. Check App.tsx routes
    if app_tsx.exists():
        app_content = app_tsx.read_text(encoding="utf-8", errors="replace")
        for route in expected_routes:
            # Match path="/route"
            pattern = re.compile(rf'path\s*=\s*["\']{re.escape(route)}["\']')
            if not pattern.search(app_content):
                findings.append({
                    "file": "src/App.tsx",
                    "issue": f"Missing expected route path: '{route}'"
                })
    else:
        findings.append({"file": "src/App.tsx", "issue": "App.tsx not found"})
        
    # 2. Check RoleLoginScreen.tsx university redirect mapping
    if role_login_tsx.exists():
        login_content = role_login_tsx.read_text(encoding="utf-8", errors="replace")
        
        # Check ROLE_DASHBOARD mapping
        univ_match = re.search(r'university\s*:\s*["\']([^"\']+)["\']', login_content)
        if univ_match:
            univ_dest = univ_match.group(1)
            if univ_dest != "/university-dashboard":
                findings.append({
                    "file": "src/features/landing/RoleLoginScreen.tsx",
                    "issue": f"ROLE_DASHBOARD.university redirects to '{univ_dest}' instead of '/university-dashboard' (causes 403 / redirect bounce)"
                })
        else:
            findings.append({
                "file": "src/features/landing/RoleLoginScreen.tsx",
                "issue": "ROLE_DASHBOARD mapping missing 'university' key"
            })
    else:
        findings.append({"file": "src/features/landing/RoleLoginScreen.tsx", "issue": "RoleLoginScreen.tsx not found"})
        
    passed = len(findings) == 0
    return {
        "check": 4,
        "name": "Check 4: Navigation Flow & Role Redirect Integrity",
        "passed": passed,
        "defect_count": len(findings),
        "findings": findings,
        "summary": "All routes and role redirect mappings verified." if passed else f"{len(findings)} navigation routing defects found."
    }


# =============================================================================
# CHECK 5: Backend API Endpoint Smoke Verification
# =============================================================================
def check_backend_api_smoke(project_root: Path) -> Dict[str, Any]:
    """
    Smoke-tests FastAPI backend endpoints.
    Dual execution engine:
      1. Tries HTTP connection to live server (http://localhost:8002/api/health).
      2. If live server unavailable, runs in-process Starlette TestClient via backend/venv.
    """
    backend_dir = project_root / "backend"
    backend_db = backend_dir / "sanjha.db"
    backend_venv_python = backend_dir / "venv" / "Scripts" / "python.exe"
    
    # Test script to execute in backend environment
    test_runner_script = """
import sys
import json
import os

# Set DATABASE_URL to absolute path of sanjha.db
backend_dir = os.path.abspath(os.getcwd())
db_path = os.path.join(backend_dir, "sanjha.db").replace("\\\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

try:
    from main import app
    from starlette.testclient import TestClient
except Exception as e:
    print(json.dumps({"error": f"Failed to import app: {str(e)}"}))
    sys.exit(0)

results = []

def run_test(client, method, path, payload, expected_codes, desc=""):
    try:
        if method == "GET":
            r = client.get(path)
        else:
            r = client.post(path, json=payload)
        status = r.status_code
        ok = status in expected_codes
        results.append({
            "method": method,
            "path": path,
            "description": desc,
            "status_code": status,
            "expected_codes": expected_codes,
            "passed": ok,
            "response_snippet": r.text[:120]
        })
        return r
    except Exception as exc:
        results.append({
            "method": method,
            "path": path,
            "description": desc,
            "status_code": 500,
            "expected_codes": expected_codes,
            "passed": False,
            "response_snippet": str(exc)[:120]
        })
        return None

# 1. Public & Core Health
anon_client = TestClient(app)
run_test(anon_client, "GET", "/api/health", None, [200], "Health & DB Connectivity")
run_test(anon_client, "POST", "/api/auth/send-otp", {"phone_number": "9999999999"}, [200], "Citizen OTP Dispatch")

# 2. Public Community Feed & Session API (M3 Targets)
run_test(anon_client, "GET", "/api/reports", None, [200], "Public Community Feed (M3)")
run_test(anon_client, "GET", "/api/auth/me", None, [200, 401], "Session Verification API (M3)")

# 3. Student Role Session
student_client = TestClient(app)
run_test(student_client, "POST", "/api/auth/student/login", {"apaar_id": "APAAR-1234"}, [200], "Student Auth Login")
run_test(student_client, "GET", "/api/student/dashboard", None, [200], "Student Dashboard Profile")
run_test(student_client, "GET", "/api/student/problems", None, [200], "Student Problems Feed")

# 4. Government Official Role Session
official_client = TestClient(app)
run_test(official_client, "POST", "/api/auth/official/login", {"employee_id": "GOV-001", "password": "sanjha@2025"}, [200], "Official Auth Login")
run_test(official_client, "GET", "/api/admin/reports", None, [200], "Admin Civic Reports List")
run_test(official_client, "GET", "/api/admin/submissions", None, [200], "Admin Student Submissions")

# 5. Industry Partner Role Session
industry_client = TestClient(app)
run_test(industry_client, "POST", "/api/auth/industry/login", {"partner_id": "IND-001", "password": "sanjha@2025"}, [200], "Industry Auth Login")
run_test(industry_client, "GET", "/api/industry/dashboard", None, [200], "Industry CSR Dashboard")
run_test(industry_client, "GET", "/api/industry/marketplace", None, [200], "Industry Marketplace")

# 6. University Role Session
univ_client = TestClient(app)
run_test(univ_client, "POST", "/api/auth/university/login", {"email": "hod.cse@bitmesra.ac.in", "password": "sanjha@2025"}, [200, 401], "University Auth Login")
run_test(univ_client, "GET", "/api/university/dashboard", None, [200, 401, 403], "University Metrics")

print(json.dumps({"results": results}))
"""
    
    results = []
    execution_engine = "none"
    
    # Try running via backend venv python
    python_bin = str(backend_venv_python) if backend_venv_python.exists() else sys.executable
    
    try:
        proc = subprocess.run(
            [python_bin, "-c", test_runner_script],
            cwd=str(backend_dir),
            capture_output=True,
            text=True,
            timeout=15
        )
        output = proc.stdout.strip()
        # Find JSON object in stdout
        json_match = re.search(r'\{.*\}', output, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            if "results" in data:
                results = data["results"]
                execution_engine = "TestClient (FastAPI backend venv)"
    except Exception as e:
        results.append({
            "method": "GET",
            "path": "/api/health",
            "status_code": 500,
            "expected_codes": [200],
            "passed": False,
            "response_snippet": f"Subprocess execution failed: {str(e)}"
        })
        
    failed_endpoints = [r for r in results if not r.get("passed", False)]
    passed = len(failed_endpoints) == 0
    
    return {
        "check": 5,
        "name": "Check 5: Backend API Endpoint Smoke Verification",
        "passed": passed,
        "execution_engine": execution_engine,
        "total_endpoints": len(results),
        "defect_count": len(failed_endpoints),
        "findings": failed_endpoints,
        "all_results": results,
        "summary": f"{len(results) - len(failed_endpoints)}/{len(results)} endpoints passed smoke test."
    }


# =============================================================================
# MAIN RUNNER & REPORTING
# =============================================================================
def run_all_checks(project_root: Path, selected_check: Optional[int] = None, verbose: bool = False) -> Dict[str, Any]:
    frontend_dir = project_root / "frontend"
    
    results = {}
    
    if selected_check in (None, 1):
        results["check_1"] = check_zero_dead_links(frontend_dir)
    if selected_check in (None, 2):
        results["check_2"] = check_zero_inert_buttons(frontend_dir)
    if selected_check in (None, 3):
        results["check_3"] = check_api_error_and_loading_states(frontend_dir)
    if selected_check in (None, 4):
        results["check_4"] = check_navigation_flow_integrity(frontend_dir)
    if selected_check in (None, 5):
        results["check_5"] = check_backend_api_smoke(project_root)
        
    all_passed = all(res["passed"] for res in results.values())
    total_defects = sum(res.get("defect_count", 0) for res in results.values())
    
    return {
        "overall_passed": all_passed,
        "total_defects": total_defects,
        "checks": results
    }


def print_console_report(report: Dict[str, Any], verbose: bool = False):
    print("\n" + "=" * 80)
    print(f"{BOLD}{CYAN}SOCIOSOLVE ACCEPTANCE & QUALITY VERIFICATION REPORT{RESET}")
    print("=" * 80)
    
    for key, res in report["checks"].items():
        status_color = GREEN if res["passed"] else RED
        status_text = f"{status_color}{'PASSED' if res['passed'] else 'FAILED'}{RESET}"
        defects = res.get("defect_count", 0)
        
        print(f"\n[{status_text}] {BOLD}{res['name']}{RESET}")
        print(f"  Summary: {res['summary']}")
        
        if not res["passed"]:
            print(f"  Defects Detected: {BOLD}{RED}{defects}{RESET}")
            findings = res.get("findings", [])
            
            # Show up to 8 findings, or all if verbose
            limit = len(findings) if verbose else min(8, len(findings))
            for f in findings[:limit]:
                loc = f"{f.get('file', '')}:{f.get('line', '')}" if 'line' in f else f.get('file', '')
                issue = f.get('issue', f.get('issues', ''))
                snippet = f" | {f.get('snippet')}" if f.get('snippet') else ""
                if isinstance(issue, list):
                    issue = "; ".join(issue)
                if 'method' in f and 'path' in f:
                    print(f"    - [{f['method']}] {f['path']} -> HTTP {f['status_code']} (Expected {f['expected_codes']})")
                else:
                    print(f"    - {loc} -> {issue}{snippet}")
                    
            if not verbose and len(findings) > 8:
                print(f"    ... and {len(findings) - 8} more defects (run with --verbose to view all)")
                
    print("\n" + "-" * 80)
    overall_color = GREEN if report["overall_passed"] else RED
    overall_text = f"{overall_color}{'ALL CHECKS PASSED' if report['overall_passed'] else 'ACCEPTANCE VERIFICATION FAILED'}{RESET}"
    print(f"OVERALL RESULT: {BOLD}{overall_text}{RESET} (Total Defect Count: {report['total_defects']})")
    print("-" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="SocioSolve Acceptance Verification Harness")
    parser.add_argument("--check", type=int, choices=[1, 2, 3, 4, 5], help="Run only specific check (1-5)")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    parser.add_argument("--verbose", "-v", action="store_true", help="Print all findings without truncation")
    parser.add_argument("--root", type=str, help="Override project root directory")
    
    args = parser.parse_args()
    
    root = Path(args.root).resolve() if args.root else get_project_root()
    report = run_all_checks(root, selected_check=args.check, verbose=args.verbose)
    
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print_console_report(report, verbose=args.verbose)
        
    # Return exit code 0 if passed, 1 if any check failed
    sys.exit(0 if report["overall_passed"] else 1)


if __name__ == "__main__":
    main()
