from sqlalchemy.orm import Session

from app.core.exceptions import NaoEncontradoError
from app.models.sessao_estudo import SessaoEstudo
from app.repository.sessao_estudo_repository import SessaoEstudoRepository
from app.schemas.sessao_estudo_schema import SessaoEstudoInput


class SessaoEstudoService:
    def __init__(self, db: Session):
        self.repository = SessaoEstudoRepository(db)

    def listar(self, usuario_id: int):
        return self.repository.listar(usuario_id)

    def _buscar(self, usuario_id: int, sessao_id: int):
        sessao = self.repository.buscar(usuario_id, sessao_id)
        if sessao is None:
            raise NaoEncontradoError('Sessão de estudo não encontrada.')
        return sessao

    def _preencher(self, sessao: SessaoEstudo, usuario_id: int, dados: SessaoEstudoInput):
        disciplina = self.repository.buscar_disciplina(usuario_id, dados.disciplina_id)
        if disciplina is None:
            raise NaoEncontradoError('Disciplina não encontrada.')
        sessao.disciplina = disciplina
        sessao.data = dados.data
        sessao.inicio = dados.inicio
        sessao.termino = dados.termino
        sessao.duracao_minutos = dados.duracao_minutos
        sessao.observacao = dados.observacao
        return self.repository.salvar(sessao)

    def criar(self, usuario_id: int, dados: SessaoEstudoInput):
        return self._preencher(SessaoEstudo(usuario_id=usuario_id), usuario_id, dados)

    def editar(self, usuario_id: int, sessao_id: int, dados: SessaoEstudoInput):
        return self._preencher(self._buscar(usuario_id, sessao_id), usuario_id, dados)

    def excluir(self, usuario_id: int, sessao_id: int):
        self.repository.excluir(self._buscar(usuario_id, sessao_id))
