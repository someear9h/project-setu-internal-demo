from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models import model
from schemas import schema

router = APIRouter(prefix="", tags=["Users"])

@router.get("/users/me", response_model=schema.UserPublic)
def get_me(username: str = None, db: Session = Depends(get_db)):
    # Example: In production you'd extract username from JWT in dependency (omitted for brevity)
    if not username:
        raise HTTPException(status_code=400, detail="pass username query param (demo)")
    user = db.query(model.User).filter(model.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
