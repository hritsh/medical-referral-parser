"""
Medical Referral Intelligence Platform - FastAPI Backend
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import uvicorn
import io

from pypdf import PdfReader

from db import init_db, seed_data, get_all_referrals, get_referral_by_id, save_referral, update_referral_status
from gemini import parse_referral_with_gemini

# Initialize FastAPI app
app = FastAPI(
    title="Verse Medical Referral Intelligence Platform",
    description="AI-powered medical referral parsing and management system",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models


class ParseTextRequest(BaseModel):
    text: str


class ParseResponse(BaseModel):
    success: bool
    raw_text: str
    parsed_data: dict
    message: Optional[str] = None


class SaveReferralRequest(BaseModel):
    patient_name: str
    insurance: str
    status: Optional[str] = "New"
    raw_text: str
    parsed_data: dict


class ReferralResponse(BaseModel):
    id: int
    patient_name: str
    insurance: str
    status: str
    raw_text: str
    parsed_data: Any
    created_at: str


class StatusUpdateRequest(BaseModel):
    status: str


@app.on_event("startup")
async def startup_event():
    """Initialize database and seed data on startup."""
    print("Starting Referral Parser...")
    init_db()
    seed_data()
    print("Backend ready")


@app.get("/")
async def root():
    return {
        "status": "healthy",
    }


# Health check endpoint for checking if the server is running
@app.get("/health")
async def health_check():
    """Health check for monitoring."""
    return {"status": "ok"}


@app.get("/referrals", response_model=List[ReferralResponse])
async def get_referrals():
    """Get all saved referrals, ordered by most recent first."""
    try:
        referrals = get_all_referrals()
        return referrals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/referrals/{referral_id}", response_model=ReferralResponse)
async def get_referral(referral_id: int):
    """Get a specific referral by ID."""
    referral = get_referral_by_id(referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


@app.post("/parse", response_model=ParseResponse)
async def parse_referral(request: ParseTextRequest):
    """Parse a referral from text input using Gemini AI."""
    if not request.text or len(request.text.strip()) < 10:
        raise HTTPException(
            status_code=400, detail="Text must be at least 10 characters")

    try:
        parsed_data = parse_referral_with_gemini(request.text)

        return ParseResponse(
            success=True,
            raw_text=request.text,
            parsed_data=parsed_data,
            message="Referral parsed successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Parsing failed: {str(e)}")


@app.post("/parse/pdf", response_model=ParseResponse)
async def parse_pdf(file: UploadFile = File(...)):
    """Parse a referral from PDF file upload."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # Read PDF content
        content = await file.read()
        pdf_reader = PdfReader(io.BytesIO(content))

        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"

        if not text.strip():
            raise HTTPException(
                status_code=400, detail="Could not extract text from PDF")

        # Parse with Gemini
        parsed_data = parse_referral_with_gemini(text)

        return ParseResponse(
            success=True,
            raw_text=text,
            parsed_data=parsed_data,
            message="PDF parsed successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"PDF parsing failed: {str(e)}")


@app.post("/save", response_model=ReferralResponse)
async def save_referral_endpoint(request: SaveReferralRequest):
    """Save a parsed referral to the database."""
    try:
        # Determine status based on missing info
        status = request.status or "new"
        missing = request.parsed_data.get("missing_info", [])

        # auto-assign status based on what's missing
        if any("insurance" in m.lower() for m in missing):
            status = "pending_insurance"
        elif any("auth" in m.lower() or "cmn" in m.lower() for m in missing):
            status = "pending_auth"
        elif len(missing) > 0:
            status = "pending_docs"

        referral_id = save_referral(
            patient_name=request.patient_name,
            insurance=request.insurance,
            status=status,
            raw_text=request.raw_text,
            parsed_data=request.parsed_data
        )

        # Return the saved referral
        saved_referral = get_referral_by_id(referral_id)
        return saved_referral
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")


@app.patch("/referrals/{referral_id}/status")
async def update_status(referral_id: int, request: StatusUpdateRequest):
    """Update the status of a referral."""
    success = update_referral_status(referral_id, request.status)
    if not success:
        raise HTTPException(status_code=404, detail="Referral not found")
    return {"success": True, "message": "Status updated"}


@app.get("/samples")
async def get_sample_referrals():
    """Get sample referral texts for testing - wound care focused."""
    return {
        "clean": """VERSE MEDICAL ORDER FORM
Fax: (833) 694-1477

Order Date: 12/01/2024
Patient Name: Patricia Anderson
DOB: 03/18/1955

WOUND CARE ORDER
Have the patient's wounds ever been debrided? Yes

Wound 1:
ICD-10: L89.154 (Pressure ulcer of sacral region, stage 4)
Location: Sacral/coccyx area
Wound Size: 5.2 x 4.1 x 2.0 cm
Drainage: Moderate
Thickness: Full

Supplies Requested (30 day supply):
- Foam dressing with silver (Ag) - 6x6 - change every 3 days
- Alginate dressing 4x4 - for packing
- Hydrocolloid border 6x6 - secondary
- Saline wound cleanser
- Gloves, Size M
- Wound care kit

Insurance: Medicare Part B
Member ID: 1EG4-TE5-MK72

Prescribing Entity: Valley Home Health
Provider Name: Dr. Sarah Chen, MD
NPI: 1234567890
Clinic: Valley Wound Care Center
Phone: (555) 234-5678

Delivery Address:
2847 Oakwood Lane
Austin, TX 78704""",

        "messy": """*** FAX - SUNRISE HOME HEALTH ***
to: verse medical 833-694-1477
date: dec 1

pt: william tucker
dob - 10/22/68

COMPRESSION + WOUND SUPPLIES

has venous stasis ulcer left leg
wound on medial ankle, 2x2cm approx
moderate drainage, need foam dressings

compression measurements:
left leg - ankle 23cm, calf 36cm
needs 30-40 mmHg
farrow wrap preferred

ins: aetna 
member id: W883345567

also needs:
- wound cleanser
- abd pads
- tape

call me if questions 555-0199
- dr martinez NPI 9876543210""",

        "missing_insurance": """URGENT - HOSPITAL DISCHARGE TODAY

Patient: Thomas Garcia
DOB: 07/14/1982
Phone: (555) 867-5309

Dx: Surgical wound dehiscence, abdominal (T81.31XA)
Post-op day 5 from appendectomy

Wound Details:
Location: RLQ abdomen
Size: 8.0 x 3.5 x 2.5 cm
Drainage: HIGH - packing required
Thickness: Full, tunneling present

URGENT SUPPLIES NEEDED:
- Alginate rope for packing
- ABD pads 5x9
- Foam dressing 6x6
- Wound care kit
- Saline irrigation

Dressing change: BID x 1 week, then daily

Referring: Dr. Linda Park, General Surgery
Memorial Hospital
Fax: (555) 444-2222
NPI: 5566778899

** INSURANCE NOT ON FILE - PATIENT WILL CALL **
** PATIENT DISCHARGED 4PM TODAY **
** STAT DELIVERY REQUIRED **"""
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
