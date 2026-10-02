from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.core.error_handlers import registrar_handlers
from app.routers import (
    auth_router,
    dashboard_router,
    disciplina_router,
    groups_router,
    material_router,
    profile_router,
    progresso_router,
    tarefa_router,
    tasks_router,
)

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
app.include_router(profile_router.router, prefix="/api/v1/profile", tags=["Perfil"])
app.include_router(groups_router.router, prefix="/api/v1/groups", tags=["Grupos"])
app.include_router(dashboard_router.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(tasks_router.router, prefix="/api/v1", tags=["Colaboração"])

app.include_router(disciplina_router.router, prefix="/api/v1")
app.include_router(tarefa_router.router, prefix="/api/v1")
app.include_router(material_router.router, prefix="/api/v1")
app.include_router(progresso_router.router, prefix="/api/v1")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok"}
