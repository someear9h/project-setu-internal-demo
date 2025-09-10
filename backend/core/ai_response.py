import os
from sqlalchemy.orm import Session
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai

from core.ai_prompt import PROMPT_TEMPLATE
from models.job import NamasteJob

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

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

            job.status = "completed"
            job.prompt = ai_text        # ✅ store LLM response here
            job.completed_at = datetime.utcnow()
            db.commit()

        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()

        return job
