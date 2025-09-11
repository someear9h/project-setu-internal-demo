import requests
import logging
from core.config import settings
from typing import Optional, Dict, Any, List
import re


TOKEN_ENDPOINT = "https://icdaccessmanagement.who.int/connect/token"
ICD_API_BASE = "https://id.who.int/icd"  # Base URL for all API calls
ICD_RELEASE = "11"  # ICD-11 release


def get_who_token():
    """Get authentication token from WHO API"""
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


def _is_valid_icd11_stem_code(code: str) -> bool:
    """
    Helper function to validate if a string looks like a valid ICD-11 stem code.
    Pattern: 1-2 Letters, followed by 2+ numbers, optionally followed by a dot and more numbers.
    Examples: 'MG26', '1A40', 'JA00.0', '8A80.10'
    """
    if not code:
        return False
    pattern = r'^[A-Z0-9]{1,2}\d{2,}(\.\d+)?$'
    return re.match(pattern, code) is not None


def extract_icd11_code(entity_data: Dict[str, Any]) -> Optional[str]:
    """
    Extracts the primary linearization (stem) code from a WHO ICD-11 API entity response.
    """
    # Priority 1: Check if the entity itself has a code
    entity_code = entity_data.get('code')
    if entity_code and _is_valid_icd11_stem_code(entity_code):
        return entity_code

    # Priority 2: Check children
    children = entity_data.get('children', [])
    for child in children:
        child_code = child.get('code')
        if child_code and _is_valid_icd11_stem_code(child_code):
            return child_code

    # Priority 3: Check parent
    parents = entity_data.get('parent', [])
    if isinstance(parents, list):
        for parent in parents:
            parent_code = parent.get('code')
            if parent_code and _is_valid_icd11_stem_code(parent_code):
                return parent_code
    elif isinstance(parents, dict):
        parent_code = parents.get('code')
        if parent_code and _is_valid_icd11_stem_code(parent_code):
            return parent_code

    # Priority 4: Extract from title
    title = entity_data.get('title', {}).get('@value', '')
    code_in_title = re.search(r'\(([A-Z0-9]{2,}\.[0-9]+)\)', title)
    if code_in_title:
        potential_code = code_in_title.group(1)
        if _is_valid_icd11_stem_code(potential_code):
            return potential_code

    logging.warning(f"⚠️ Could not extract stem code from: {entity_data.get('title', {}).get('@value', 'No Title')}")
    return None


def fetch_entity(entity_id: str) -> Dict[str, Any]:
    """Fetch a specific entity from the WHO ICD-11 API"""
    token = get_who_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "API-Version": "v2",
        "Accept-Language": "en"
    }

    # CORRECTED ENDPOINT
    url = f"{ICD_API_BASE}/release/{ICD_RELEASE}/{entity_id}"
    logging.info(f"🌐 Fetching entity: {url}")

    r = requests.get(url, headers=headers, verify=True)
    logging.info(f"📥 Response Status: {r.status_code}")
    r.raise_for_status()

    entity_data = r.json()
    icd11_code = extract_icd11_code(entity_data)

    return {
        "entity_data": entity_data,
        "icd11_code": icd11_code
    }


# def search_icd(term: str, limit: int = 10) -> List[Dict[str, Any]]:
#     """Search the WHO ICD-11 API"""
#     token = get_who_token()
#     headers = {
#         "Authorization": f"Bearer {token}",
#         "Accept": "application/json",
#         "API-Version": "v2",
#         "Accept-Language": "en"
#     }
#
#     # CORRECTED SEARCH ENDPOINT
#     url = f"{ICD_API_BASE}/release/{ICD_RELEASE}/mms/search"
#     params = {"q": term, "size": limit}
#
#     logging.info(f"🔍 Searching: {url}?q={term}")
#     r = requests.get(url, headers=headers, params=params, verify=True)
#     logging.info(f"📥 Search Status: {r.status_code}")
#     r.raise_for_status()
#
#     search_results = r.json()
#     entities = search_results.get('destinationEntities', [])
#
#     processed_results = []
#     for entity in entities:
#         icd11_code = extract_icd11_code(entity)
#         processed_result = {
#             "title": entity.get('title', {}).get('@value', 'No Title'),
#             "uri": entity.get('@id', 'No URI'),
#             "entity_id": entity.get('@id', '').split('/')[-1],  # Extract just the ID
#             "icd11_code": icd11_code,
#             "score": entity.get('score', 0)
#         }
#         processed_results.append(processed_result)
#
#     processed_results.sort(key=lambda x: x['score'], reverse=True)
#     return processed_results[:limit]


# Test function
def test_icd_api():
    """Test the ICD API functionality"""
    print("🧪 Testing ICD-11 API...")

    try:
        # Test search first
        print("\n1. Testing search:")
        results = search_icd("fever", 3)
        for result in results:
            print(f"   {result['icd11_code']}: {result['title']} (score: {result['score']})")
            print(f"   Entity ID: {result['entity_id']}")

        # Test entity lookup if we found any entities
        if results:
            print("\n2. Testing entity lookup:")
            entity_id = results[0]['entity_id']
            entity_result = fetch_entity(entity_id)
            print(f"   Entity {entity_id}: {entity_result['icd11_code']}")

    except Exception as e:
        print(f"❌ Error: {e}")
        print("Check your WHO API credentials in settings!")


def get_token():
    """Fetch WHO ICD API OAuth2 token"""
    token_endpoint = 'https://icdaccessmanagement.who.int/connect/token'
    payload = {
        'client_id': settings.WHO_CLIENT_ID,
        'client_secret': settings.WHO_CLIENT_SECRET,
        'scope': 'icdapi_access',
        'grant_type': 'client_credentials'
    }

    token_response = requests.post(token_endpoint, data=payload, verify=False).json()
    token = token_response.get('access_token')
    if not token:
        raise Exception("Failed to get access token from WHO ICD API")
    return token


def get_headers():
    """Return headers with Bearer token"""
    token = get_token()
    return {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'Accept-Language': 'en',
        'API-Version': 'v2'
    }


def search_icd(diagnosis_name: str):
    """Search ICD-11 by disease name"""
    headers = get_headers()
    search_url = f"https://id.who.int/icd/release/11/2025-01/mms/search?q={diagnosis_name}"
    response = requests.get(search_url, headers=headers, verify=False)
    return response.json()


def get_icd_entity(entity_id: str):
    """
    Get ICD-11 entity details from WHO (e.g., 2020851679).
    Returns dict: { 'name': str, 'code': str, 'id': str }
    """
    headers = get_headers()
    entity_url = f"http://id.who.int/icd/release/11/2025-01/mms/{entity_id}"
    r = requests.get(entity_url, headers=headers, verify=False)
    entity_data = r.json()

    return {
        "id": entity_id,
        "name": entity_data["title"]["@value"],
        "code": entity_data["code"]
    }



if __name__ == "__main__":
    test_icd_api()