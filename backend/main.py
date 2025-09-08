from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, csv
from core.config import settings
from db.database import create_tables
from fastapi.openapi.utils import get_openapi
from routers import auth_router, user_router, terminology_router, condition_router

# https://209f44ba-8eb5-477c-aaa0-d3ca9bc0e0e9-dev.e1-us-east-azure.choreoapis.dev/project-setu-internal-dem/backend/v1.0
API_PREFIX = "/project-setu-internal-dem/backend/v1.0"
app = FastAPI(
    title="NAMASTE ↔ ICD-11 Terminology Microservice",
    root_path=API_PREFIX
)

# CORS
allow_orig = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= Swagger JWT =================
app.openapi_schema = None  # force regen

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description="NAMASTE ↔ ICD-11 Terminology Microservice",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    for path in openapi_schema["paths"].values():
        for op in path.values():
            op["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi


# ================= HEALTH CHECK =================
@app.get("https://209f44ba-8eb5-477c-aaa0-d3ca9bc0e0e9-dev.e1-us-east-azure.choreoapis.dev/project-setu-internal-dem/backend/v1.0/", tags=["Health Check"])
def choreo_health_check():
    return {"status": "ok", "message": "Ayush FHIR Coder is running"}


# ================= NAMASTE CSV =================
csv_path = os.path.join(os.path.dirname(__file__), "data", "namaste.csv")
namaste_data = []
if os.path.exists(csv_path):
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        namaste_data = [row for row in reader]
    print(f"Loaded {len(namaste_data)} NAMASTE terms.")
else:
    print("NAMASTE CSV not found at", csv_path)
app.state.namaste_data = namaste_data


# ================= CREATE DB =================
create_tables()


# ================= INCLUDE ROUTERS =================
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(terminology_router.router)
app.include_router(condition_router.router)


# ================= RUN LOCAL =================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
