from importlib import import_module

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import text


def test_migration_preserva_legado_e_default_apenas_para_novos(test_engine):
    migration = import_module('app.alembic.versions.d10a20260923_adiciona_datas_tarefas')
    with test_engine.begin() as connection:
        connection.execute(text('CREATE TEMP TABLE tarefas (id integer PRIMARY KEY, status text) ON COMMIT DROP'))
        connection.execute(text("INSERT INTO tarefas VALUES (1, 'concluido'), (2, 'a_fazer')"))
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
            antigas = connection.execute(text('SELECT criado_em, concluido_em FROM tarefas ORDER BY id')).all()
            assert antigas == [(None, None), (None, None)]
            connection.execute(text("INSERT INTO tarefas (id, status) VALUES (3, 'a_fazer')"))
            nova = connection.execute(text('SELECT criado_em, concluido_em FROM tarefas WHERE id = 3')).one()
            assert nova.criado_em is not None
            assert nova.criado_em.tzinfo is not None
            assert nova.concluido_em is None
            migration.downgrade()
            result = connection.execute(text('SELECT * FROM tarefas ORDER BY id'))
            assert list(result.keys()) == ['id', 'status']
            assert result.all() == [(1, 'concluido'), (2, 'a_fazer'), (3, 'a_fazer')]
