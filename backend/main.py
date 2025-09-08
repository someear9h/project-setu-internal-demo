from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
import os, csv

# --- Corrected Imports (assuming your structure) ---
from core.config import settings
from db.database import create_tables
from routers import auth_router, user_router, terminology_router, condition_router

# --- Choreo API Prefix ---
# This prefix is added to all routes to match Choreo's gateway URL
# API_PREFIX = "/project-setu-internal-dem/backend/v1.0"


# --- Lifespan Function (for startup logic) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on application startup
    print("--- Starting up application ---")

    # Load NAMASTE CSV data into application state
    csv_path = os.path.join(os.path.dirname(__file__), "data", "namaste.csv")
    if os.path.exists(csv_path):
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            app.state.namaste_data = [row for row in reader]
        print(f"Loaded {len(app.state.namaste_data)} NAMASTE terms.")
    else:
        app.state.namaste_data = []
        print(f"Warning: NAMASTE CSV not found at {csv_path}")

    # Create database tables
    create_tables()
    print("Database tables checked/created.")

    yield
    # Code to run on application shutdown
    print("--- Shutting down application ---")


# --- FastAPI App Initialization ---
app = FastAPI(
    title="NAMASTE ↔ ICD-11 Terminology Microservice",
    lifespan=lifespan
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Custom OpenAPI for JWT Authentication in Docs ---
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
    # Apply security scheme to all paths
    api_router = next(route for route in app.routes if route.path == API_PREFIX)
    for route in api_router.routes:
        path = getattr(route, "path")
        for method in getattr(route, "methods"):
            # Exclude auth routes from default security
            if path not in ["/api/token", "/api/register"]:
                openapi_schema["paths"][f"{API_PREFIX}{path}"][method.lower()]["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# --- Health Check Endpoint (with prefix) ---
# This is what Choreo will ping to see if your service is alive.
@app.get(f"{settings.API_PREFIX}/", tags=["Health Check"])
def health_check():
    return {"status": "ok", "message": "Ayush FHIR Coder is running"}


# --- Include Routers with the Choreo Prefix ---
# This mounts all your API endpoints under the main prefix.
# e.g., auth_router's /api/token becomes /project-setu-internal-dem/backend/v1.0/api/token

app.include_router(auth_router.router, prefix=settings.API_PREFIX)

app.include_router(user_router.router, prefix = settings.API_PREFIX)
app.include_router(terminology_router.router, prefix = settings.API_PREFIX)
app.include_router(condition_router.router, prefix = settings.API_PREFIX)



# --- Local Development Runner ---
if __name__ == "__main__":
    import uvicorn

    # Note: For local running, URLs will now include the prefix,
    # e.g., http://localhost:8000/project-setu-internal-dem/backend/v1.0/docs
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)