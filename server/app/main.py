from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.error_handlers import registrar_handlers
from app.routers import auth_router

app = FastAPI(title="Estudos Colaborativos API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

registrar_handlers(app)

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Autenticação"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok"}