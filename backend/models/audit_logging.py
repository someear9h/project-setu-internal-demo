from datetime import datetime
from db.database import Base
from pydantic import BaseModel
from typing import Optional, Dict
from sqlalchemy import Column, String, DateTime, JSON

from models.model import uuid4_str


class AuditLogDetails(BaseModel):
    # This allows for flexible JSON data
    pass

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=uuid4_str)
    actor = Column(String)  # user id or system
    action = Column(String) # create/search/translate/upload
    resource = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLogResponse(BaseModel):
    id: str
    created_at: datetime
    actor: str
    action: str
    resource: Optional[str] = None
    details: Optional[Dict] = None

    class Config:
        orm_mode = True

class Condition(Base):
    __tablename__ = "conditions"
    id = Column(String, primary_key=True, default=uuid4_str)
    patient_id = Column(String, index=True, nullable=False)
    namaste_code = Column(String, nullable=True)
    namaste_display = Column(String, nullable=True)
    icd_code = Column(String, nullable=True)
    icd_display = Column(String, nullable=True)
    source = Column(String, nullable=True)  # e.g., 'bundle-upload' or 'manual'
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    raw_fhir = Column(JSON, nullable=True)  # store full fhir resource for audit