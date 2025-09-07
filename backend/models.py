import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from .db import Base

def uuid4_str():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=uuid4_str)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=uuid4_str)
    actor = Column(String)  # user id or system
    action = Column(String) # create/search/translate/upload
    resource = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
