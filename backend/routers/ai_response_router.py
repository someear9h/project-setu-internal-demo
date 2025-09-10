import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from db.database import get_db, SessionLocal
from models.job import NamasteJob
from schemas.job import NamasteJobCreate, NamasteJobStatus
from core.ai_response import NamasteAiResponse  # the generator we built

router = APIRouter(tags=["NamasteAI"])


@router.post("/create-namaste-job", response_model=NamasteJobStatus)
def create_namaste_job(
    request: NamasteJobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    job_id = str(uuid.uuid4())
    job = NamasteJob(
        job_id=job_id,
        status="pending",
        prompt=None,
        error=None,
        completed_at=None,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Add background AI task
    background_tasks.add_task(
        NamasteAiResponse.generate,
        db,
        job_id,
        request.symptoms,
    )

    return NamasteJobStatus(
        job_id=job.job_id,
        status=job.status,
        prompt=job.prompt,
        error=job.error,
        created_at=job.created_at,
        completed_at=job.completed_at,
    )


@router.get("/namaste-job/{job_id}", response_model=NamasteJobStatus)
def get_namaste_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(NamasteJob).filter(NamasteJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return NamasteJobStatus.from_orm(job)
