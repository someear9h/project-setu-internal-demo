from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from db.database import Base

class NamasteJob(Base):
    __tablename__="jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)
    prompt = Column(Text, nullable=True)
    status = Column(String, default="pending")  # Options: pending, processing, completed, failed
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)