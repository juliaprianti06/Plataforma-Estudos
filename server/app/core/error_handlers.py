import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import APIException

logger = logging.getLogger(__name__)

NO_STORE = {"Cache-Control": "no-store"}

ERROS_HTTP = {
    400: ("REQUISICAO_INVALIDA", "Requisicao invalida."),
    401: ("NAO_AUTENTICADO", "Autenticacao necessaria."),
    403: ("SEM_PERMISSAO", "Voce nao tem permissao para realizar esta acao."),
    404: ("NAO_ENCONTRADO", "Recurso nao encontrado."),
    405: ("METODO_NAO_PERMITIDO", "Metodo nao permitido."),
}

MENSAGENS_VALIDACAO = {
    "missing": "Campo obrigatorio.",
    "too_short": "Deve ter no minimo {min_length} caracteres.",
    "too_long": "Deve ter no maximo {max_length} caracteres.",
    "string_type": "Deve ser um texto.",
    "string_pattern_mismatch": "Formato invalido.",
    "extra_forbidden": "Campo nao permitido.",
    "json_invalid": "O corpo da requisicao nao e um JSON valido.",
    "enum": "Valor nao permitido.",
    "int_parsing": "Deve ser um numero inteiro.",
    "greater_than_equal": "Valor abaixo do minimo permitido.",
    "less_than_equal": "Valor acima do maximo permitido.",
}


def _mensagem_campo(error: dict) -> str:
    campo = str(error["loc"][-1]) if error["loc"] else ""
    if error["type"] == "value_error" and campo == "email":
        return "Informe um e-mail valido."
    modelo = MENSAGENS_VALIDACAO.get(error["type"])
    if modelo is None:
        return "Valor invalido."
    try:
        return modelo.format(**(error.get("ctx") or {}))
    except (KeyError, IndexError):
        return "Valor invalido."


def _nome_campo(loc: tuple) -> str:
    partes = [str(p) for p in loc if p not in ("body", "query", "path")]
    return ".".join(partes)


def registrar_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        headers = dict(NO_STORE)
        if exc.status_code == 401:
            headers["WWW-Authenticate"] = "Bearer"
        if exc.status_code == 429:
            headers["Retry-After"] = str(getattr(exc, "retry_after", 60))
        return JSONResponse(
            status_code=exc.status_code,
            content={"erro": exc.error_code, "mensagem": exc.message},
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "erro": "DADOS_INVALIDOS",
                "mensagem": "Verifique os campos informados.",
                "campos": [
                    {
                        "campo": _nome_campo(e["loc"]),
                        "tipo": e["type"],
                        "mensagem": _mensagem_campo(e),
                    }
                    for e in exc.errors()
                ],
            },
            headers=NO_STORE,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        codigo, mensagem = ERROS_HTTP.get(
            exc.status_code, ("ERRO_HTTP", "Nao foi possivel processar a requisicao.")
        )
        headers = dict(exc.headers or {})
        headers.update(NO_STORE)
        return JSONResponse(
            status_code=exc.status_code,
            content={"erro": codigo, "mensagem": mensagem},
            headers=headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Erro nao tratado em %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"erro": "ERRO_INTERNO", "mensagem": "Erro interno. Tente novamente mais tarde."},
            headers=NO_STORE,
        )
