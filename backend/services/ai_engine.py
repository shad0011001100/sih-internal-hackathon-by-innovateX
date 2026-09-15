import os
import json
import base64
import re
import ast
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Gemini setup (for vision tasks if needed)
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

# NVIDIA NIM setup (Nemotron for text intelligence)
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
nv_client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = NVIDIA_API_KEY,
  timeout = 12.0
)

def safe_parse_json(raw_text: str) -> dict:
    """
    Resilient JSON extractor and healer:
    1. Extracts outermost {...} block ignoring markdown or conversational preambles/postambles
    2. Removes trailing commas before closing braces/brackets
    3. Handles literal evaluation for single-quoted Python dict representations
    """
    clean_text = raw_text.strip()
    if "```" in clean_text:
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', clean_text)
        if match:
            clean_text = match.group(1).strip()

    json_match = re.search(r'(\{[\s\S]*\})', clean_text)
    if json_match:
        clean_text = json_match.group(1).strip()

    # Strip trailing commas
    clean_text = re.sub(r',\s*([\}\]])', r'\1', clean_text)

    try:
        return json.loads(clean_text)
    except Exception:
        pass

    try:
        eval_result = ast.literal_eval(clean_text)
        if isinstance(eval_result, dict):
            return eval_result
    except Exception:
        pass

    raise ValueError(f"Could not parse valid JSON from output: {raw_text[:80]}...")

def verify_image_authenticity(base64_data: str) -> dict:
    """
    Passes the base64 image to Gemini 1.5 Flash to verify if it is a genuine civic issue.
    Returns: {"is_genuine": bool, "confidence": float, "reason": str}
    """
    if not api_key:
        return {"is_genuine": True, "confidence": 0.99, "reason": "Bypassed AI triage (No API key found)"}
    
    try:
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
            
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = """
        You are a civic issue triage AI for the Jharkhand Government.
        Evaluate this image. Does it contain a genuine civic or infrastructure issue?
        
        Return ONLY a JSON object with this exact schema (no markdown, no backticks):
        {
            "is_genuine": boolean,
            "confidence": float (between 0.0 and 1.0),
            "reason": "Brief 1-sentence explanation"
        }
        """
        
        response = model.generate_content([
            {'mime_type': 'image/jpeg', 'data': base64_data},
            prompt
        ])
        
        response_text = response.text.strip()
        return safe_parse_json(response_text)
    except Exception as e:
        print(f"AI Engine Error: {e}")
        return {"is_genuine": True, "confidence": 0.5, "reason": f"AI error fallback: {str(e)}"}

def is_spam_content(text: str) -> tuple[bool, float, str]:
    """
    Evaluates text for spam, gibberish, abusive, or non-civic input.
    Returns (is_spam, spam_score, reason)
    """
    clean_text = text.lower().strip()
    if len(clean_text) < 6:
        return True, 0.95, "Text too short to be a valid civic issue."
        
    words = clean_text.split()
    if len(words) == 1 and len(words[0]) > 14 and not any(v in words[0] for v in "aeiou"):
        return True, 0.98, "Gibberish or random character sequence detected."
        
    spam_indicators = [
        "free crypto", "buy followers", "casino", "viagra", "cheap loans", 
        "earn money fast", "telegram bot", "whatsapp spam", "asdfgh", "test test test"
    ]
    for sp in spam_indicators:
        if sp in clean_text:
            return True, 0.99, f"Spam pattern detected: '{sp}'."
            
    return False, 0.0, "Content authentic."

def evaluate_student_suitability(description: str, category: str) -> tuple[bool, str]:
    """
    Checks if a civic problem is suitable for University Students (IoT, AI, Software, GIS, Water purification capstones)
    versus routine physical manual municipal labor (e.g. pothole filling, asphalt road repair, manual construction)
    that students cannot do.
    """
    import re
    desc_lower = description.lower()
    
    # Manual physical municipal labor keywords
    manual_labor_patterns = r'\b(potholes?|patch\s+road|tar\s+road|asphalt|fill\s+road|ditch\s+digging|heavy\s+construction|masonry|brick\s+laying|road\s+digging|gutter\s+desilt|sewer\s+desilt|garbage\s+dump|bulldoze|excavat\w+|fix\s+pothole)\b'
    
    # Check if user mentioned technical research / sensor / monitoring
    tech_patterns = r'\b(ai|iot|sensors?|smart|algorithm|machine\s+learning|deep\s+learning|gis|mapping|solar|purif\w+|filter\w*|telemedicine|software|dashboard|computer\s+vision|water\s+testing|predictive)\b'
    
    labor_match = re.search(manual_labor_patterns, desc_lower)
    tech_match = re.search(tech_patterns, desc_lower)
    
    if labor_match and not tech_match:
        matched_kw = labor_match.group(0)
        return False, f"Municipal physical labor required ({matched_kw}). Routed to municipal road & maintenance crews."
        
    # Check if too generic/placeholder
    if len(desc_lower.strip()) < 8:
        return False, "Insufficient information for student research adoption."
        
    return True, "Approved for student innovation & engineering capstones."

