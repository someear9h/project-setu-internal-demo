import csv
from pathlib import Path

DIAGNOSIS_MAP = {}

def load_diagnosis_map():
    global DIAGNOSIS_MAP
    if DIAGNOSIS_MAP:
        return DIAGNOSIS_MAP

    csv_path = Path(__file__).parent.parent / "data" / "namaste.csv"  # place your CSV here
    with open(csv_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            diagnosis_name = row["Traditional_Term"].strip().lower()
            DIAGNOSIS_MAP[diagnosis_name] = {
                "NAMASTE_Code": row["NAMASTE_Code"],
                "ICD/TM": row["Traditional_Term"],
                "Biomedical": row["Biomedical_Term"],
                "System": row["System"]
            }
    return DIAGNOSIS_MAP

def get_codes_for_diagnosis(diagnosis_name: str):
    diagnosis_name = diagnosis_name.strip().lower()
    return DIAGNOSIS_MAP.get(diagnosis_name, None)
