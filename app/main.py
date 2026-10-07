from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import Base, engine
from .routers import admin, auth, counters, queues, services

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud-Based Smart Queue Manager API",
    description="Local prototype backend for a Distributed and Cloud Computing mini-project.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(services.router)
app.include_router(queues.router)
app.include_router(counters.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "Cloud-Based Smart Queue Manager"}

@app.get("/api", tags=["Health"])
def api_root():
    return {
        "service": "Cloud-Based Smart Queue Manager",
        "status": "ok",
        "docs": "/docs",
    }

@app.exception_handler(Exception)
async def unexpected_error_handler(request, exc):
    # Keep unexpected errors JSON-shaped for frontend compatibility.
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
