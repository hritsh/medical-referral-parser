"""
Database module for the Medical Referral Intelligence Platform.
Uses SQLite for persistent storage of referrals.
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Optional
from contextlib import contextmanager

DATABASE_PATH = "referrals.db"


def get_connection():
    """Get a database connection with row factory enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_db():
    """Initialize the database schema."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS referrals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_name TEXT,
                insurance TEXT,
                status TEXT DEFAULT 'New',
                raw_text TEXT,
                parsed_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


def seed_data():
    """Seed the database with mock referrals if empty."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM referrals")
        count = cursor.fetchone()[0]

        if count == 0:
            mock_referrals = [
                {
                    "patient_name": "Dorothy Mitchell",
                    "insurance": "Medicare Part B",
                    "status": "pending_auth",
                    "raw_text": """VERSE MEDICAL ORDER FORM
Fax: (833) 694-1477

Order Date: 11/28/2024
Patient Name: Dorothy Mitchell
DOB: 04/12/1942

WOUND CARE ORDER
Have the patient's wounds ever been debrided? Yes
(Debridement is required by Medicare)

Wound 1: 
ICD-10: L89.314 (Pressure ulcer of left buttock, stage 4)
Location: Left buttock/sacral area
Wound Size: 4.2 x 3.8 x 1.5 cm
Drainage: Moderate
Stage: Full thickness

Supplies Requested:
- Foam dressing with silver (Ag) - 4x4 - 30 days - change every 3 days
- Hydrocolloid border - 4x4 - 30 days - change every 5-7 days  
- Saline wound cleanser
- Gloves, Size M
- Wound care kit

Prescribing Entity: Sunrise Home Health
Provider Name: Dr. Amanda Chen, MD
NPI: 1234567890
Clinic: Sunrise Wound Care Center
Phone: (555) 234-5678""",
                    "parsed_data": json.dumps({
                        "extracted_data": {
                            "patient_name": "Dorothy Mitchell",
                            "dob": "04/12/1942",
                            "insurance": "Medicare Part B",
                            "policy_number": None,
                            "referring_physician": "Dr. Amanda Chen, MD",
                            "physician_npi": "1234567890",
                            "physician_contact": "(555) 234-5678",
                            "diagnosis": "Pressure ulcer of left buttock, stage 4",
                            "icd_codes": ["L89.314"],
                            "hcpcs_codes": ["A6212", "A6234", "A6260"],
                            "supplies_requested": [
                                "Foam dressing with silver (Ag) 4x4",
                                "Hydrocolloid border 4x4",
                                "Saline wound cleanser",
                                "Gloves Size M",
                                "Wound care kit"
                            ],
                            "clinical_notes": "Stage 4 pressure ulcer, debridement completed. Full thickness wound requiring silver dressings for infection prevention.",
                            "delivery_address": None,
                            "urgency": "routine"
                        },
                        "missing_info": [
                            "Medicare member ID",
                            "Patient delivery address"
                        ],
                        "next_steps": [
                            "Verify Medicare Part B eligibility",
                            "Confirm wound supplies covered under surgical dressing benefit",
                            "Call patient to confirm delivery address",
                            "Schedule 30-day supply delivery"
                        ]
                    })
                },
                {
                    "patient_name": "Harold Thompson",
                    "insurance": "Aetna",
                    "status": "new",
                    "raw_text": """*** FAX FROM DR MARTINEZ OFFICE ***
To: Verse Medical
Date: 11/29/2024

pt: harold thompson
dob - 8/15/58

COMPRESSION ORDER - venous stasis ulcer
left leg measurements:
ankle: 22cm
calf: 38cm  
length: 42cm

needs 30-40 mmHg compression
recommend Farrow basic wrap

also wound supplies for venous ulcer left medial ankle
- 2.5 x 2.0 cm, shallow, moderate drainage

insurance: aetna PPO
member id: W789456123

call if questions 555-0199
- dr martinez""",
                    "parsed_data": json.dumps({
                        "extracted_data": {
                            "patient_name": "Harold Thompson",
                            "dob": "08/15/1958",
                            "insurance": "Aetna PPO",
                            "policy_number": "W789456123",
                            "referring_physician": "Dr. Martinez",
                            "physician_npi": None,
                            "physician_contact": "555-0199",
                            "diagnosis": "Venous stasis ulcer, left lower leg",
                            "icd_codes": ["I87.312", "L97.329"],
                            "hcpcs_codes": None,
                            "supplies_requested": [
                                "Compression wrap 30-40 mmHg (Farrow Basic)",
                                "Wound dressings for venous ulcer"
                            ],
                            "clinical_notes": "Left leg compression measurements: Ankle 22cm, Calf 38cm, Length 42cm. Venous ulcer left medial ankle 2.5x2.0cm, shallow, moderate drainage.",
                            "delivery_address": None,
                            "urgency": "routine"
                        },
                        "missing_info": [
                            "Physician NPI number",
                            "Patient delivery address",
                            "Specific wound dressing sizes"
                        ],
                        "next_steps": [
                            "Call Dr. Martinez office at 555-0199 for NPI",
                            "Verify Aetna eligibility for compression therapy",
                            "Check if prior auth needed for compression garments",
                            "Confirm wound dressing specifications"
                        ]
                    })
                },
                {
                    "patient_name": "Maria Santos",
                    "insurance": "UnitedHealthcare",
                    "status": "approved",
                    "raw_text": """VERSE MEDICAL ORDER FORM
Fax: (833) 694-1477
Phone: (833) 518-1613

Order Date: 11/25/2024
Patient Name: Maria Santos
DOB: 06/22/1965

WOUND CARE ORDER

Wound 1:
ICD-10: L97.529 - Non-pressure chronic ulcer of other part of left foot
Location: Left plantar (diabetic foot ulcer)
Size: 1.8 x 1.2 x 0.3 cm
Drainage: Low
Thickness: Partial

Wound 2:
ICD-10: L97.419 - Non-pressure chronic ulcer of right heel
Location: Right heel
Size: 2.0 x 1.5 x 0.2 cm  
Drainage: Low
Thickness: Partial

Supplies (30 day):
- Alginate dressing 2x2 - both wounds - change daily
- Foam border 4x4 (secondary) - both wounds
- Offloading boot - left foot
- Diabetic socks

Insurance: UnitedHealthcare
Member ID: U445566778
Auth #: DME2024-11789 (approved 11/26)

Provider: Dr. James Wilson, DPM
NPI: 9876543210
Clinic: Valley Foot & Ankle Center
Fax: (555) 333-4444

DELIVERY ADDRESS:
1847 Oak Street Apt 3B
San Antonio, TX 78201""",
                    "parsed_data": json.dumps({
                        "extracted_data": {
                            "patient_name": "Maria Santos",
                            "dob": "06/22/1965",
                            "insurance": "UnitedHealthcare",
                            "policy_number": "U445566778",
                            "referring_physician": "Dr. James Wilson, DPM",
                            "physician_npi": "9876543210",
                            "physician_contact": "(555) 333-4444",
                            "diagnosis": "Diabetic foot ulcers, bilateral",
                            "icd_codes": ["L97.529", "L97.419", "E11.621"],
                            "hcpcs_codes": ["A6196", "A6212", "L3260", "A6457"],
                            "supplies_requested": [
                                "Alginate dressing 2x2 (daily change)",
                                "Foam border 4x4 (secondary dressing)",
                                "Offloading boot - left foot",
                                "Diabetic socks"
                            ],
                            "clinical_notes": "Two diabetic foot ulcers requiring daily dressing changes. Offloading boot for left plantar ulcer. Prior auth approved 11/26.",
                            "delivery_address": "1847 Oak Street Apt 3B, San Antonio, TX 78201",
                            "urgency": "routine"
                        },
                        "missing_info": [],
                        "next_steps": [
                            "Prior auth already approved (DME2024-11789)",
                            "Schedule delivery to 1847 Oak Street Apt 3B",
                            "Include wound care instructions in package",
                            "Set up 30-day resupply reminder"
                        ]
                    })
                },
                {
                    "patient_name": "Robert Chen",
                    "insurance": "Humana",
                    "status": "pending_insurance",
                    "raw_text": """URGENT - HOME HEALTH REFERRAL

Patient: Robert Chen
DOB: 11/03/1978
Phone: (555) 867-5309

Dx: Post-surgical wound dehiscence, abdominal (T81.31XA)
    s/p emergency appendectomy with complications

WOUND DETAILS:
Location: Lower right abdominal quadrant  
Size: 6.5 x 2.8 x 2.0 cm
Drainage: HIGH - requires packing
Stage: Full thickness, tunneling present

SUPPLIES NEEDED (URGENT):
- Alginate rope/ribbon for packing
- ABD pads 5x9
- Foam dressing 6x6
- Surgical tape
- Sterile saline irrigation
- Wound care kit

Dressing change: BID initially, then daily

Insurance: Humana Gold Plus (Medicare Advantage)
** NEED TO VERIFY COVERAGE - patient unsure of plan details **

Referring: Dr. Patricia Nguyen, General Surgery  
Hospital: Memorial Regional Medical Center
Fax: (555) 444-2222
NPI: 1122334455

** PATIENT DISCHARGED TODAY - NEEDS SUPPLIES ASAP **""",
                    "parsed_data": json.dumps({
                        "extracted_data": {
                            "patient_name": "Robert Chen",
                            "dob": "11/03/1978",
                            "insurance": "Humana Gold Plus (Medicare Advantage)",
                            "policy_number": None,
                            "referring_physician": "Dr. Patricia Nguyen",
                            "physician_npi": "1122334455",
                            "physician_contact": "(555) 444-2222",
                            "diagnosis": "Post-surgical wound dehiscence, abdominal",
                            "icd_codes": ["T81.31XA"],
                            "hcpcs_codes": ["A6199", "A6216", "A6210"],
                            "supplies_requested": [
                                "Alginate rope/ribbon for packing",
                                "ABD pads 5x9",
                                "Foam dressing 6x6",
                                "Surgical tape",
                                "Sterile saline irrigation",
                                "Wound care kit"
                            ],
                            "clinical_notes": "Post-appendectomy wound dehiscence with tunneling. Full thickness, high drainage. Requires BID dressing changes initially. Patient discharged same day - urgent need.",
                            "delivery_address": None,
                            "urgency": "stat"
                        },
                        "missing_info": [
                            "Humana member ID number",
                            "Patient delivery address",
                            "Verify Humana plan covers surgical dressings"
                        ],
                        "next_steps": [
                            "URGENT: Call patient at (555) 867-5309 for Humana member ID",
                            "Verify Humana Gold Plus coverage for surgical dressings",
                            "Get delivery address - patient discharged today",
                            "Expedite delivery - stat order"
                        ]
                    })
                },
                {
                    "patient_name": "Eleanor Williams",
                    "insurance": "Blue Cross Blue Shield",
                    "status": "scheduled",
                    "raw_text": """VERSE MEDICAL - COMPRESSION THERAPY ORDER

Order Date: 11/20/2024
Patient: Eleanor Williams  
DOB: 02/28/1950

DIAGNOSIS: Chronic venous insufficiency with bilateral leg edema (I87.2)
          Lymphedema, bilateral lower extremities (I89.0)

COMPRESSION MEASUREMENTS:
Right Leg: Ankle 24cm, Calf 42cm, Length 45cm
Left Leg: Ankle 25cm, Calf 44cm, Length 44cm

COMPRESSION LEVEL: 40-50 mmHg

Products Ordered:
- Juzo Dual Layer compression system - bilateral
- UlcerCare stockings (backup)

Insurance: BCBS of Texas PPO
Member ID: BCB998877665
Prior Auth: PA-2024-445566 (approved)

Provider: Dr. Michelle Park, Vascular Surgery
NPI: 5566778899
Cleveland Vascular Associates
Phone: (555) 222-3333

Delivery Address:
892 Magnolia Drive
Houston, TX 77024

** DELIVERY SCHEDULED FOR 12/02/2024 **""",
                    "parsed_data": json.dumps({
                        "extracted_data": {
                            "patient_name": "Eleanor Williams",
                            "dob": "02/28/1950",
                            "insurance": "Blue Cross Blue Shield of Texas PPO",
                            "policy_number": "BCB998877665",
                            "referring_physician": "Dr. Michelle Park",
                            "physician_npi": "5566778899",
                            "physician_contact": "(555) 222-3333",
                            "diagnosis": "Chronic venous insufficiency with bilateral leg edema, Lymphedema",
                            "icd_codes": ["I87.2", "I89.0"],
                            "hcpcs_codes": ["A6531", "A6545"],
                            "supplies_requested": [
                                "Juzo Dual Layer compression system - bilateral",
                                "UlcerCare stockings (backup)"
                            ],
                            "clinical_notes": "Bilateral compression therapy for CVI and lymphedema. Measurements: R ankle 24cm, calf 42cm; L ankle 25cm, calf 44cm. 40-50 mmHg compression level.",
                            "delivery_address": "892 Magnolia Drive, Houston, TX 77024",
                            "urgency": "routine"
                        },
                        "missing_info": [],
                        "next_steps": [
                            "Delivery scheduled for 12/02/2024",
                            "Confirm patient available at delivery address",
                            "Include compression therapy fitting instructions",
                            "Schedule 90-day follow-up for replacement"
                        ]
                    })
                },
                {
                    "patient_name": "James Morrison",
                    "insurance": "Medicaid",
                    "status": "pending_docs",
                    "raw_text": """fax to verse medical
833-694-1477

pt james morrison
dob 9/5/89

diabetic supplies needed:
- glucose meter
- test strips 100ct
- lancets  
- control solution

also wound supplies - has ulcer on right big toe
small wound maybe 1cm, needs daily dressing

dx: type 2 diabetes E11.65
    diabetic foot ulcer right toe L97.511

medicaid - texas
** NEED SIGNED CMN FOR DIABETIC SUPPLIES **

dr. hoffman
family medicine
555-888-9999""",
                    "parsed_data": json.dumps({
                        "extracted_data": {
                            "patient_name": "James Morrison",
                            "dob": "09/05/1989",
                            "insurance": "Texas Medicaid",
                            "policy_number": None,
                            "referring_physician": "Dr. Hoffman",
                            "physician_npi": None,
                            "physician_contact": "555-888-9999",
                            "diagnosis": "Type 2 diabetes with diabetic foot ulcer",
                            "icd_codes": ["E11.65", "L97.511"],
                            "hcpcs_codes": ["E0607", "A4253", "A4259"],
                            "supplies_requested": [
                                "Glucose meter",
                                "Test strips 100ct",
                                "Lancets",
                                "Control solution",
                                "Wound dressing supplies (right toe ulcer)"
                            ],
                            "clinical_notes": "Diabetic foot ulcer right great toe, approximately 1cm, requires daily dressing changes.",
                            "delivery_address": None,
                            "urgency": "routine"
                        },
                        "missing_info": [
                            "Medicaid member ID",
                            "Signed Certificate of Medical Necessity (CMN)",
                            "Physician NPI",
                            "Patient delivery address"
                        ],
                        "next_steps": [
                            "Fax CMN form to Dr. Hoffman at 555-888-9999 for signature",
                            "Call patient to obtain Medicaid ID and address",
                            "Verify Medicaid coverage for diabetic supplies",
                            "Check if wound supplies covered under Medicaid"
                        ]
                    })
                }
            ]

            for referral in mock_referrals:
                cursor.execute("""
                    INSERT INTO referrals (patient_name, insurance, status, raw_text, parsed_data)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    referral["patient_name"],
                    referral["insurance"],
                    referral["status"],
                    referral["raw_text"],
                    referral["parsed_data"]
                ))

            conn.commit()
            print("✅ Database seeded with 6 wound care/DME mock referrals")


def get_all_referrals() -> List[dict]:
    """Get all referrals, ordered by most recent first."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, patient_name, insurance, status, raw_text, parsed_data, created_at
            FROM referrals
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()

        referrals = []
        for row in rows:
            referral = dict(row)
            if referral["parsed_data"]:
                try:
                    referral["parsed_data"] = json.loads(
                        referral["parsed_data"])
                except json.JSONDecodeError:
                    pass
            referrals.append(referral)

        return referrals


def get_referral_by_id(referral_id: int) -> Optional[dict]:
    """Get a specific referral by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, patient_name, insurance, status, raw_text, parsed_data, created_at
            FROM referrals
            WHERE id = ?
        """, (referral_id,))
        row = cursor.fetchone()

        if row:
            referral = dict(row)
            if referral["parsed_data"]:
                try:
                    referral["parsed_data"] = json.loads(
                        referral["parsed_data"])
                except json.JSONDecodeError:
                    pass
            return referral
        return None


def save_referral(patient_name: str, insurance: str, status: str, raw_text: str, parsed_data: dict) -> int:
    """Save a new referral to the database."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO referrals (patient_name, insurance, status, raw_text, parsed_data)
            VALUES (?, ?, ?, ?, ?)
        """, (
            patient_name,
            insurance,
            status,
            raw_text,
            json.dumps(parsed_data)
        ))
        conn.commit()
        return cursor.lastrowid


def update_referral_status(referral_id: int, status: str) -> bool:
    """Update the status of a referral."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE referrals
            SET status = ?
            WHERE id = ?
        """, (status, referral_id))
        conn.commit()
        return cursor.rowcount > 0
