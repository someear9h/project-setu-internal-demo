import re
from fastapi import HTTPException
import requests, logging
from core.config import settings

def strip_html(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]*>", "", text)

def normalize_term(s: str) -> str:
    return s.strip().lower() if s else ""

def ensure_fhir_bundle(payload: dict):
    if payload.get("resourceType", "").lower() != "bundle":
        raise HTTPException(status_code=400, detail="Not a FHIR Bundle")
    return payload


TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token"

def get_who_token() -> str:
    payload = {
        "client_id": settings.WHO_CLIENT_ID,
        "client_secret": settings.WHO_CLIENT_SECRET,
        "scope": "icdapi_access",
        "grant_type": "client_credentials",
    }
    res = requests.post(TOKEN_URL, data=payload, verify=True)
    res.raise_for_status()
    return res.json()["access_token"]

logging.basicConfig(level=logging.INFO)

def call_who_icd(uri: str):
    token = get_who_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Accept-Language": "en",
        "API-Version": "v2",
    }

    logging.info(f"🌐 Calling WHO ICD API: {uri}")
    logging.info(f"🔑 Headers: Authorization: Bearer {token[:10]}...")

    res = requests.get(uri, headers=headers, verify=True)

    logging.info(f"📥 WHO API Response Status: {res.status_code}")
    logging.info(f"📄 WHO API Response Body (truncated): {str(res.text)[:200]}...")

    res.raise_for_status()
    return res.json()