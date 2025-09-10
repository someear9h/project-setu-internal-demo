from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NamasteJobCreate(BaseModel):
    symptoms: str   # doctor enters symptoms


class NamasteJobStatus(BaseModel):
    job_id: str
    status: str
    prompt: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True   # ✅ Pydantic v2 fix
