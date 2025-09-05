from fastapi import APIRouter, Request, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.utils import strip_html, normalize_term, call_who_icd
from backend.icd_client import fetch_entity
from backend.db import get_db
from backend import models
from backend.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Terminology"])

# AUTOCOMPLETE
@router.get("/autocomplete-namaste")
def autocomplete_namaste_term(
    term: str,
    request: Request,
    limit: int = 10,
    _user=Depends(get_current_user) # _user for unused just for authentication
):
    namaste_data = request.app.state.namaste_data
    if not namaste_data:
        raise HTTPException(status_code=500, detail="NAMASTE data not loaded")
    q = normalize_term(term)
    results = []
    for item in namaste_data:
        if q in item.get("Traditional_Term", "").lower() or q in item.get("Biomedical_Term", "").lower() or q in item.get("System", "").lower():
            results.append(item)
            if len(results) >= limit:
                break
    return {"results": results}


class TranslateRequest(BaseModel):
    namaste_code: str
    namaste_display: str | None = None


@router.post("/translate/namaste-to-icd")
def translate_namaste(
    req: TranslateRequest,
    request: Request,
    db: Session = Depends(get_db),
    actor: str | None = "system",
    _user=Depends(get_current_user)
):
    # log audit
    db.add(models.AuditLog(
        actor=actor,
        action="translate",
        resource=req.namaste_code,
        details={"display": req.namaste_display or ""}
    ))
    db.commit()

    search_term = req.namaste_display or req.namaste_code
    uri = f"https://id.who.int/icd/entity/search?q={search_term}&flatResults=true&highlighting=false&useFlexisearch=true"

    try:
        search_res = call_who_icd(uri)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"WHO search failed: {e}")

    destination = search_res.get("destinationEntities") or []
    matches = []
    for d in destination:
        id_url = d.get("id")
        title = strip_html(d.get("title", ""))
        code = id_url.split("/")[-1] if id_url else None
        matches.append({"id": id_url, "code": code, "display": title})

    return {
        "namaste_code": req.namaste_code,
        "candidates": matches
    }


@router.get("/icd/entity")
def who_fetch_entity(
    uri: str,
    _user=Depends(get_current_user)
):
    try:
        entity = fetch_entity(uri)
        if "definition" in entity and entity["definition"]:
            entity["definition"]["@value"] = strip_html(entity["definition"]["@value"])
        return entity
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"WHO entity fetch failed: {e}")


@router.get("/who-icd-entity")
def get_who_icd_entity(
    uri: str = Query(..., description="WHO ICD entity URI"),
    _user=Depends(get_current_user)
):
    try:
        data = call_who_icd(uri)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
