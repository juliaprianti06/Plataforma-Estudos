from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.exceptions import APIException


from app.routers import auth_router
from app.routers import disciplina_router

app = FastAPI(
    title="Estudos Colaborativos API",
    description="Backend para a plataforma de estudos",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "erro": exc.error_code,
            "mensagem": exc.message
        },
    )


app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Autenticação"])
app.include_router(disciplina_router.router, prefix="/api/v1")

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok"}