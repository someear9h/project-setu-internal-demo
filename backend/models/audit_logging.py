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