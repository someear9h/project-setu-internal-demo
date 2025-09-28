import pandas as pd

# Load the CSV (adjust the path)
csv_path = "data/namaste.csv"
df = pd.read_csv(csv_path)

# Make a list of all possible diseases from the CSV
disease_list = "\n".join(
    f"{row['NAMASTE_Code']} - {row['Traditional_Term']} / {row['Biomedical_Term']} ({row['System']})"
    for _, row in df.iterrows()
)

# Final prompt template
PROMPT_TEMPLATE = f"""
You are a clinical coding assistant. Given symptoms: "{{symptoms}}",
suggest top 3 possible diagnoses with:
- NAMASTE code provided in the list below + description
- Short reasoning (2–3 lines)
- Give diseases only from the following list:

{disease_list}

Return in structured JSON format.
"""