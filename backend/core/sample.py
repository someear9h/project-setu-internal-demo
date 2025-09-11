import requests
from config import settings

# Step 1: Get OAuth2 token
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

# Step 2: Setup headers for ICD-11 API
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json',
    'Accept-Language': 'en',
    'API-Version': 'v2'
}

# Step 3: Search ICD-11 for a specific diagnosis
diagnosis_name = "Fever"  # change this to any NAMASTE/diagnosis name
search_url = f"https://id.who.int/icd/release/11/2025-01/mms/search?q={diagnosis_name}"

response = requests.get(search_url, headers=headers, verify=False)
data = response.json()

# Step 4: Print relevant ICD-11 results
for item in data.get("destinationEntities", []):
    print("Disease:", item.get("title"))
    print("ICD-11 ID / Code:", item.get("id"))
    print("---")

entity_url = "http://id.who.int/icd/release/11/2025-01/mms/2020851679"
r = requests.get(entity_url, headers=headers, verify=False)
entity_data = r.json()
# print(entity_data)  # Look for fields like 'code' or 'title'

# entity_url = "http://id.who.int/icd/release/11/2025-01/mms/2020851679"
# r = requests.get(entity_url, headers=headers, verify=False)
# entity_data = r.json()

# Extract just the disease name and ICD-11 code
disease_name = entity_data['title']['@value']
icd_code = entity_data['code']

print(f"{disease_name}, code: {icd_code}")

