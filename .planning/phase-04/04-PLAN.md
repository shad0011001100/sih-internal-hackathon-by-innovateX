---
wave: 4
depends_on: ["Phase 3"]
files_modified:
  - backend/requirements.txt
  - backend/services/ai_engine.py
  - backend/routers/reports.py
autonomous: true
---

# Phase 4: Problem Intelligence Engine (Backend AI)

## Objective
Implement the AI Intelligence Engine using the Google Gemini 1.5 Flash API (Free Tier). This engine will intercept incoming citizen reports, visually analyze the uploaded photos, and mathematically evaluate if the photo depicts a genuine civic issue (e.g., broken pipe, pothole) or if it is spam (e.g., selfie, screenshot, irrelevant object). 

## Verification Criteria
- `google-generativeai` is installed and configured in the backend.
- `POST /api/reports` intercepts base64 images and routes them to `ai_engine.py`.
- If a user uploads a picture of a cat or a computer monitor, the backend instantly rejects it with a 400 Bad Request ("AI Triage: Image does not appear to be a civic issue").
- If a user uploads a picture of a broken road, it passes triage and saves to the database with a high `ai_spam_score` (representing confidence of authenticity).

## Tasks

<task>
<id>1</id>
<title>Initialize Gemini AI Service</title>
<type>execute</type>
<read_first>
- .planning/PROJECT.md
- .planning/DECISIONS.md
</read_first>
<action>
1. Add `google-generativeai` to `backend/requirements.txt` and install it.
2. Create `backend/services/ai_engine.py`.
3. Configure the `genai` client using a `GEMINI_API_KEY` from the `.env` file.
4. Implement a function `verify_image_authenticity(base64_string: str) -> dict`. This function will pass the image to Gemini 1.5 Flash with a strict system prompt: "You are a civic issue triage AI. Evaluate this image. Does it contain a genuine civic issue (broken road, garbage dump, water leak, infrastructure damage)? Return a JSON object: {'is_genuine': boolean, 'confidence': float, 'reason': string}. If it is a selfie, a screen, or irrelevant, return false."
</action>
<acceptance_criteria>
- `backend/services/ai_engine.py` exists with a functional Gemini Vision call.
- The function reliably returns a structured JSON evaluation.
</acceptance_criteria>
</task>

<task>
<id>2</id>
<title>Intercept & Triage in Reports Router</title>
<type>execute</type>
<read_first>
- backend/routers/reports.py
</read_first>
<action>
1. Update `backend/routers/reports.py`.
2. In the `create_report` endpoint, before saving to the database, extract the `photo_base64`.
3. If `photo_base64` is provided, pass it to `verify_image_authenticity`.
4. If the AI returns `is_genuine: false`, raise an `HTTPException(status_code=400, detail=ai_result['reason'])`.
5. If the AI returns `is_genuine: true`, store the `confidence` score in the `ai_spam_score` column of the `Report` model and proceed with saving.
</action>
<acceptance_criteria>
- The backend successfully blocks spam images from hitting the PostgreSQL database.
- Genuine reports have their AI confidence score logged for future analytics.
</acceptance_criteria>
</task>

## must_haves
- [ ] Uses Google Gemini 1.5 Flash to ensure zero API cost for the hackathon.
- [ ] AI prompt is highly constrained to return parsable JSON.
- [ ] Fast failure: Spam is rejected *before* any database transactions occur, preserving DB integrity.
