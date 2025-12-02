"""
gemini integration for parsing medical referrals
handles the AI extraction of patient data from messy faxes/docs
"""

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# prompt tuned for DME/home care referral extraction
# based on what i've seen intake coordinators actually need
SYSTEM_PROMPT = """You're helping process a DME (durable medical equipment) referral for a home healthcare company. 
Your job is to extract the key info that an intake coordinator would need to process this order.

These referrals come in all forms - clean typed documents, messy faxes, handwritten notes, etc.
Do your best to pull out what you can.

Extract these fields (use null if not found):
- patient_name: full name
- dob: date of birth (any format is fine)  
- insurance: insurance company/plan
- policy_number: member ID, policy number, etc
- referring_physician: doctor who sent the referral
- physician_contact: phone/fax for the physician's office
- diagnosis: ICD codes or description
- supplies_requested: list of equipment/supplies needed
- clinical_notes: any relevant clinical justification

Also identify:
- missing_info: critical stuff that's missing (insurance, DOB, etc - things that would block processing)
- next_steps: specific actions the intake team should take (be practical - "call Dr. X for signature", "verify eligibility with Aetna", etc)

Return as JSON only, no markdown, no explanation:
{
    "extracted_data": { ... },
    "missing_info": [...],
    "next_steps": [...]
}"""


def parse_referral_with_gemini(referral_text: str) -> dict:
    """
    parse a referral doc using gemini
    falls back to basic extraction if API not configured
    """
    if not GEMINI_API_KEY:
        return _get_mock_response(referral_text)

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')

        prompt = f"""{SYSTEM_PROMPT}

--- REFERRAL TO PARSE ---
{referral_text}
---

JSON output:"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # clean up markdown if gemini wrapped it
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        return json.loads(response_text.strip())

    except json.JSONDecodeError as e:
        print(f"json parse error: {e}")
        return _get_mock_response(referral_text)
    except Exception as e:
        print(f"gemini error: {e}")
        return _get_mock_response(referral_text)


def _get_mock_response(referral_text: str) -> dict:
    """
    fallback when gemini isn't available
    does basic regex-ish extraction - not great but works for demo
    """
    text_lower = referral_text.lower()

    # try to grab patient name
    patient_name = None
    for line in referral_text.split('\n'):
        line_lower = line.lower()
        if 'patient:' in line_lower or 'pt:' in line_lower or 'name:' in line_lower:
            parts = line.split(':')
            if len(parts) > 1:
                patient_name = parts[1].strip().title()
                break

    # detect insurance
    insurance = None
    if 'medicare' in text_lower:
        insurance = "Medicare"
    elif 'medicaid' in text_lower:
        insurance = "Medicaid"
    elif 'bcbs' in text_lower or 'blue cross' in text_lower:
        insurance = "Blue Cross Blue Shield"
    elif 'aetna' in text_lower:
        insurance = "Aetna"
    elif 'united' in text_lower or 'uhc' in text_lower:
        insurance = "UnitedHealthcare"
    elif 'cigna' in text_lower:
        insurance = "Cigna"

    # figure out what's missing
    missing_info = []
    if not patient_name:
        missing_info.append("patient name unclear")
    if 'dob' not in text_lower and 'birth' not in text_lower:
        missing_info.append("date of birth needed")
    if not insurance:
        missing_info.append("insurance info missing")
    if 'policy' not in text_lower and 'member' not in text_lower and 'id #' not in text_lower:
        missing_info.append("policy/member ID needed")

    # practical next steps
    next_steps = []
    if insurance:
        next_steps.append(f"verify {insurance} eligibility before proceeding")
    else:
        next_steps.append("call patient to get insurance details")

    if 'cpap' in text_lower or 'sleep' in text_lower:
        next_steps.append(
            "will need prior auth for CPAP - check payer requirements")
    elif 'oxygen' in text_lower or 'o2' in text_lower:
        next_steps.append("oxygen requires CMN - check if included")
    elif 'diabetic' in text_lower or 'glucose' in text_lower:
        next_steps.append("confirm diabetic supply coverage limits")

    next_steps.append("verify delivery address with patient")

    return {
        "extracted_data": {
            "patient_name": patient_name,
            "dob": None,
            "insurance": insurance,
            "policy_number": None,
            "referring_physician": None,
            "physician_contact": None,
            "diagnosis": None,
            "supplies_requested": ["see original referral"],
            "clinical_notes": None
        },
        "missing_info": missing_info if missing_info else ["review document for completeness"],
        "next_steps": next_steps,
        "_note": "mock response - set GEMINI_API_KEY for real AI parsing"
    }
