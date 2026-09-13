import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

# Tests require an explicitly chosen PostgreSQL database, never the app database.
test_url = os.environ.get("TEST_DATABASE_URL")
if not test_url:
    raise pytest.UsageError("Set TEST_DATABASE_URL to a dedicated PostgreSQL database ending in _test.")
parsed_url = make_url(test_url)
if parsed_url.get_backend_name() != "postgresql" or not (parsed_url.database or "").endswith("_test"):
    raise pytest.UsageError("TEST_DATABASE_URL must use PostgreSQL and a database ending in _test.")
os.environ["DATABASE_URL"] = test_url
os.environ["JWT_SECRET"] = "test-only-secret-that-is-not-used-by-the-application"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["CORS_ORIGINS"] = '["http://localhost:5173"]'

from fastapi.testclient import TestClient
from app.database import get_db
from app.main import app


@pytest.fixture(scope="session")
def test_engine():
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    engine = create_engine(test_url)
    yield engine
    engine.dispose()


@pytest.fixture
def db(test_engine):
    # Endpoint commits release savepoints; the outer transaction isolates tests.
    with test_engine.connect() as connection:
        transaction = connection.begin()
        with Session(bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False) as session:
            yield session
        transaction.rollback()


@pytest.fixture
def client(db):
    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