def analyze_and_route_problem(description: str, category: str, photo_base64: str | None = None) -> dict:
    """
    Uses NVIDIA's Nemotron 3.5 Lightning (via OpenAI client) to authenticate, route, and assess
    student suitability for a civic problem.
    """
    # Quick heuristic check for spam and student suitability
    spam_flag, spam_conf, spam_reason = is_spam_content(description)
    heuristic_suitable, heuristic_reason = evaluate_student_suitability(description, category)

    try:
        prompt = f"""
        Analyze this civic issue report:
        Category: {category}
        Description: {description}
        
        Tasks:
        1. Summarize the challenge in 2 lines
        2. Rate severity (critical/high/medium/low) and give priority_score (0.0-1.0)
        3. Identify possible technologies (e.g., IoT sensors, GIS mapping, Data Analytics, Water Testing)
        4. Find relevant university departments (e.g., Civil Engineering, Environmental Science, CS, Public Health)
        5. Detect potential industry partner types
        6. Check if it is spam, gibberish, or irrelevant
        7. Determine if it is suitable for UNIVERSITY STUDENTS (Computer Science, IoT, GIS, Environmental Engineering, Data Science, Research Capstones) OR if it is purely routine manual physical labor / maintenance (such as physical pothole filling with asphalt, heavy manual construction, physical digging) which municipal work crews must do directly and students cannot do.
        
        Return ONLY a JSON object with this exact schema (no markdown, no other text):
        {{
          "challenge_summary": "string",
          "severity": "string",
          "priority_score": float,
          "possible_technologies": ["string"],
          "relevant_departments": ["string"],
          "potential_industry": ["string"],
          "is_spam": boolean,
          "is_student_suitable": boolean,
          "student_suitability_reason": "string",
          "is_duplicate_likely": boolean,
          "duplicate_reason": "string"
        }}
        """
        
        completion = nv_client.chat.completions.create(
            model="nvidia/nemotron-3.5-lightning-30b-a3b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            top_p=0.95,
            max_tokens=512,
            timeout=10.0,
            extra_body={"chat_template_kwargs":{"enable_thinking":False}},
            stream=False
        )
        
        response_text = completion.choices[0].message.content.strip()
        data = safe_parse_json(response_text)
        
        # If heuristics flagged manual labor / pothole, enforce it
        if not heuristic_suitable:
            data["is_student_suitable"] = False
            data["student_suitability_reason"] = heuristic_reason
            
        if spam_flag:
            data["is_spam"] = True
            data["spam_reason"] = spam_reason
            
        return data
    except Exception as e:
        print(f"NVIDIA Routing AI Fallback ({e})")
        # Intelligent Jharkhand civic rule-based classification fallback
        cat_lower = (category or "").lower()
        desc_lower = (description or "").lower()

        if any(k in cat_lower or k in desc_lower for k in ["water", "jal", "pipe", "borewell", "tank"]):
            techs = ["IoT Flow Sensors", "Water Quality Telemetry (TDS/pH)", "Solar Pump Controllers"]
            depts = ["Civil & Environmental Engineering", "Water Resources Department"]
            industry = ["Tata Steel Foundation (Clean Water Initiative)", "PHED Water Contractors"]
            priority = 0.85
            severity = "high"
        elif any(k in cat_lower or k in desc_lower for k in ["light", "street", "solar", "power", "electric"]):
            techs = ["Smart Mesh Light Controllers", "Solar PV Microgrid", "IoT Fault Detection"]
            depts = ["Electrical & Electronics Engineering", "Energy & Power Systems"]
            industry = ["Jindal Steel & Power (Clean Energy)", "JBVNL Smart Grid Partners"]
            priority = 0.70
            severity = "medium"
        elif any(k in cat_lower or k in desc_lower for k in ["waste", "sanitation", "garbage", "drain", "sewer"]):
            techs = ["GIS Waste Route Optimization", "Smart Bin Fill Sensors", "Drainage Flow Monitors"]
            depts = ["Environmental Science & Rural Tech", "Municipal Solid Waste Management"]
            industry = ["Central Coalfields Limited (CCL CSR)", "RMC Sanitation Tech"]
            priority = 0.80
            severity = "high"
        elif any(k in cat_lower or k in desc_lower for k in ["health", "clinic", "hospital", "medicine"]):
            techs = ["Telemedicine Diagnostic Kiosks", "Cold-Chain Vaccine Monitors", "Health Record GIS"]
            depts = ["Biomedical Engineering", "Public Health & Data Science"]
            industry = ["Apollo Clinics Jharkhand", "Tata Trust Rural Health"]
            priority = 0.90
            severity = "critical"
        else:
            techs = ["IoT Sensors", "GIS Ward Spatial Mapping", "Computer Vision Triage"]
            depts = ["Computer Science & Rural Technology", "Civil Engineering"]
            industry = ["Jharkhand State IT Mission", "Civic Tech CSR Partners"]
            priority = 0.65
            severity = "medium"

        return {
            "challenge_summary": description.split('\n')[0][:80] if description else f"{category} Issue",
            "severity": severity,
            "priority_score": priority,
            "possible_technologies": techs if heuristic_suitable else [],
            "relevant_departments": depts if heuristic_suitable else ["Municipal Maintenance Crews"],
            "potential_industry": industry,
            "is_spam": spam_flag,
            "is_student_suitable": heuristic_suitable,
            "student_suitability_reason": heuristic_reason,
            "is_duplicate_likely": False,
            "duplicate_reason": ""
        }
