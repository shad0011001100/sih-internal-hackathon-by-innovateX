#!/usr/bin/env python3
"""
scripts/stress_test_audit.py
=============================================================================
Adversarial Stress Test & Verification Oracle for SocioSolve
=============================================================================
Independently searches for:
1. Hidden/dynamic dead links (href="#", to="#", empty links, javascript:void(0))
2. Inert buttons, no-op handlers (onClick={() => {}}), forms missing onSubmit
3. Fetch call safety: try/catch, loading states, error toast/state, response.ok checks
4. Invalid navigate() route targets across all frontend components
5. Live/TestClient backend edge case & malformed input handling
"""

import os
import re
import sys
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_SRC = ROOT / "frontend" / "src"
BACKEND_DIR = ROOT / "backend"

def audit_dead_links():
    print("\n--- [AUDIT 1] Comprehensive Dead Links & Anchors ---")
    dead_patterns = [
        re.compile(r'href\s*=\s*(?:["\']#["\']|\{[\'"]#[\'"]\}|["\']{2}|\{[\'"]{2}\}|["\']javascript:[\w();]*["\'])'),
        re.compile(r'to\s*=\s*(?:["\']#["\']|\{[\'"]#[\'"]\}|["\']{2}|\{[\'"]{2}\})'),
    ]
    anchor_regex = re.compile(r'<a\b([^>]*)(/?)>', re.IGNORECASE | re.DOTALL)
    link_regex = re.compile(r'<(?:Link|NavLink)\b([^>]*)(/?)>', re.IGNORECASE | re.DOTALL)
    
    findings = []
    total_anchors = 0
    total_links = 0
    
    for fpath in FRONTEND_SRC.rglob("*.[tj]s*"):
        text = fpath.read_text(encoding="utf-8", errors="replace")
        rel = fpath.relative_to(FRONTEND_SRC).as_posix()
        lines = text.splitlines()
        
        # Check raw lines against dead patterns
        for idx, line in enumerate(lines, 1):
            for pat in dead_patterns:
                if pat.search(line):
                    findings.append({
                        "file": rel,
                        "line": idx,
                        "snippet": line.strip()[:100],
                        "type": "Dead href/to pattern match"
                    })
                    
        # Check all <a tags
        for m in anchor_regex.finditer(text):
            total_anchors += 1
            attrs = m.group(1)
            line = text[:m.start()].count("\n") + 1
            if not re.search(r'\bhref\s*=', attrs, re.IGNORECASE):
                findings.append({
                    "file": rel,
                    "line": line,
                    "snippet": attrs.replace("\n", " ")[:100],
                    "type": "<a> tag without href"
                })
                
        # Check all <Link / NavLink tags
        for m in link_regex.finditer(text):
            total_links += 1
            attrs = m.group(1)
            line = text[:m.start()].count("\n") + 1
            if not re.search(r'\bto\s*=', attrs, re.IGNORECASE):
                findings.append({
                    "file": rel,
                    "line": line,
                    "snippet": attrs.replace("\n", " ")[:100],
                    "type": "<Link> without 'to' prop"
                })
                
    print(f"Total <a> tags scanned: {total_anchors}")
    print(f"Total <Link>/<NavLink> tags scanned: {total_links}")
    print(f"Dead link findings: {len(findings)}")
    for f in findings:
        print(f"  [DEFECT] {f['file']}:{f['line']} -> {f['type']}: {f['snippet']}")
    return len(findings) == 0, findings


