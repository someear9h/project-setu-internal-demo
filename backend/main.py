from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
import os, csv

from core.config import settings
from db.database import create_tables
from routers import auth_router, user_router, terminology_router, condition_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- Starting up application ---")

    # Load NAMASTE CSV
    csv_path = os.path.join(os.path.dirname(__file__), "data", "namaste.csv")
    if os.path.exists(csv_path):
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            app.state.namaste_data = [row for row in reader]
        print(f"Loaded {len(app.state.namaste_data)} NAMASTE terms.")
    else:
        app.state.namaste_data = []
        print(f"Warning: NAMASTE CSV not found at {csv_path}")

    create_tables()
    print("Database tables checked/created.")

    yield
    print("--- Shutting down application ---")


app = FastAPI(
    title="NAMASTE ↔ ICD-11 Terminology Microservice",
    lifespan=lifespan
)


# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Custom OpenAPI (secured by default except /register, /token) ---
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
        "BearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
    }

    # Apply BearerAuth to all paths except register/token
    for path, methods in openapi_schema["paths"].items():
        if not (path.endswith("/token") or path.endswith("/register")):
            for method in methods.values():
                method.setdefault("security", [{"BearerAuth": []}])

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi


# --- Health Check ---
@app.get("/", tags=["Health Check"])
def health_check():
    return {"status": "ok", "message": "Ayush FHIR Coder is running"}


# --- Routers ---
app.include_router(auth_router.router, prefix=settings.API_PREFIX)
app.include_router(user_router.router, prefix=settings.API_PREFIX)
app.include_router(terminology_router.router, prefix=settings.API_PREFIX)
app.include_router(condition_router.router, prefix=settings.API_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
