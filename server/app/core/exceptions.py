class APIException(Exception):
    def __init__(self, message: str, status_code: int, error_code: str):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

class NaoEncontradoError(APIException):
    def __init__(self, message: str = "Recurso não encontrado"):
        super().__init__(message=message, status_code=404, error_code="NAO_ENCONTRADO")

class RegraNegocioError(APIException):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=400, error_code="REGRA_NEGOCIO")

class NaoAutenticadoError(APIException):
    def __init__(self, message: str = "Autenticação necessária"):
        super().__init__(message=message, status_code=401, error_code="NAO_AUTENTICADO")

class SemPermissaoError(APIException):
    def __init__(self, message: str = "Você não tem permissão para realizar esta ação"):
        super().__init__(message=message, status_code=403, error_code="SEM_PERMISSAO")

class ConflitoError(APIException):
    def __init__(self, message: str):
        super().__init__(message=message, status_code=409, error_code="CONFLITO")