def audit_buttons():
    print("\n--- [AUDIT 2] Comprehensive Button & Handler Audit ---")
    btn_regex = re.compile(r'<button\b([^>]*)(/?)>', re.IGNORECASE | re.DOTALL)
    noop_regex = re.compile(r'onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}')
    
    findings = []
    total_buttons = 0
    noop_buttons = 0
    inert_buttons = 0
    alert_buttons = 0
    
    for fpath in FRONTEND_SRC.rglob("*.[tj]s*"):
        text = fpath.read_text(encoding="utf-8", errors="replace")
        rel = fpath.relative_to(FRONTEND_SRC).as_posix()
        lines = text.splitlines()
        
        for m in btn_regex.finditer(text):
            total_buttons += 1
            attrs = m.group(1)
            line = text[:m.start()].count("\n") + 1
            
            has_click = bool(re.search(r'\bonClick\s*=', attrs, re.IGNORECASE))
            has_disabled = bool(re.search(r'\bdisabled\b', attrs, re.IGNORECASE))
            is_submit = bool(re.search(r'type\s*=\s*["\']submit["\']', attrs, re.IGNORECASE))
            is_noop = bool(noop_regex.search(attrs))
            has_alert = "alert(" in attrs
            
            if is_noop:
                noop_buttons += 1
                findings.append({
                    "file": rel,
                    "line": line,
                    "snippet": attrs.replace("\n", " ")[:100],
                    "type": "No-op onClick handler: onClick={() => {}}"
                })
            elif has_alert:
                alert_buttons += 1
                findings.append({
                    "file": rel,
                    "line": line,
                    "snippet": attrs.replace("\n", " ")[:100],
                    "type": "Native alert() popup"
                })
            elif not has_click and not is_submit and not has_disabled:
                inert_buttons += 1
                findings.append({
                    "file": rel,
                    "line": line,
                    "snippet": attrs.replace("\n", " ")[:100],
                    "type": "Inert button (no onClick, not submit, not disabled)"
                })
                
    print(f"Total <button> tags scanned across all files: {total_buttons}")
    print(f"Inert buttons: {inert_buttons}")
    print(f"No-op buttons: {noop_buttons}")
    print(f"Buttons with alert: {alert_buttons}")
    for f in findings:
        print(f"  [DEFECT] {f['file']}:{f['line']} -> {f['type']}: {f['snippet']}")
    return len(findings) == 0, findings


def audit_form_submits():
    print("\n--- [AUDIT 2b] Forms and Submit Handlers ---")
    form_regex = re.compile(r'<form\b([^>]*)(/?)>', re.IGNORECASE | re.DOTALL)
    findings = []
    total_forms = 0
    
    for fpath in FRONTEND_SRC.rglob("*.[tj]s*"):
        text = fpath.read_text(encoding="utf-8", errors="replace")
        rel = fpath.relative_to(FRONTEND_SRC).as_posix()
        
        for m in form_regex.finditer(text):
            total_forms += 1
            attrs = m.group(1)
            line = text[:m.start()].count("\n") + 1
            has_submit = bool(re.search(r'\bonSubmit\s*=', attrs, re.IGNORECASE))
            if not has_submit:
                findings.append({
                    "file": rel,
                    "line": line,
                    "snippet": attrs.replace("\n", " ")[:100],
                    "type": "<form> without onSubmit handler"
                })
                
    print(f"Total <form> tags scanned: {total_forms}")
    print(f"Forms without onSubmit: {len(findings)}")
    for f in findings:
        print(f"  [DEFECT] {f['file']}:{f['line']} -> {f['type']}: {f['snippet']}")
    return len(findings) == 0, findings


def audit_fetch_resilience():
    print("\n--- [AUDIT 3] Fetch Calls Safety & Resilience ---")
    fetch_regex = re.compile(r'\bfetch\s*\(([^)]*)\)')
    findings = []
    total_fetches = 0
    
    for fpath in FRONTEND_SRC.rglob("*.[tj]s*"):
        text = fpath.read_text(encoding="utf-8", errors="replace")
        rel = fpath.relative_to(FRONTEND_SRC).as_posix()
        lines = text.splitlines()
        
        for idx, line in enumerate(lines, 1):
            if "fetch(" in line and not line.strip().startswith("//"):
                total_fetches += 1
                start_ctx = max(0, idx - 30)
                end_ctx = min(len(lines), idx + 30)
                ctx = "\n".join(lines[start_ctx:end_ctx])
                
                wrapped = ("try" in ctx and "catch" in ctx) or (".catch(" in ctx)
                loading = bool(re.search(r'\b(setLoading|setIsLoading|submitting|setSubmitting)\s*\(', ctx, re.IGNORECASE))
                feedback = bool(re.search(r'\b(setError|showToast|toast|alert)\s*\(', ctx, re.IGNORECASE))
                
                # Check for silent empty catch
                silent = False
                if re.search(r'catch\s*\([^\)]*\)\s*\{\s*\}', ctx):
                    silent = True
                if re.search(r'\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)', ctx):
                    silent = True
                if re.search(r'catch\s*\([^\)]*\)\s*\{\s*console\.\w+\([^)]*\);\s*\}', ctx) and not feedback:
                    silent = True
                    
                issues = []
                if not wrapped:
                    issues.append("Unwrapped fetch (no try/catch or .catch)")
                if not loading:
                    issues.append("No loading indicator managed")
                if silent or not feedback:
                    issues.append("Silent swallow or missing error feedback")
                    
                if issues:
                    findings.append({
                        "file": rel,
                        "line": idx,
                        "snippet": line.strip()[:100],
                        "issues": issues
                    })
                    
    print(f"Total fetch calls scanned: {total_fetches}")
    print(f"Unsafe fetch calls: {len(findings)}")
    for f in findings:
        print(f"  [DEFECT] {f['file']}:{f['line']} -> {'; '.join(f['issues'])}: {f['snippet']}")
    return len(findings) == 0, findings


