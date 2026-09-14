---
description: Universal behavioral and architectural invariants for SocioSolve civic and multi-role portals
trigger: always_on
---

# Civic Platform & Multi-Portal Invariants

## 1. Complaint Intake Form Rules
- **Empty Initialization:** Intake forms must never load with pre-filled mock text in description or title fields.
- **No Premature SLAs/Supervisors:** SLAs, turnaround times, and municipal supervisor cards must only be displayed after a ticket has been registered and assigned—never during the intake step.
- **No Citizen Urgency Radio Buttons:** Do not force citizens to classify technical urgency/priority. Let backend AI triage compute urgency scores automatically from text and photo evidence.

## 2. Problem Routing & Student Eligibility
- **Academic Capstones vs. Manual Labor:** Strictly distinguish between technical/research problems (IoT, GIS, water testing algorithms, software tools) and routine municipal manual labor (pothole filling, asphalt repair, ditch digging).
- **Student Actions:** In student innovation hubs, problem submissions must be labeled "Submit for Review" (academic/mentor review), never "Submit to Government".

## 3. Data Partitioning & Dashboard Architecture
- **State Independence:** Community grievance feeds and personal citizen tickets must always be tracked in separate state arrays (`reports` vs `myReports`). Never overwrite the community feed when personal complaints exist.
- **Realistic Metrics:** Never display static mock vitals or attribution counts (e.g. 890 reputation on a fresh user session). Derive karma and counts dynamically from actual user activity.

## 4. Navigation & Authentication Safety
- **Avatar Invariant:** Clicking a user avatar or user badge must ALWAYS navigate to Profile / Account Settings (`/profile`), never directly trigger an immediate logout.
- **Institutional Auth:** Student, university, and official portals must require credentials (ID + Password) with secure verification.
