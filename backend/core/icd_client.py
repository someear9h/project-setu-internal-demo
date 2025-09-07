import requests, logging
from backend.core.config import settings

TOKEN_ENDPOINT = "https://icdaccessmanagement.who.int/connect/token"
ICD_ENTITY_BASE = "https://id.who.int/icd/entity"
ICD_SEARCH = "https://id.who.int/icd/entity/search"

def get_who_token():
    payload = {
        "client_id": settings.WHO_CLIENT_ID,
        "client_secret": settings.WHO_CLIENT_SECRET,
        "scope": "icdapi_access",
        "grant_type": "client_credentials"
    }
    r = requests.post(TOKEN_ENDPOINT, data=payload, verify=True)
    r.raise_for_status()
    return r.json().get("access_token")

logging.basicConfig(level=logging.INFO)

def fetch_entity(uri: str):
    token = get_who_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "API-Version": "v2"
    }
    logging.info(f"🌐 fetch_entity -> Calling WHO ICD: {uri}")
    r = requests.get(uri, headers=headers, verify=True)
    logging.info(f"📥 Response Status: {r.status_code}, Body (truncated): {str(r.text)[:200]}...")
    r.raise_for_status()
    return r.json()

def search_icd(term: str, limit: int = 10):
    token = get_who_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "API-Version": "v2"
    }
    params = {"q": term, "size": limit}
    r = requests.get(ICD_SEARCH, headers=headers, params=params, verify=True)
    r.raise_for_status()
    return r.json()
