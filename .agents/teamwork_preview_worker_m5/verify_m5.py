import sys
import os
from pathlib import Path

# Add project root to sys.path
root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root))

from scripts.verify_acceptance import check_zero_inert_buttons, check_api_error_and_loading_states

frontend_dir = root / "frontend"

print("--- Running Worker M5 Targeted Verification ---")

# Check 2
res2 = check_zero_inert_buttons(frontend_dir)
m5_screens = [
    "features/official/OfficialDashboard.tsx",
    "features/student/StudentDashboard.tsx",
    "features/university/UniversityDashboard.tsx",
    "features/industry/IndustryDashboard.tsx"
]

m5_findings_check2 = [f for f in res2["findings"] if any(s in f["file"] for s in m5_screens)]
print(f"\nCheck 2 on M5 Screens: {len(m5_findings_check2)} defects found.")
for f in m5_findings_check2:
    print(f"  - {f['file']}:{f['line']} -> {f['issue']} | {f.get('snippet', '')}")

# Check 3
res3 = check_api_error_and_loading_states(frontend_dir)
m5_findings_check3 = [f for f in res3["findings"] if any(s in f["file"] for s in m5_screens)]
print(f"\nCheck 3 on M5 Screens: {len(m5_findings_check3)} defects found.")
for f in m5_findings_check3:
    print(f"  - {f['file']}:{f['line']} -> {f['issues']} | {f.get('snippet', '')}")

total_m5_defects = len(m5_findings_check2) + len(m5_findings_check3)
print(f"\nTOTAL M5 DEFECTS: {total_m5_defects}")
if total_m5_defects == 0:
    print("ALL M5 ACCEPTANCE CHECKS PASSED (0 defects)!")
    sys.exit(0)
else:
    print("M5 CHECKS FAILED.")
    sys.exit(1)
