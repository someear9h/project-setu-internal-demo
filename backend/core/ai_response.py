import os
from datetime import datetime
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import google.generativeai as genai
import json

from core.ai_prompt import PROMPT_TEMPLATE
from core.diagnosis_lookup import get_codes_for_diagnosis
from models.job import NamasteJob

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash-lite")

class NamasteAiResponse:

    @classmethod
    def generate(cls, db: Session, job_id: str, text: str) -> NamasteJob:
        job = db.query(NamasteJob).filter(NamasteJob.job_id == job_id).first()
        if not job:
            raise ValueError("Job not found")

        try:
            job.status = "processing"
            db.commit()

            prompt = PROMPT_TEMPLATE.format(symptoms=text)

            response = model.generate_content(contents=[prompt])
            ai_text = response.text.strip() if response and response.text else "No response generated"

            try:
                parsed = json.loads(ai_text)
                validated_results = []
                for item in parsed:
                    codes = get_codes_for_diagnosis(item["diagnosis"])
                    if codes:
                        validated_results.append({
                            "diagnosis": item["diagnosis"],
                            "NAMASTE_Code": codes["NAMASTE_Code"],
                            "ICD/TM": codes["ICD/TM"],
                            "Biomedical": codes["Biomedical"]
                        })
                ai_text = json.dumps(validated_results)
            except Exception as e:
                print(f"⚠️ AI output parsing error: {e}")

            job.status = "completed"
            job.prompt = ai_text
            job.completed_at = datetime.utcnow()
            db.commit()

        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()

        return job
