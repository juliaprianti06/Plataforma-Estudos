# Import every model so Alembic sees all tables and foreign keys.
from app.models.coluna_kanban import ColunaKanban
from app.models.compartilha import Compartilha
from app.models.disciplinas import Disciplina
from app.models.grupo import Grupo
from app.models.grupo_disciplina import GrupoDisciplina
from app.models.material import Material
from app.models.material_grupo import MaterialGrupo
from app.models.membro_grupo import MembroGrupo
from app.models.resumo import Resumo
from app.models.subgrupo import Subgrupo
from app.models.tarefa import Tarefa
from app.models.tarefa_responsavel import TarefaResponsavel
from app.models.usuario import Usuario
from app.models.sessao_auth import SessaoAuth
