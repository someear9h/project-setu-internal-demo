from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None

class UserPublic(BaseModel):
    id: str
    username: str
    full_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ConditionCreate(BaseModel):
    patient_id: str
    namaste_code: Optional[str]
    namaste_display: Optional[str]
    icd_code: Optional[str]
    icd_display: Optional[str]

class ConditionOut(ConditionCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class FhirBundle(BaseModel):
    resourceType: str
    type: Optional[str]
    entry: Optional[List[Any]]