def audit_navigation_targets():
    print("\n--- [AUDIT 4] Navigation Targets & Route Graph ---")
    app_tsx = FRONTEND_SRC / "App.tsx"
    app_text = app_tsx.read_text(encoding="utf-8", errors="replace")
    
    # Extract all registered paths in App.tsx
    registered_routes = set(re.findall(r'path\s*=\s*["\']([^"\']+)["\']', app_text))
    print(f"Registered routes in App.tsx ({len(registered_routes)}): {sorted(list(registered_routes))}")
    
    # Extract all navigate('/...') calls in frontend/src
    navigate_regex = re.compile(r'navigate\s*\(\s*["\']([^"\']+)["\']')
    findings = []
    total_navigates = 0
    
    for fpath in FRONTEND_SRC.rglob("*.[tj]s*"):
        text = fpath.read_text(encoding="utf-8", errors="replace")
        rel = fpath.relative_to(FRONTEND_SRC).as_posix()
        lines = text.splitlines()
        
        for idx, line in enumerate(lines, 1):
            for m in navigate_regex.finditer(line):
                total_navigates += 1
                target = m.group(1)
                
                # Check target against registered routes (handle path params like :role and wildcard *)
                matched = False
                for r in registered_routes:
                    if r == "*":
                        continue
                    regex_str = "^" + re.escape(r).replace(r"\:", ":") + "$"
                    regex_str = re.sub(r':\w+', r'[^/]+', regex_str)
                    if re.match(regex_str, target.split("?")[0]):
                        matched = True
                        break
                        
                if not matched:
                    findings.append({
                        "file": rel,
                        "line": idx,
                        "target": target,
                        "issue": f"navigate('{target}') targets unregistered route!"
                    })
                    
    print(f"Total static navigate() calls scanned: {total_navigates}")
    print(f"Unmatched route navigation targets: {len(findings)}")
    for f in findings:
        print(f"  [DEFECT] {f['file']}:{f['line']} -> {f['issue']}")
    return len(findings) == 0, findings


