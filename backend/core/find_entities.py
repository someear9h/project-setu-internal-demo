# find_entities.py
from icd_client import search_icd


def find_entities():
    # Search for common conditions to get their current URIs
    conditions = ["fever", "influenza", "headache", "vomiting", "cough"]

    for condition in conditions:
        print(f"\n🔍 Searching for: {condition}")
        results = search_icd(condition, 2)

        for i, result in enumerate(results):
            print(f"{i + 1}. {result['icd11_code']}: {result['title']}")
            print(f"   URI: {result['uri']}")
            print(f"   Score: {result['score']}")


if __name__ == "__main__":
    find_entities()