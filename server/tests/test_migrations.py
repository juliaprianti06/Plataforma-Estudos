from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext

from app.database import Base


def test_migrations_create_the_complete_model_schema(test_engine):
    with test_engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"compare_type": True})
        assert compare_metadata(context, Base.metadata) == []
