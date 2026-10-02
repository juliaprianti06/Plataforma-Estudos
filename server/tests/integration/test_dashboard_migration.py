from importlib import import_module

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import text


def test_dashboard_migration_preserves_existing_tasks(test_engine):
    migration = import_module('app.alembic.versions.t10a20260913_eventos_kanban')
    with test_engine.begin() as connection:
        # All DDL is confined to temporary tables on this connection.
        connection.execute(text('SET LOCAL search_path TO pg_temp'))
        connection.execute(text('CREATE TEMP TABLE usuarios (id_usuario integer PRIMARY KEY) ON COMMIT DROP'))
        connection.execute(text('CREATE TEMP TABLE grupos (id_grupo integer PRIMARY KEY) ON COMMIT DROP'))
        connection.execute(text('CREATE TEMP TABLE colunas_kanban (id_coluna serial PRIMARY KEY, id_grupo integer, nome text, ordem integer) ON COMMIT DROP'))
        connection.execute(text('CREATE TEMP TABLE tarefas (id integer PRIMARY KEY, nome text, disciplina_id integer NOT NULL, id_coluna integer) ON COMMIT DROP'))
        connection.execute(text("INSERT INTO tarefas VALUES (1, 'Estudar Python', 10, NULL)"))
        connection.execute(text('INSERT INTO grupos VALUES (1)'))
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
            row = connection.execute(text('SELECT id, nome, disciplina_id, descricao, data_prazo FROM tarefas')).one()
            assert tuple(row) == (1, 'Estudar Python', 10, '', None)
            assert connection.scalar(text('SELECT count(*) FROM colunas_kanban')) == 3
            migration.downgrade()
            row = connection.execute(text('SELECT id, nome, disciplina_id FROM tarefas')).one()
            assert tuple(row) == (1, 'Estudar Python', 10)
