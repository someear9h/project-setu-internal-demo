# test_icd.py
import sys
import os
import logging

# Add the path to your project so Python can find your modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from icd_client import fetch_entity, search_icd  # Replace with your actual module name


def test_icd_functions():
    print("🧪 Testing ICD-11 Code Extraction...")

    # Test with search first to find current entity IDs
    print("\n1. Testing search functionality to find current entities:")
    search_results = search_icd("fever", 3)
    for result in search_results:
        print(f"URI: {result['uri']}")
        print(f"Code: {result['icd11_code']}: {result['title']} (score: {result['score']})")
        print("---")

    print("\n2. Testing search for influenza:")
    search_results = search_icd("influenza", 3)
    for result in search_results:
        print(f"URI: {result['uri']}")
        print(f"Code: {result['icd11_code']}: {result['title']} (score: {result['score']})")
        print("---")

    # Now test with actual entities from search results
    print("\n3. Testing specific entity lookups (using URIs from search):")

    # Try some common entities - these might need to be updated based on search results
    common_entities = [
        "https://id.who.int/icd/entity/1248145011",  # Fever (common one)
        "https://id.who.int/icd/entity/1172789034",  # Influenza
        "https://id.who.int/icd/entity/1568591733",  # Headache
    ]

    for entity_uri in common_entities:
        try:
            result = fetch_entity(entity_uri)
            print(f"Entity: {result['icd11_code']} - {entity_uri}")
            print(f"Title: {result['entity_data'].get('title', {}).get('@value', 'No title')}")
            print("---")
        except Exception as e:
            print(f"❌ Failed to fetch {entity_uri}: {e}")
            print("---")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    test_icd_functions()