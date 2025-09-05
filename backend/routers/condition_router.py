from fastapi import APIRouter, HTTPException, Depends
from backend.db import get_db
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.utils import ensure_fhir_bundle
from backend.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Conditions"])

@router.post("/generate-fhir-condition")
def generate_fhir_condition(request_body: schemas.ConditionCreate, actor: str | None = "system", _user=Depends(get_current_user)):
    fhir_condition = {
        "resourceType": "Condition",
        "clinicalStatus": {"coding":[{"system":"http://terminology.hl7.org/CodeSystem/condition-clinical","code":"active","display":"Active"}]},
        "verificationStatus": {"coding":[{"system":"http://terminology.hl7.org/CodeSystem/condition-ver-status","code":"confirmed","display":"Confirmed"}]},
        "code": {
            "text": f"{request_body.namaste_display or ''} / {request_body.icd_display or ''}",
            "coding": [
                {"system":"http://ayush.gov.in/namaste","code": request_body.namaste_code, "display": request_body.namaste_display},
                {"system":"http://id.who.int/icd/release/11/mms","code": request_body.icd_code, "display": request_body.icd_display}
            ]
        },
        "subject": {"reference": f"Patient/{request_body.patient_id}", "display": f"Patient {request_body.patient_id}"}
    }
    return fhir_condition

@router.post("/bundle-upload")
def upload_bundle(bundle: dict, db: Session = Depends(get_db), actor: str | None = "system", _user=Depends(get_current_user)):
    # Basic validation
    try:
        ensure_fhir_bundle(bundle)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # process Condition entries and store
    entries = bundle.get("entry", []) or []
    stored = []
    for ent in entries:
        res = ent.get("resource", {})
        if res.get("resourceType") == "Condition":
            c = models.Condition(
                patient_id = res.get("subject", {}).get("reference", "").split("/")[-1] or "unknown",
                namaste_code = next((cd.get("code") for cd in res.get("code", {}).get("coding", []) if "ayush" in (cd.get("system") or "")), None),
                namaste_display = next((cd.get("display") for cd in res.get("code", {}).get("coding", []) if "ayush" in (cd.get("system") or "")), None),
                icd_code = next((cd.get("code") for cd in res.get("code", {}).get("coding", []) if "who.int" in (cd.get("system") or "")), None),
                icd_display = next((cd.get("display") for cd in res.get("code", {}).get("coding", []) if "who.int" in (cd.get("system") or "")), None),
                source = "bundle-upload",
                created_by = actor,
                raw_fhir = res
            )
            db.add(c)
            db.commit()
            db.refresh(c)
            stored.append({"id": c.id, "patient_id": c.patient_id})
            # audit
            db.add(models.AuditLog(actor=actor, action="bundle-condition-store", resource=c.id, details={"patient": c.patient_id}))
            db.commit()
    return {"stored": stored}
