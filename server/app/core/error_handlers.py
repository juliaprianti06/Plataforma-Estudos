import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import APIException

logger = logging.getLogger(__name__)

NO_STORE = {"Cache-Control": "no-store"}

ERROS_HTTP = {
    400: ("REQUISICAO_INVALIDA", "Requisição inválida."),
    401: ("NAO_AUTENTICADO", "Autenticação necessária."),
    403: ("SEM_PERMISSAO", "Você não tem permissão para realizar esta ação."),
    404: ("NAO_ENCONTRADO", "Recurso não encontrado."),
    405: ("METODO_NAO_PERMITIDO", "Método não permitido."),
}

MENSAGENS_VALIDACAO = {
    "missing": "Campo obrigatório.",
    "too_short": "Deve ter no mínimo {min_length} caracteres.",
    "too_long": "Deve ter no máximo {max_length} caracteres.",
    "string_type": "Deve ser um texto.",
    "string_pattern_mismatch": "Formato inválido.",
    "extra_forbidden": "Campo não permitido.",
    "json_invalid": "O corpo da requisição não é um JSON válido.",
    "enum": "Valor não permitido.",
    "int_parsing": "Deve ser um número inteiro.",
    "greater_than_equal": "Valor abaixo do mínimo permitido.",
    "less_than_equal": "Valor acima do máximo permitido.",
}


def _mensagem_campo(error: dict) -> str:
    campo = str(error["loc"][-1]) if error["loc"] else ""
    if error["type"] == "value_error" and campo == "email":
        return "Informe um e-mail válido."
    modelo = MENSAGENS_VALIDACAO.get(error["type"])
    if modelo is None:
        return "Valor inválido."
    try:
        return modelo.format(**(error.get("ctx") or {}))
    except (KeyError, IndexError):
        return "Valor inválido."


def _nome_campo(loc: tuple) -> str:
    partes = [str(p) for p in loc if p not in ("body", "query", "path")]
    return ".".join(partes)


def registrar_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        headers = dict(NO_STORE)
        if exc.status_code == 401:
            headers["WWW-Authenticate"] = "Bearer"
        return JSONResponse(
            status_code=exc.status_code,
            content={"erro": exc.error_code, "mensagem": exc.message},
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Nunca devolver "input": pode conter senha.
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
            exc.status_code, ("ERRO_HTTP", "Não foi possível processar a requisição.")
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
        logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"erro": "ERRO_INTERNO", "mensagem": "Erro interno. Tente novamente mais tarde."},
            headers=NO_STORE,
        )