def audit_backend_stress():
    print("\n--- [AUDIT 5] Backend Adversarial Smoke & Edge-Case Suite ---")
    backend_venv_python = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
    python_bin = str(backend_venv_python) if backend_venv_python.exists() else sys.executable
    
    stress_script = """
import sys, json, os

backend_dir = os.path.abspath(os.getcwd())
db_path = os.path.join(backend_dir, "sanjha.db").replace("\\\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

try:
    from main import app
    from starlette.testclient import TestClient
except Exception as e:
    print(json.dumps({"error": f"Import failed: {str(e)}"}))
    sys.exit(0)

client = TestClient(app)
tests = []

def t(name, method, url, body=None, headers=None, expect=[200]):
    try:
        if method == "GET":
            r = client.get(url, headers=headers)
        elif method == "POST":
            r = client.post(url, json=body, headers=headers)
        ok = r.status_code in expect
        tests.append({
            "name": name,
            "url": url,
            "status": r.status_code,
            "expect": expect,
            "ok": ok,
            "body": r.text[:100]
        })
    except Exception as ex:
        tests.append({
            "name": name,
            "url": url,
            "status": 500,
            "expect": expect,
            "ok": False,
            "body": str(ex)[:100]
        })

# 1. Health & Core
t("Health check", "GET", "/api/health", expect=[200])

# 2. Public Feed & Filters
t("Public feed", "GET", "/api/reports", expect=[200])
t("Public feed category filter", "GET", "/api/reports?category=Roads", expect=[200])
t("Public feed empty category", "GET", "/api/reports?category=NonExistentCategory", expect=[200])

# 3. Auth Sessions & Verification
t("Session verify without token", "GET", "/api/auth/me", expect=[401])

# Login as Student
s_res = client.post("/api/auth/student/login", json={"apaar_id": "APAAR-1234"})
s_ok = s_res.status_code == 200
t("Student login", "POST", "/api/auth/student/login", body={"apaar_id": "APAAR-1234"}, expect=[200])

# Login as Official
o_res = client.post("/api/auth/official/login", json={"employee_id": "GOV-001", "password": "sanjha@2025"})
t("Official login", "POST", "/api/auth/official/login", body={"employee_id": "GOV-001", "password": "sanjha@2025"}, expect=[200])

# Login as Industry
i_res = client.post("/api/auth/industry/login", json={"partner_id": "IND-001", "password": "sanjha@2025"})
t("Industry login", "POST", "/api/auth/industry/login", body={"partner_id": "IND-001", "password": "sanjha@2025"}, expect=[200])

# Industry Funding Payload Compatibility Test
t("Industry fund project (schema alignment)", "POST", "/api/industry/fund", body={"project_id": 1, "amount": 50000, "offer_type": "funding", "message": "Empirical stress test"}, expect=[200, 400, 404])

# Invalid login attempts (ensure proper 400/401, not 500)
t("Invalid official login", "POST", "/api/auth/official/login", body={"employee_id": "BAD-ID", "password": "wrong"}, expect=[400, 401])
t("Invalid student login", "POST", "/api/auth/student/login", body={"apaar_id": ""}, expect=[400, 401, 422])

print(json.dumps({"results": tests}))
"""
    
    proc = subprocess.run(
        [python_bin, "-c", stress_script],
        cwd=str(BACKEND_DIR),
        capture_output=True,
        text=True,
        timeout=20
    )
    
    try:
        match = re.search(r'\{.*\}', proc.stdout, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            results = data.get("results", [])
        else:
            print("Failed to parse backend test results! Raw output:")
            print(proc.stdout)
            print(proc.stderr)
            return False, [{"error": "Execution failed"}]
    except Exception as e:
        print(f"Exception parsing results: {e}")
        return False, [{"error": str(e)}]
        
    failed = [r for r in results if not r["ok"]]
    print(f"Backend stress endpoints tested: {len(results)}")
    print(f"Failed endpoints: {len(failed)}")
    for r in results:
        status_sym = "[PASS]" if r["ok"] else "[FAIL]"
        print(f"  {status_sym} {r['name']}: {r['url']} -> HTTP {r['status']} (expected {r['expect']})")
        
    return len(failed) == 0, failed


def main():
    print("=" * 80)
    print("SOCIOSOLVE ADVERSARIAL STRESS TEST & VERIFICATION HARNESS")
    print("=" * 80)
    
    results = {}
    results["dead_links"], _ = audit_dead_links()
    results["buttons"], _ = audit_buttons()
    results["forms"], _ = audit_form_submits()
    results["fetch_resilience"], _ = audit_fetch_resilience()
    results["navigation_targets"], _ = audit_navigation_targets()
    results["backend_stress"], _ = audit_backend_stress()
    
    print("\n" + "=" * 80)
    print("STRESS TEST MATRIX SUMMARY")
    print("=" * 80)
    all_pass = True
    for key, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        if not passed:
            all_pass = False
        print(f"  - {key:<25}: {status}")
        
    print("-" * 80)
    if all_pass:
        print("FINAL VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED")
    else:
        print("FINAL VERDICT: DEFECTS DETECTED DURING STRESS TESTING")
    print("=" * 80)
    
    sys.exit(0 if all_pass else 1)

if __name__ == "__main__":
    main()
