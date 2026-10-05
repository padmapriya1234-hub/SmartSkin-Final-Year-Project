from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routes import auth, prediction, skincare, admin

app = FastAPI(
    title="SmartSkin API",
    description="AI-assisted preliminary skin-condition screening. "
                 "Educational tool only — not a medical diagnosis.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(prediction.router)
app.include_router(skincare.router)
app.include_router(admin.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Never leak Python stack traces to the client (Section 26).
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our end. Please try again."},
    )


@app.get("/")
def root():
    return {"message": "SmartSkin API is running. See /docs for API documentation."}
