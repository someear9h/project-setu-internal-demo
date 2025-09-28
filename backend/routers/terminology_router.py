from fastapi import APIRouter, Request, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from core.utils import strip_html, normalize_term, call_who_icd
from core.icd_client import fetch_entity, search_icd, get_icd_entity
from db.database import get_db
from models import model
from core.auth import get_current_user

router = APIRouter(tags=["Terminology"])

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
    db.add(model.AuditLog(
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
        entity_id = id_url.split("/")[-1] if id_url else None
        title = strip_html(d.get("title", ""))
        matches.append({
            "id": id_url,
            "entity_id": entity_id,
            "display": title
        })

    return {
        "namaste_code": req.namaste_code,
        "candidates": matches
    }

@router.get("/search/{diagnosis}")
def search_icd_code(diagnosis: str):
    """
    Search ICD-11 codes by diagnosis name
    """
    results = search_icd(diagnosis)
    destination_entities = results.get("destinationEntities", [])
    formatted_results = []

    for item in destination_entities:
        id_val = item.get("id")

        # Handle both dict and string cases for title
        title_val = item.get("title")
        if isinstance(title_val, dict):
            title_val = title_val.get("@value", "N/A")
        elif not title_val:
            title_val = "N/A"

        formatted_results.append({
            "id": id_val,
            "title": title_val
        })

    return {"query": diagnosis, "results": formatted_results}


@router.get("/entity/{entity_id}")
def get_icd_entity_details(entity_id: str):
    """
    Get ICD-11 entity details by numeric ID (e.g., 2020851679)
    """
    return get_icd_entity(entity_id)

