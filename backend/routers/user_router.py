from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas

router = APIRouter(prefix="", tags=["Users"])

@router.get("/users/me", response_model=schemas.UserPublic)
def get_me(username: str = None, db: Session = Depends(get_db)):
    # Example: In production you'd extract username from JWT in dependency (omitted for brevity)
    if not username:
        raise HTTPException(status_code=400, detail="pass username query param (demo)")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
