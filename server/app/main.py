from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.core.exceptions import APIException
from app.routers import auth_router, profile_router

from app.routers import disciplina_router
from app.routers import tarefa_router
from app.routers import material_router

app = FastAPI(title="Estudos Colaborativos API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else {}
    headers["Cache-Control"] = "no-store"
    return JSONResponse(
        status_code=exc.status_code,
        content={"erro": exc.error_code, "mensagem": exc.message},
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Never echo submitted passwords in validation responses.
    return JSONResponse(
        status_code=422,
        content={
            "erro": "DADOS_INVALIDOS", "mensagem": "Verifique os campos informados.",
            "campos": [
                {"campo": ".".join(str(part) for part in error["loc"]), "tipo": error["type"]}
                for error in exc.errors()
            ],
        },
        headers={"Cache-Control": "no-store"},
    )


app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Autentica\u00e7\u00e3o"])

app.include_router(profile_router.router, prefix="/api/v1/profile", tags=["Perfil"])

app.include_router(disciplina_router.router, prefix="/api/v1")
app.include_router(tarefa_router.router, prefix="/api/v1")
app.include_router(material_router.router, prefix="/api/v1")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok"}
